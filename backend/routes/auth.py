from fastapi import APIRouter, HTTPException, Request, Depends
from models.requests import LoginRequest, SignupRequest
from models.responses import LoginResponse, UserResponse
from utils.auth import hash_password, verify_password, create_access_token
from middleware.auth_middleware import require_auth
from database import get_postgres_pool
from datetime import datetime, timezone
import json

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, email, password_hash, status, created_at FROM users WHERE email = $1",
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

    token_data = {
        "sub": str(user["id"]),
        "email": user["email"],
        "roles": access_roles,
    }
    access_token = create_access_token(token_data)

    next_route = "/modules"
    if len(access_roles) == 0:
        next_route = "/setup"
    elif any(r["role"] in ("platform_admin", "ceo") for r in access_roles):
        next_route = "/ceo/dashboard"
    elif len(access_roles) == 1:
        role = access_roles[0]["role"]
        if role == "manager":
            next_route = "/manager/overview"
        elif role == "host":
            next_route = "/pulse/host"
        elif role in ("tap", "bartender", "server"):
            next_route = "/tap"
        elif role == "owner":
            next_route = "/owner"
    else:
        next_route = "/select-context"

    return LoginResponse(
        access_token=access_token,
        user=UserResponse(
            id=str(user["id"]),
            email=user["email"],
            status=user["status"],
            created_at=user["created_at"],
        ),
        next={"type": "route", "route": next_route},
    )


@router.post("/signup")
async def signup(request: SignupRequest):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1", request.email.lower()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_password = hash_password(request.password)
        now = datetime.now(timezone.utc)

        user_row = await conn.fetchrow(
            """INSERT INTO users (email, password_hash, status, created_at, updated_at)
               VALUES ($1, $2, 'active', $3, $3) RETURNING id""",
            request.email.lower(),
            hashed_password,
            now,
        )
        user_id = user_row["id"]

        if request.company_name:
            company_row = await conn.fetchrow(
                """INSERT INTO companies (name, status, created_at, updated_at)
                   VALUES ($1, 'active', $2, $2) RETURNING id""",
                request.company_name,
                now,
            )
            company_id = company_row["id"]

            await conn.execute(
                """INSERT INTO user_access (user_id, company_id, role, permissions, created_at)
                   VALUES ($1, $2, 'owner', '{}', $3)""",
                user_id,
                company_id,
                now,
            )

    return {"message": "User created successfully", "user_id": str(user_id)}


@router.get("/me")
async def get_current_user_info(user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, email, status FROM users WHERE id = $1::uuid",
            user["sub"],
        )

        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user_row["id"]),
        "email": user_row["email"],
        "status": user_row["status"],
        "roles": user.get("roles", []),
    }
