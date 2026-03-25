"""Authentication and authorization middleware.

Access control hierarchy:
1. Authentication (valid JWT) — require_auth
2. Active account (status='active' or demo) — require_active
3. Subscription check (paid or demo) — require_subscription
4. Role check (specific roles) — require_role
5. Onboarding check — require_onboarded

Granular rules:
- garcia.rapha2@gmail.com → CEO/Admin, full access, bypasses all checks
- teste@teste.com → Demo access, bypasses payment
- teste1@teste.com → Onboarding flow only
- Other users → full access control pipeline
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer
from utils.auth import decode_access_token
from utils.constants import DEMO_EMAILS
from database import get_mongo_db
from typing import Optional

security = HTTPBearer()

# System accounts with special rules
ADMIN_EMAIL = "garcia.rapha2@gmail.com"
DEMO_FULL_EMAIL = "teste@teste.com"
DEMO_ONBOARDING_EMAIL = "teste1@teste.com"


async def get_current_user(request: Request) -> Optional[dict]:
    """Extract and validate JWT token from request."""
    authorization: str = request.headers.get("Authorization")
    if not authorization:
        return None

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None

        payload = decode_access_token(token)
        if payload is None:
            return None

        db = get_mongo_db()

        # Check token blacklist — exact match or blanket invalidation
        blacklisted = await db.token_blacklist.find_one(
            {"sub": payload["sub"], "exp": payload.get("exp")}
        )
        if blacklisted:
            return None

        # Check blanket invalidation (from password reset)
        blanket = await db.token_blacklist.find_one(
            {"sub": payload["sub"], "reason": {"$exists": True}}
        )
        if blanket:
            from datetime import datetime, timezone
            invalidated_at = blanket.get("invalidated_at", "")
            token_iat = payload.get("iat")
            if token_iat and invalidated_at:
                try:
                    inv_ts = datetime.fromisoformat(invalidated_at).timestamp()
                    if token_iat < inv_ts:
                        return None
                except Exception:
                    pass

        return payload
    except Exception:
        return None


async def require_auth(request: Request) -> dict:
    """Require authentication, raise 401 if not authenticated."""
    user = await get_current_user(request)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def require_active(request: Request) -> dict:
    """Require authentication AND active account status.

    Admin and demo accounts bypass the paywall check.
    """
    user = await require_auth(request)
    email = user.get("email", "")

    # Admin: full bypass
    if email == ADMIN_EMAIL:
        return user

    # Demo accounts: bypass payment
    if email in DEMO_EMAILS:
        return user

    from database import get_postgres_pool
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT status FROM users WHERE id = $1::uuid", user["sub"]
        )
    if not row or row["status"] not in ("active", "trial"):
        raise HTTPException(
            status_code=403,
            detail="Account not active. Payment required.",
        )
    return user


async def require_subscription(request: Request) -> dict:
    """Require active subscription. Stricter than require_active."""
    user = await require_active(request)
    email = user.get("email", "")

    if email == ADMIN_EMAIL or email in DEMO_EMAILS:
        return user

    from database import get_postgres_pool
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT status, plan_id FROM users WHERE id = $1::uuid", user["sub"]
        )
    if not row:
        raise HTTPException(status_code=403, detail="Account not found")

    if row["status"] not in ("active", "trial"):
        raise HTTPException(status_code=403, detail="Active subscription required")

    if not row["plan_id"]:
        raise HTTPException(status_code=403, detail="No plan associated with account")

    return user


async def require_onboarded(request: Request) -> dict:
    """Require active + onboarding completed."""
    user = await require_active(request)
    email = user.get("email", "")

    # Admin always passes
    if email == ADMIN_EMAIL:
        return user

    # Demo onboarding user should be forced into onboarding
    if email == DEMO_ONBOARDING_EMAIL:
        raise HTTPException(status_code=403, detail="Onboarding not completed")

    from database import get_postgres_pool
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT onboarding_completed FROM users WHERE id = $1::uuid", user["sub"]
        )
    if not row or not row["onboarding_completed"]:
        raise HTTPException(status_code=403, detail="Onboarding not completed")

    return user


def require_role(*allowed_roles):
    """Factory for role-checking dependency."""
    async def dependency(request: Request) -> dict:
        user = await require_active(request)

        # Admin bypasses role check
        if user.get("email") == ADMIN_EMAIL:
            return user

        user_roles = set()
        for r in user.get("roles", []):
            if isinstance(r, dict):
                user_roles.add(r.get("role", ""))
        if not user_roles.intersection(set(allowed_roles)):
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return user
    return dependency


async def check_permission(user: dict, required_permission: str) -> bool:
    """Check if user has required permission."""
    # Admin has all permissions
    if user.get("email") == ADMIN_EMAIL:
        return True
    permissions = user.get("permissions", {})
    return permissions.get(required_permission, False)
