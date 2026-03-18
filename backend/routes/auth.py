from fastapi import APIRouter, HTTPException, Request, Depends
from models.requests import LoginRequest, SignupRequest
from models.responses import LoginResponse, UserResponse
from utils.auth import hash_password, verify_password, create_access_token
from middleware.auth_middleware import require_auth
from database import get_postgres_pool, get_mongo_db
from datetime import datetime, timezone
import json
import uuid

router = APIRouter()

PROTECTED_SYSTEM_ACCOUNTS = {"teste@teste.com", "garcia.rapha2@gmail.com"}


def _build_token_and_response(user_row, access_roles):
    """Shared helper to build JWT + LoginResponse for both login and signup."""
    token_data = {
        "sub": str(user_row["id"]),
        "email": user_row["email"],
        "roles": access_roles,
    }
    access_token = create_access_token(token_data)
    return LoginResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user_row["id"]),
            email=user_row["email"],
            name=user_row.get("name"),
            status=user_row["status"],
            created_at=user_row["created_at"],
        ),
        next={"type": "route", "route": "/venue/home"},
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, name, email, password_hash, status, created_at FROM users WHERE email = $1",
            request.email.lower(),
        )

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if user["status"] != "active":
            raise HTTPException(status_code=403, detail="Account inactive")

        await conn.execute(
            "UPDATE users SET last_login_at = $1 WHERE id = $2",
            datetime.now(timezone.utc),
            user["id"],
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


@router.post("/signup", response_model=LoginResponse)
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

        user_row = await conn.fetchrow(
            """INSERT INTO users (name, email, password_hash, status, created_at, updated_at)
               VALUES ($1, $2, $3, 'active', $4, $4) RETURNING id, name, email, status, created_at""",
            request.name,
            request.email.lower(),
            hashed_password,
            now,
        )
        user_id = user_row["id"]

        company_name = request.company_name or (f"{request.name or request.email.split('@')[0]}'s Venue")
        company_row = await conn.fetchrow(
            """INSERT INTO companies (name, status, created_at, updated_at)
               VALUES ($1, 'active', $2, $2) RETURNING id""",
            company_name,
            now,
        )
        company_id = company_row["id"]

        venue_id = str(uuid.uuid4())
        venue_type = request.venue_type or "bar"

        await db.venues.insert_one({
            "id": venue_id,
            "company_id": str(company_id),
            "name": company_name,
            "venue_type": venue_type,
            "status": "active",
            "created_at": now.isoformat(),
        })

        await db.venue_configs.insert_one({
            "venue_id": venue_id,
            "modules": ["pulse", "tap", "table", "kds"],
            "host_collect_dob": True,
            "host_collect_photo": True,
            "bar_mode": "bar",
            "entry_types": ["vip", "cover", "cover_consumption", "consumption_only"],
        })

        permissions = json.dumps({
            "pulse": True, "tap": True, "table": True, "kds": True,
            "HOST_COLLECT_DOB": True,
        })
        await conn.execute(
            """INSERT INTO user_access (user_id, company_id, venue_id, role, permissions, created_at)
               VALUES ($1, $2, $3::uuid, 'owner', $4, $5)""",
            user_id, company_id, uuid.UUID(venue_id), permissions, now,
        )

        access_roles = [{
            "user_id": str(user_id),
            "company_id": str(company_id),
            "venue_id": venue_id,
            "role": "owner",
            "permissions": json.loads(permissions),
        }]

    return _build_token_and_response(user_row, access_roles)


@router.post("/logout")
async def logout(user: dict = Depends(require_auth)):
    """Logout: invalidate current token via blacklist."""
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
    """Return full user profile + venues for the authenticated user."""
    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, name, email, status, created_at FROM users WHERE id = $1::uuid",
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
        "status": user_row["status"],
        "created_at": user_row["created_at"].isoformat() if user_row["created_at"] else None,
        "roles": access_roles,
        "venues": venues,
    }


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: dict = Depends(require_auth)):
    """Delete a user. Protected system accounts cannot be deleted."""
    pool = get_postgres_pool()
    uid = uuid.UUID(user_id)
    async with pool.acquire() as conn:
        target = await conn.fetchrow("SELECT id, email FROM users WHERE id = $1", uid)
        if not target:
            raise HTTPException(status_code=404, detail="User not found")
        if target["email"] in PROTECTED_SYSTEM_ACCOUNTS:
            raise HTTPException(status_code=403, detail="System account cannot be deleted")
        await conn.execute("DELETE FROM user_access WHERE user_id = $1", uid)
        await conn.execute("DELETE FROM users WHERE id = $1", uid)
    return {"deleted": True, "user_id": user_id}
