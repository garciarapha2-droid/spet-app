from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from utils.auth import decode_access_token
from database import get_mongo_db
from typing import Optional

security = HTTPBearer()

async def get_current_user(request: Request) -> Optional[dict]:
    """Extract and validate JWT token from request"""
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
        blacklisted = await db.token_blacklist.find_one(
            {"sub": payload["sub"], "exp": payload.get("exp")}
        )
        if blacklisted:
            return None

        return payload
    except Exception:
        return None

async def require_auth(request: Request) -> dict:
    """Require authentication, raise 401 if not authenticated"""
    user = await get_current_user(request)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def check_permission(user: dict, required_permission: str) -> bool:
    """Check if user has required permission"""
    permissions = user.get('permissions', {})
    return permissions.get(required_permission, False)


async def require_active(request: Request) -> dict:
    """Require authentication AND active account status."""
    user = await require_auth(request)
    from database import get_postgres_pool
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT status FROM users WHERE id = $1::uuid", user["sub"]
        )
    if not row or row["status"] != "active":
        raise HTTPException(
            status_code=403,
            detail="Account not active. Payment required.",
        )
    return user


def require_role(*allowed_roles):
    """Factory for role-checking dependency."""
    async def dependency(request: Request) -> dict:
        user = await require_active(request)
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
