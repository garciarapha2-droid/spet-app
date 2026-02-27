from fastapi import APIRouter, HTTPException, Request, Depends
from models.requests import LoginRequest, SignupRequest
from models.responses import LoginResponse, UserResponse
from utils.auth import hash_password, verify_password, create_access_token
from middleware.auth_middleware import require_auth
from database import get_mongo_db
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """User login endpoint"""
    db = get_mongo_db()
    
    # Find user by email
    user_doc = await db.users.find_one({"email": request.email.lower()})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(request.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check status
    if user_doc['status'] != 'active':
        raise HTTPException(status_code=403, detail="Account inactive")
    
    # Update last login
    await db.users.update_one(
        {"id": user_doc['id']},
        {"$set": {"last_login_at": datetime.now(timezone.utc)}}
    )
    
    # Get user access/roles
    access_docs = await db.user_access.find({"user_id": user_doc['id']}).to_list(100)
    
    # Create JWT token
    token_data = {
        "sub": user_doc['id'],
        "email": user_doc['email'],
        "roles": access_docs
    }
    access_token = create_access_token(token_data)
    
    # Determine next route
    next_route = "/modules"
    if len(access_docs) == 0:
        next_route = "/setup"
    elif any(doc['role'] in ['platform_admin', 'ceo'] for doc in access_docs):
        next_route = "/ceo/dashboard"
    elif len(access_docs) == 1:
        # Single context, redirect based on role
        role = access_docs[0]['role']
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
        id=user_doc['id'],
        email=user_doc['email'],
        status=user_doc['status'],
        created_at=user_doc.get('created_at', datetime.now(timezone.utc))
    )
    
    return LoginResponse(
        access_token=access_token,
        user=user_response,
        next={"type": "route", "route": next_route}
    )

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
