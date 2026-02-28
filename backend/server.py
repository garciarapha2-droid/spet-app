from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
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
    # Ensure demo tables exist for product demos
    await ensure_demo_tables()
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


async def ensure_demo_tables():
    """Ensure demo tables exist for product demonstrations — ADDITIVE ONLY."""
    from database import get_postgres_pool
    import json as _json
    import uuid as _uuid
    pool = get_postgres_pool()
    vid = _uuid.UUID("40a24e04-75b6-435d-bfff-ab0d469ce543")
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        existing = await conn.fetchval("SELECT COUNT(*) FROM venue_tables WHERE venue_id=$1", vid)
        if existing > 0:
            logger.info(f"Demo tables already present ({existing}). Skipping seed.")
            return
        # Get user for session ownership
        user_row = await conn.fetchrow("SELECT id FROM users WHERE email='teste@teste.com'")
        if not user_row:
            logger.warning("No test user found — cannot seed demo tables.")
            return
        user_id = user_row["id"]
        # Create 8 tables across zones
        table_defs = [
            ("1", "main", 4), ("2", "main", 2), ("3", "main", 6), ("4", "main", 4),
            ("5", "patio", 4), ("6", "patio", 2), ("7", "vip", 8), ("8", "vip", 6),
        ]
        table_ids = {}
        for tn, zone, cap in table_defs:
            tid = _uuid.uuid4()
            await conn.execute(
                """INSERT INTO venue_tables (id, venue_id, table_number, zone, capacity, status, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, 'available', $6, $6)""",
                tid, vid, tn, zone, cap, now,
            )
            table_ids[tn] = tid
        # Occupy Table 2
        sess_2 = _uuid.uuid4()
        meta_2 = _json.dumps({"guest_name": "Maria Santos", "tab_number": 201, "server_name": "Carlos Silva"})
        await conn.execute(
            """INSERT INTO tap_sessions (id, venue_id, status, session_type, table_id, opened_by_user_id, opened_at, subtotal, total, meta)
               VALUES ($1, $2, 'open', 'table', $3, $4, $5, 45.00, 45.00, $6::jsonb)""",
            sess_2, vid, table_ids["2"], user_id, now, meta_2,
        )
        await conn.execute("UPDATE venue_tables SET status='occupied', current_session_id=$1 WHERE id=$2", sess_2, table_ids["2"])
        # Occupy Table 3
        sess_3 = _uuid.uuid4()
        meta_3 = _json.dumps({"guest_name": "Ricardo Almeida", "tab_number": 305, "server_name": "Ana Perez"})
        await conn.execute(
            """INSERT INTO tap_sessions (id, venue_id, status, session_type, table_id, opened_by_user_id, opened_at, subtotal, total, meta)
               VALUES ($1, $2, 'open', 'table', $3, $4, $5, 128.50, 128.50, $6::jsonb)""",
            sess_3, vid, table_ids["3"], user_id, now, meta_3,
        )
        await conn.execute("UPDATE venue_tables SET status='occupied', current_session_id=$1 WHERE id=$2", sess_3, table_ids["3"])
        # Occupy Table 7 (VIP)
        sess_7 = _uuid.uuid4()
        meta_7 = _json.dumps({"guest_name": "Fernando VIP", "tab_number": 701, "server_name": "Marco Rossi"})
        await conn.execute(
            """INSERT INTO tap_sessions (id, venue_id, status, session_type, table_id, opened_by_user_id, opened_at, subtotal, total, meta)
               VALUES ($1, $2, 'open', 'table', $3, $4, $5, 350.00, 350.00, $6::jsonb)""",
            sess_7, vid, table_ids["7"], user_id, now, meta_7,
        )
        await conn.execute("UPDATE venue_tables SET status='occupied', current_session_id=$1 WHERE id=$2", sess_7, table_ids["7"])
        logger.info("Demo tables seeded: 8 tables (3 occupied)")

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
