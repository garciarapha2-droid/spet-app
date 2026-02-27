from fastapi import APIRouter, HTTPException, Request, Depends
from models.requests import LoginRequest, SignupRequest
from models.responses import LoginResponse, UserResponse
from utils.auth import hash_password, verify_password, create_access_token
from middleware.auth_middleware import require_auth
from database import get_postgres_conn, release_postgres_conn
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """User login endpoint"""
    conn = await get_postgres_conn()
    try:
        # Find user by email
        user_row = await conn.fetchrow(
            "SELECT id, email, password_hash, status FROM users WHERE email = $1",
            request.email.lower()
        )
        
        if not user_row:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(request.password, user_row['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check status
        if user_row['status'] != 'active':
            raise HTTPException(status_code=403, detail="Account inactive")
        
        # Update last login
        await conn.execute(
            "UPDATE users SET last_login_at = $1 WHERE id = $2",
            datetime.now(timezone.utc),
            user_row['id']
        )
        
        # Get user access/roles
        access_rows = await conn.fetch(
            "SELECT company_id, venue_id, role, permissions FROM user_access WHERE user_id = $1",
            user_row['id']
        )
        
        # Create JWT token
        token_data = {
            "sub": str(user_row['id']),
            "email": user_row['email'],
            "roles": [dict(row) for row in access_rows]
        }
        access_token = create_access_token(token_data)
        
        # Determine next route
        next_route = "/modules"
        if len(access_rows) == 0:
            next_route = "/setup"
        elif any(row['role'] in ['platform_admin', 'ceo'] for row in access_rows):
            next_route = "/ceo/dashboard"
        elif len(access_rows) == 1:
            # Single context, redirect based on role
            role = access_rows[0]['role']
            if role == 'manager':
                next_route = "/manager/overview"
            elif role == 'host':
                next_route = "/pulse/host"
            elif role in ['tap', 'bartender', 'server']:
                next_route = "/tap"
            elif role == 'owner':
                next_route = "/owner/dashboard"
        else:
            next_route = "/select-context"
        
        user_response = UserResponse(
            id=str(user_row['id']),
            email=user_row['email'],
            status=user_row['status'],
            created_at=datetime.now(timezone.utc)
        )
        
        return LoginResponse(
            access_token=access_token,
            user=user_response,
            next={"type": "route", "route": next_route}
        )
        
    finally:
        await release_postgres_conn(conn)

@router.post("/signup")
async def signup(request: SignupRequest):
    """User signup endpoint"""
    conn = await get_postgres_conn()
    try:
        # Check if user exists
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            request.email.lower()
        )
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_id = uuid.uuid4()
        hashed_password = hash_password(request.password)
        
        await conn.execute(
            """INSERT INTO users (id, email, password_hash, status, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            user_id,
            request.email.lower(),
            hashed_password,
            'active',
            datetime.now(timezone.utc),
            datetime.now(timezone.utc)
        )
        
        # Create company if provided
        if request.company_name:
            company_id = uuid.uuid4()
            await conn.execute(
                """INSERT INTO companies (id, name, status, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5)""",
                company_id,
                request.company_name,
                'active',
                datetime.now(timezone.utc),
                datetime.now(timezone.utc)
            )
            
            # Give user owner access to company
            await conn.execute(
                """INSERT INTO user_access (id, user_id, company_id, role, created_at)
                   VALUES ($1, $2, $3, $4, $5)""",
                uuid.uuid4(),
                user_id,
                company_id,
                'owner',
                datetime.now(timezone.utc)
            )
        
        return {"message": "User created successfully", "user_id": str(user_id)}
        
    finally:
        await release_postgres_conn(conn)

@router.get("/me")
async def get_current_user_info(user: dict = Depends(require_auth)):
    """Get current user information"""
    conn = await get_postgres_conn()
    try:
        user_row = await conn.fetchrow(
            "SELECT id, email, status, created_at FROM users WHERE id = $1",
            uuid.UUID(user['sub'])
        )
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user_row['id']),
            "email": user_row['email'],
            "status": user_row['status'],
            "roles": user.get('roles', [])
        }
    finally:
        await release_postgres_conn(conn)
