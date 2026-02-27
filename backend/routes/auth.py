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
    access_docs_cursor = db.user_access.find({"user_id": user_doc['id']})
    access_docs = await access_docs_cursor.to_list(100)
    
    # Convert to plain dicts (remove MongoDB ObjectId)
    access_roles = []
    for doc in access_docs:
        access_roles.append({
            "user_id": doc.get('user_id'),
            "company_id": doc.get('company_id'),
            "venue_id": doc.get('venue_id'),
            "role": doc.get('role'),
            "permissions": doc.get('permissions', {})
        })
    
    # Create JWT token
    token_data = {
        "sub": user_doc['id'],
        "email": user_doc['email'],
        "roles": access_roles
    }
    access_token = create_access_token(token_data)
    
    # Determine next route
    next_route = "/modules"
    if len(access_roles) == 0:
        next_route = "/setup"
    elif any(doc['role'] in ['platform_admin', 'ceo'] for doc in access_roles):
        next_route = "/ceo/dashboard"
    elif len(access_roles) == 1:
        # Single context, redirect based on role
        role = access_roles[0]['role']
        if role == 'manager':
            next_route = "/manager/overview"
        elif role == 'host':
            next_route = "/pulse/host"
        elif role in ['tap', 'bartender', 'server']:
            next_route = "/tap"
        elif role == 'owner':
            next_route = "/owner"
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
    db = get_mongo_db()
    
    # Check if user exists
    existing = await db.users.find_one({"email": request.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(request.password)
    
    user_doc = {
        "id": user_id,
        "email": request.email.lower(),
        "password_hash": hashed_password,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(user_doc)
    
    # Create company if provided
    if request.company_name:
        company_id = str(uuid.uuid4())
        company_doc = {
            "id": company_id,
            "name": request.company_name,
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        await db.companies.insert_one(company_doc)
        
        # Give user owner access to company
        access_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "company_id": company_id,
            "venue_id": None,
            "role": "owner",
            "permissions": {},
            "created_at": datetime.now(timezone.utc)
        }
        await db.user_access.insert_one(access_doc)
    
    return {"message": "User created successfully", "user_id": user_id}

@router.get("/me")
async def get_current_user_info(user: dict = Depends(require_auth)):
    """Get current user information"""
    db = get_mongo_db()
    
    user_doc = await db.users.find_one({"id": user['sub']})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user_doc['id'],
        "email": user_doc['email'],
        "status": user_doc['status'],
        "roles": user.get('roles', [])
    }
