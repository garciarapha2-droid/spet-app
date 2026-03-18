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
