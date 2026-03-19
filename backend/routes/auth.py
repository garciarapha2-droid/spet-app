from fastapi import APIRouter, HTTPException, Request, Depends
from models.requests import LoginRequest, SignupRequest
from utils.auth import hash_password, verify_password, create_access_token
from middleware.auth_middleware import require_auth
from database import get_postgres_pool, get_mongo_db
from config import get_settings
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from datetime import datetime, timedelta, timezone
import json
import uuid
import secrets
import logging

router = APIRouter()
logger = logging.getLogger("auth")
settings = get_settings()

PROTECTED_SYSTEM_ACCOUNTS = {"teste@teste.com", "garcia.rapha2@gmail.com"}

PLANS = {
    "starter": {"name": "Starter", "price": 79.00, "currency": "usd"},
    "growth": {"name": "Growth", "price": 149.00, "currency": "usd"},
    "enterprise": {"name": "Enterprise", "price": 299.00, "currency": "usd"},
}

HANDOFF_TTL_SECONDS = 60


def _build_token_and_response(user_row, access_roles, checkout_url=None):
    """Build JWT + response for login/signup."""
    user_role = user_row.get("role", "USER") if hasattr(user_row, "get") else "USER"
    status = user_row.get("status", "active") if hasattr(user_row, "get") else "active"
    onboarding = user_row.get("onboarding_completed", False) if hasattr(user_row, "get") else False

    token_data = {
        "sub": str(user_row["id"]),
        "email": user_row["email"],
        "role": user_role,
        "roles": access_roles,
        "status": status,
    }
    access_token = create_access_token(token_data)

    if status == "pending_payment":
        next_route = "/payment"
    elif not onboarding:
        next_route = "/onboarding"
    else:
        next_route = "/app"

    created_at = user_row["created_at"]
    if hasattr(created_at, "isoformat"):
        created_at = created_at.isoformat()

    response = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user_row["id"]),
            "email": user_row["email"],
            "name": user_row.get("name") if hasattr(user_row, "get") else user_row["name"],
            "role": user_role,
            "status": status,
            "onboarding_completed": onboarding,
            "created_at": created_at,
        },
        "next": {"type": "route", "route": next_route},
    }

    if checkout_url:
        response["checkout_url"] = checkout_url

    return response


@router.post("/signup")
async def signup(request: SignupRequest):
    pool = get_postgres_pool()
    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", request.email.lower()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = hash_password(request.password)
        plan_id = request.plan_id or "starter"

        user_row = await conn.fetchrow(
            """INSERT INTO users (name, email, password_hash, status, plan_id, onboarding_completed, onboarding_step, created_at, updated_at)
               VALUES ($1, $2, $3, 'pending_payment', $4, FALSE, 0, $5, $5)
               RETURNING id, name, email, role, status, plan_id, onboarding_completed, created_at""",
            request.name,
            request.email.lower(),
            hashed_password,
            plan_id,
            now,
        )
        user_id = user_row["id"]

        company_name = request.company_name or f"{request.name or request.email.split('@')[0]}'s Venue"
        company_row = await conn.fetchrow(
            "INSERT INTO companies (name, status, created_at, updated_at) VALUES ($1, 'active', $2, $2) RETURNING id",
            company_name, now,
        )
        company_id = company_row["id"]

        await conn.execute(
            """INSERT INTO user_access (user_id, company_id, role, permissions, created_at)
               VALUES ($1, $2, 'owner', '{}'::jsonb, $3)""",
            user_id, company_id, now,
        )

    checkout_url = None
    if plan_id in PLANS and request.origin_url:
        try:
            plan = PLANS[plan_id]
            success_url = f"{request.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{request.origin_url}/signup"

            stripe_checkout = StripeCheckout(
                api_key=settings.stripe_api_key,
                webhook_url=f"{request.origin_url}/api/webhook/stripe",
            )

            checkout_req = CheckoutSessionRequest(
                amount=plan["price"],
                currency=plan["currency"],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    "user_id": str(user_id),
                    "company_id": str(company_id),
                    "plan_id": plan_id,
                    "email": request.email.lower(),
                },
            )

            session = await stripe_checkout.create_checkout_session(checkout_req)
            checkout_url = session.url

            tx_doc = {
                "id": str(uuid.uuid4()),
                "user_id": str(user_id),
                "company_id": str(company_id),
                "stripe_session_id": session.session_id,
                "plan_id": plan_id,
                "amount": plan["price"],
                "currency": plan["currency"],
                "payment_status": "pending",
                "created_at": now.isoformat(),
            }
            await db.payment_transactions.insert_one(tx_doc)
        except Exception as e:
            logger.error(f"[SIGNUP] Stripe checkout creation failed: {e}")

    access_roles = [{
        "user_id": str(user_id),
        "company_id": str(company_id),
        "venue_id": None,
        "role": "owner",
        "permissions": {},
    }]

    try:
        from routes.leads import capture_lead_internal
        await capture_lead_internal(
            full_name=request.name or request.email.split("@")[0],
            email=request.email.lower(),
            product_interest=plan_id,
            source="signup",
        )
    except Exception as e:
        logger.error(f"[SIGNUP] Lead capture failed: {e}")

    return _build_token_and_response(user_row, access_roles, checkout_url)


@router.post("/login")
async def login(request: LoginRequest):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, name, email, password_hash, role, status, onboarding_completed, created_at FROM users WHERE email = $1",
            request.email.lower(),
        )

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if user["status"] not in ("active", "pending_payment"):
            raise HTTPException(status_code=403, detail="Account suspended")

        await conn.execute(
            "UPDATE users SET last_login_at = $1 WHERE id = $2",
            datetime.now(timezone.utc), user["id"],
        )

        rows = await conn.fetch(
            "SELECT user_id, company_id, venue_id, role, permissions FROM user_access WHERE user_id = $1",
            user["id"],
        )

    access_roles = [
        {
            "user_id": str(r["user_id"]),
            "company_id": str(r["company_id"]) if r["company_id"] else None,
            "venue_id": str(r["venue_id"]) if r["venue_id"] else None,
            "role": r["role"],
            "permissions": json.loads(r["permissions"]) if isinstance(r["permissions"], str) else r["permissions"],
        }
        for r in rows
    ]

    return _build_token_and_response(user, access_roles)


@router.post("/logout")
async def logout(user: dict = Depends(require_auth)):
    db = get_mongo_db()
    token_exp = user.get("exp")
    await db.token_blacklist.insert_one({
        "sub": user["sub"],
        "exp": token_exp,
        "invalidated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, name, email, role, status, onboarding_completed, onboarding_step, plan_id, created_at FROM users WHERE id = $1::uuid",
            user["sub"],
        )
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        roles = await conn.fetch(
            "SELECT company_id, venue_id, role, permissions FROM user_access WHERE user_id = $1::uuid",
            user["sub"],
        )

    access_roles = []
    venue_ids = []
    for r in roles:
        perm = r["permissions"]
        if isinstance(perm, str):
            try:
                perm = json.loads(perm)
            except Exception:
                perm = {}
        access_roles.append({
            "company_id": str(r["company_id"]) if r["company_id"] else None,
            "venue_id": str(r["venue_id"]) if r["venue_id"] else None,
            "role": r["role"],
            "permissions": perm,
        })
        if r["venue_id"]:
            venue_ids.append(str(r["venue_id"]))

    venues = []
    if venue_ids:
        cursor = db.venues.find({"id": {"$in": venue_ids}}, {"_id": 0})
        venues = await cursor.to_list(length=100)

    return {
        "id": str(user_row["id"]),
        "name": user_row["name"],
        "email": user_row["email"],
        "role": user_row.get("role", "USER"),
        "status": user_row["status"],
        "onboarding_completed": user_row.get("onboarding_completed", False),
        "onboarding_step": user_row.get("onboarding_step", 0),
        "plan_id": user_row.get("plan_id"),
        "created_at": user_row["created_at"].isoformat() if user_row["created_at"] else None,
        "roles": access_roles,
        "venues": venues,
    }


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    uid = uuid.UUID(user_id)
    async with pool.acquire() as conn:
        target = await conn.fetchrow("SELECT id, email, is_system_account FROM users WHERE id = $1", uid)
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        if target["email"] in PROTECTED_SYSTEM_ACCOUNTS or target.get("is_system_account"):
            raise HTTPException(status_code=403, detail="System account cannot be deleted")
        await conn.execute("DELETE FROM user_access WHERE user_id = $1", uid)
        await conn.execute("DELETE FROM users WHERE id = $1", uid)
    return {"deleted": True, "user_id": user_id}


@router.post("/handoff/create")
async def create_handoff(user: dict = Depends(require_auth)):
    db = get_mongo_db()
    pool = get_postgres_pool()

    code = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, name, email, password_hash, role, status, onboarding_completed, created_at FROM users WHERE id = $1::uuid",
            user["sub"],
        )
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        rows = await conn.fetch(
            "SELECT user_id, company_id, venue_id, role, permissions FROM user_access WHERE user_id = $1",
            user_row["id"],
        )

    access_roles = [
        {
            "user_id": str(r["user_id"]),
            "company_id": str(r["company_id"]) if r["company_id"] else None,
            "venue_id": str(r["venue_id"]) if r["venue_id"] else None,
            "role": r["role"],
            "permissions": json.loads(r["permissions"]) if isinstance(r["permissions"], str) else r["permissions"],
        }
        for r in rows
    ]

    token_data = {
        "sub": str(user_row["id"]),
        "email": user_row["email"],
        "role": user_row.get("role", "USER"),
        "roles": access_roles,
        "status": user_row["status"],
    }
    fresh_token = create_access_token(token_data)

    await db.auth_handoff_codes.insert_one({
        "code": code,
        "token": fresh_token,
        "user_id": user["sub"],
        "user_email": user_row["email"],
        "user_name": user_row["name"],
        "user_status": user_row["status"],
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(seconds=HANDOFF_TTL_SECONDS)).isoformat(),
        "used": False,
    })

    return {"code": code, "expires_in": HANDOFF_TTL_SECONDS}


@router.post("/handoff/exchange")
async def exchange_handoff(request: Request):
    body = await request.json()
    code = body.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")

    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    doc = await db.auth_handoff_codes.find_one({"code": code})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid or expired code")

    expires_at = datetime.fromisoformat(doc["expires_at"])
    if now > expires_at:
        await db.auth_handoff_codes.delete_one({"_id": doc["_id"]})
        raise HTTPException(status_code=401, detail="Code expired")

    if not doc.get("used"):
        await db.auth_handoff_codes.update_one(
            {"_id": doc["_id"]}, {"$set": {"used": True}}
        )

    return {
        "access_token": doc["token"],
        "token_type": "bearer",
        "user": {
            "id": doc["user_id"],
            "email": doc["user_email"],
            "name": doc.get("user_name"),
            "status": doc["user_status"],
        },
    }


# ─── Additional endpoints for Lovable integration ───────────────────

from utils.constants import DEMO_EMAILS


@router.get("/permissions")
async def get_permissions(user: dict = Depends(require_auth)):
    """Return user's role, modules, venue access, and permission flags.

    This is the primary endpoint Lovable uses to decide:
    - which dashboard to show
    - which modules are accessible
    - whether to show paywall / onboarding
    """
    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, email, role, status, onboarding_completed, onboarding_step, plan_id FROM users WHERE id = $1::uuid",
            user["sub"],
        )
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        access_rows = await conn.fetch(
            "SELECT company_id, venue_id, role, permissions FROM user_access WHERE user_id = $1::uuid",
            user["sub"],
        )

    is_demo = user_row["email"] in DEMO_EMAILS
    access = []

    for r in access_rows:
        venue_data = None
        if r["venue_id"]:
            venue_doc = await db.venues.find_one({"id": str(r["venue_id"])}, {"_id": 0})
            venue_config = await db.venue_configs.find_one({"venue_id": str(r["venue_id"])}, {"_id": 0})
            if venue_doc:
                venue_data = {
                    "venue_id": str(r["venue_id"]),
                    "venue_name": venue_doc.get("name"),
                    "venue_type": venue_doc.get("venue_type"),
                    "modules": venue_config.get("modules", []) if venue_config else [],
                }

        perm = r["permissions"]
        if isinstance(perm, str):
            try:
                perm = json.loads(perm)
            except Exception:
                perm = {}

        access.append({
            "company_id": str(r["company_id"]) if r["company_id"] else None,
            "venue_id": str(r["venue_id"]) if r["venue_id"] else None,
            "role": r["role"],
            "permissions": perm,
            "venue": venue_data,
        })

    return {
        "user_id": str(user_row["id"]),
        "email": user_row["email"],
        "global_role": user_row.get("role", "USER"),
        "status": user_row["status"],
        "plan_id": user_row.get("plan_id"),
        "onboarding_completed": user_row.get("onboarding_completed", False),
        "onboarding_step": user_row.get("onboarding_step", 0),
        "is_demo": is_demo,
        "access": access,
        "flags": {
            "is_active": user_row["status"] == "active" or is_demo,
            "requires_payment": user_row["status"] == "pending_payment" and not is_demo,
            "requires_onboarding": not user_row.get("onboarding_completed", False),
        },
    }


@router.get("/payment-status")
async def get_payment_status(user: dict = Depends(require_auth)):
    """Return user's payment/subscription status.

    Lovable uses this to decide whether to show the paywall screen.
    """
    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, email, status, plan_id, onboarding_completed FROM users WHERE id = $1::uuid",
            user["sub"],
        )
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

    is_demo = user_row["email"] in DEMO_EMAILS

    latest_tx = await db.payment_transactions.find_one(
        {"user_id": str(user_row["id"])},
        {"_id": 0},
        sort=[("created_at", -1)],
    )

    return {
        "user_id": str(user_row["id"]),
        "status": user_row["status"],
        "plan_id": user_row.get("plan_id"),
        "is_active": user_row["status"] == "active" or is_demo,
        "is_demo": is_demo,
        "requires_payment": user_row["status"] == "pending_payment" and not is_demo,
        "requires_onboarding": not user_row.get("onboarding_completed", False),
        "last_payment": {
            "stripe_session_id": latest_tx.get("stripe_session_id"),
            "payment_status": latest_tx.get("payment_status"),
            "amount": latest_tx.get("amount"),
            "currency": latest_tx.get("currency"),
            "created_at": latest_tx.get("created_at"),
        } if latest_tx else None,
    }
