from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import logging
import os

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Import database connections
from database import (
    connect_mongodb,
    connect_postgres,
    disconnect_mongodb,
    disconnect_postgres,
    get_mongo_db
)

from config import get_settings

# Create FastAPI app
app = FastAPI(title="SPETAP API", version="1.0.0")
settings = get_settings()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Import route modules
from routes import auth, billing, pulse, tap, table, kds, manager, owner, ceo, venue, rewards, barmen

# Include routers
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(pulse.router, prefix="/pulse", tags=["pulse"])
api_router.include_router(tap.router, prefix="/tap", tags=["tap"])
api_router.include_router(table.router, prefix="/table", tags=["table"])
api_router.include_router(kds.router, prefix="/kds", tags=["kds"])
api_router.include_router(manager.router, prefix="/manager", tags=["manager"])
api_router.include_router(owner.router, prefix="/owner", tags=["owner"])
api_router.include_router(ceo.router, prefix="/ceo", tags=["ceo"])
api_router.include_router(venue.router, prefix="/venue", tags=["venue"])
api_router.include_router(rewards.router, prefix="/rewards", tags=["rewards"])
api_router.include_router(barmen.router, prefix="/staff", tags=["staff"])

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SPETAP"}

# Include router
app.include_router(api_router)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting SPETAP API...")
    await connect_mongodb()
    await connect_postgres()
    # Ensure protected system account exists
    await ensure_system_account()
    logger.info("SPETAP API started successfully")


async def ensure_system_account():
    """Ensure teste@teste.com always exists — Protected System Account."""
    from utils.auth import hash_password
    from database import get_postgres_pool
    import json as _json
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT id FROM users WHERE email = 'teste@teste.com'")
        if not user:
            hashed = hash_password("12345")
            now = datetime.now(timezone.utc) if 'datetime' in dir() else __import__('datetime').datetime.now(__import__('datetime').timezone.utc)
            user_row = await conn.fetchrow(
                "INSERT INTO users (email, password_hash, status, created_at, updated_at) VALUES ('teste@teste.com', $1, 'active', $2, $2) RETURNING id",
                hashed, now,
            )
            uid = user_row["id"]
            cid = "c0000001-0000-0000-0000-000000000001"
            vid = "40a24e04-75b6-435d-bfff-ab0d469ce543"
            import uuid
            await conn.execute(
                "INSERT INTO companies (id, name, status, created_at, updated_at) VALUES ($1::uuid, 'Demo Club Inc.', 'active', $2, $2) ON CONFLICT DO NOTHING",
                uuid.UUID(cid), now,
            )
            await conn.execute(
                """INSERT INTO user_access (user_id, company_id, venue_id, role, permissions, created_at)
                   VALUES ($1, $2::uuid, $3::uuid, 'platform_admin', $4::jsonb, $5) ON CONFLICT DO NOTHING""",
                uid, uuid.UUID(cid), uuid.UUID(vid),
                _json.dumps({"HOST_COLLECT_DOB": True, "kds": True}), now,
            )
            logger.info("Protected system account teste@teste.com recreated")
        else:
            await conn.execute("UPDATE users SET status = 'active' WHERE email = 'teste@teste.com'")
            logger.info("Protected system account teste@teste.com verified")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down SPETAP API...")
    await disconnect_mongodb()
    await disconnect_postgres()
    logger.info("SPETAP API shutdown complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
