"""Team invite system — send, accept, list, and cancel invites."""
from fastapi import APIRouter, HTTPException, Request, Depends
from middleware.auth_middleware import require_auth, require_active
from database import get_postgres_pool, get_mongo_db
from services.email_service import send_team_invite
from utils.auth import hash_password
from datetime import datetime, timedelta, timezone
import secrets
import uuid
import json
import logging

router = APIRouter()
logger = logging.getLogger("team")

INVITE_TTL_DAYS = 7


@router.post("/invite")
async def create_invite(request: Request, user: dict = Depends(require_active)):
    """Send a team invite email. Requires owner/manager/ceo/platform_admin role."""
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    role = (body.get("role") or "staff").strip().lower()
    venue_id = body.get("venue_id")
    permissions = body.get("permissions", {})

    if not email:
        raise HTTPException(status_code=400, detail="email is required")

    allowed_roles = {"staff", "host", "tap", "kitchen", "cashier", "manager", "owner", "bartender"}
    if role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {', '.join(sorted(allowed_roles))}")

    # Check inviter has permission (owner, manager, ceo, or platform_admin)
    inviter_roles = set()
    company_id = None
    for r in user.get("roles", []):
        if isinstance(r, dict):
            inviter_roles.add(r.get("role", ""))
            if not company_id:
                company_id = r.get("company_id")

    management_roles = {"owner", "manager", "ceo", "platform_admin"}
    if not inviter_roles.intersection(management_roles):
        raise HTTPException(status_code=403, detail="Only owners/managers can send invites")

    if not company_id:
        raise HTTPException(status_code=400, detail="No company associated with your account")

    pool = get_postgres_pool()
    db = get_mongo_db()

    # Check if email already has an account
    async with pool.acquire() as conn:
        existing_user = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)

    # Check for pending invite
    existing_invite = await db.team_invites.find_one({
        "email": email,
        "company_id": company_id,
        "status": "pending",
    })
    if existing_invite:
        raise HTTPException(status_code=409, detail="An invite is already pending for this email")

    # Get inviter info
    async with pool.acquire() as conn:
        inviter_row = await conn.fetchrow(
            "SELECT name FROM users WHERE id = $1::uuid", user["sub"]
        )
        company_row = await conn.fetchrow(
            "SELECT name FROM companies WHERE id = $1::uuid", company_id
        )

    inviter_name = inviter_row["name"] if inviter_row else user.get("email", "Team Admin")
    company_name = company_row["name"] if company_row else "Your Team"

    now = datetime.now(timezone.utc)
    token = secrets.token_urlsafe(48)
    invite_id = str(uuid.uuid4())

    invite_doc = {
        "id": invite_id,
        "token": token,
        "company_id": company_id,
        "venue_id": venue_id,
        "email": email,
        "role": role,
        "permissions": permissions,
        "invited_by_user_id": user["sub"],
        "invited_by_name": inviter_name,
        "company_name": company_name,
        "status": "pending",
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=INVITE_TTL_DAYS)).isoformat(),
        "accepted_at": None,
        "has_existing_account": existing_user is not None,
    }
    await db.team_invites.insert_one(invite_doc)

    # Build invite URL
    origin = body.get("origin_url", "https://app.spetapp.com")
    invite_url = f"{origin}/invite/accept?token={token}"

    # Send email
    await send_team_invite(inviter_name, company_name, role, email, invite_url)

    # Audit log
    await db.audit_log.insert_one({
        "event_type": "team_invite_sent",
        "user_id": user["sub"],
        "target_email": email,
        "details": {"role": role, "company_id": company_id, "invite_id": invite_id},
        "created_at": now.isoformat(),
    })

    logger.info(f"[TEAM] Invite sent to {email} as {role} by {user['sub']}")
    return {"invite_id": invite_id, "email": email, "role": role, "status": "pending"}


@router.post("/accept-invite")
async def accept_invite(request: Request):
    """Accept a team invite. Creates account if needed, or adds access to existing account."""
    body = await request.json()
    token = (body.get("token") or "").strip()
    name = (body.get("name") or "").strip()
    password = body.get("password")

    if not token:
        raise HTTPException(status_code=400, detail="token is required")

    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    invite = await db.team_invites.find_one({"token": token, "status": "pending"})
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invite")

    expires_at = datetime.fromisoformat(invite["expires_at"])
    if now > expires_at:
        await db.team_invites.update_one({"_id": invite["_id"]}, {"$set": {"status": "expired"}})
        raise HTTPException(status_code=410, detail="Invite has expired")

    pool = get_postgres_pool()
    email = invite["email"]
    company_id = invite["company_id"]
    venue_id = invite.get("venue_id")
    role = invite["role"]
    permissions = invite.get("permissions", {})

    async with pool.acquire() as conn:
        existing_user = await conn.fetchrow(
            "SELECT id, name FROM users WHERE email = $1", email
        )

        if existing_user:
            user_id = existing_user["id"]
        else:
            # Create new account
            if not password:
                raise HTTPException(status_code=400, detail="password is required for new accounts")
            if not name:
                name = email.split("@")[0]

            hashed = hash_password(password)
            row = await conn.fetchrow(
                """INSERT INTO users (name, email, password_hash, role, status, onboarding_completed, created_at, updated_at)
                   VALUES ($1, $2, $3, 'USER', 'active', TRUE, $4, $4) RETURNING id""",
                name, email, hashed, now,
            )
            user_id = row["id"]

        # Check if access already exists
        existing_access = await conn.fetchrow(
            "SELECT id FROM user_access WHERE user_id = $1 AND company_id = $2::uuid",
            user_id, uuid.UUID(company_id),
        )

        if existing_access:
            # Update role/permissions
            await conn.execute(
                "UPDATE user_access SET role = $1, permissions = $2::jsonb WHERE user_id = $3 AND company_id = $4::uuid",
                role, json.dumps(permissions), user_id, uuid.UUID(company_id),
            )
        else:
            # Create access
            venue_uuid = uuid.UUID(venue_id) if venue_id else None
            await conn.execute(
                """INSERT INTO user_access (user_id, company_id, venue_id, role, permissions, created_at)
                   VALUES ($1, $2::uuid, $3, $4, $5::jsonb, $6)""",
                user_id, uuid.UUID(company_id), venue_uuid, role, json.dumps(permissions), now,
            )

    # Mark invite as accepted
    await db.team_invites.update_one(
        {"_id": invite["_id"]},
        {"$set": {"status": "accepted", "accepted_at": now.isoformat(), "accepted_user_id": str(user_id)}},
    )

    await db.audit_log.insert_one({
        "event_type": "team_invite_accepted",
        "user_id": str(user_id),
        "details": {"invite_id": invite["id"], "role": role, "company_id": company_id},
        "created_at": now.isoformat(),
    })

    logger.info(f"[TEAM] Invite accepted by {email} as {role}")
    return {
        "accepted": True,
        "user_id": str(user_id),
        "email": email,
        "role": role,
        "is_new_account": existing_user is None if 'existing_user' in dir() else True,
    }


@router.get("/invites")
async def list_invites(user: dict = Depends(require_active)):
    """List team invites for the user's company."""
    company_id = None
    for r in user.get("roles", []):
        if isinstance(r, dict) and r.get("company_id"):
            company_id = r["company_id"]
            break

    if not company_id:
        return {"invites": []}

    db = get_mongo_db()
    cursor = db.team_invites.find(
        {"company_id": company_id},
        {"_id": 0, "token": 0},
    ).sort("created_at", -1).limit(50)

    invites = await cursor.to_list(50)
    return {"invites": invites}


@router.post("/cancel-invite")
async def cancel_invite(request: Request, user: dict = Depends(require_active)):
    """Cancel a pending team invite."""
    body = await request.json()
    invite_id = body.get("invite_id")
    if not invite_id:
        raise HTTPException(status_code=400, detail="invite_id is required")

    db = get_mongo_db()
    invite = await db.team_invites.find_one({"id": invite_id, "status": "pending"})
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already processed")

    # Verify ownership
    company_id = None
    for r in user.get("roles", []):
        if isinstance(r, dict) and r.get("company_id"):
            company_id = r["company_id"]
            break

    if invite["company_id"] != company_id:
        raise HTTPException(status_code=403, detail="Access denied")

    await db.team_invites.update_one(
        {"_id": invite["_id"]},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"cancelled": True, "invite_id": invite_id}
