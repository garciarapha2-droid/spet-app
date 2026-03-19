from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from typing import Optional, Dict
from config import get_settings
import secrets

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Access token: short-lived (1 hour)
ACCESS_TOKEN_HOURS = 1
# Refresh token: long-lived (30 days)
REFRESH_TOKEN_DAYS = 30


def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def create_refresh_token() -> str:
    """Generate a cryptographically secure refresh token string."""
    return secrets.token_urlsafe(64)

def decode_access_token(token: str) -> Optional[Dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None
