from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect
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
from ws_manager import ws_manager

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

# WebSocket endpoint for real-time Manager updates
@app.websocket("/api/ws/manager/{venue_id}")
async def ws_manager_endpoint(websocket: WebSocket, venue_id: str):
    await ws_manager.connect(venue_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(venue_id, websocket)
    except Exception:
        ws_manager.disconnect(venue_id, websocket)

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
    # Ensure complete demo ecosystem (guests, items, KDS, bar sessions)
    await ensure_demo_ecosystem()
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
    """Ensure demo tables exist for product demonstrations.
    Skipped if ensure_demo_ecosystem will handle full rebuild."""
    from database import get_postgres_pool
    import uuid as _uuid
    pool = get_postgres_pool()
    vid = _uuid.UUID("40a24e04-75b6-435d-bfff-ab0d469ce543")
    async with pool.acquire() as conn:
        existing = await conn.fetchval("SELECT COUNT(*) FROM venue_tables WHERE venue_id=$1", vid)
        open_sessions = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid)
        if existing > 0 and open_sessions >= 5:
            logger.info(f"Demo tables already present ({existing}). Skipping table seed.")
            return
        # If ecosystem is degraded, ensure_demo_ecosystem will rebuild tables
        if existing > 0 and open_sessions < 5:
            logger.info(f"Demo tables present but ecosystem degraded. Deferring to ensure_demo_ecosystem.")
            return
        # First run: create basic tables
        now = datetime.now(timezone.utc)
        user_row = await conn.fetchrow("SELECT id FROM users WHERE email='teste@teste.com'")
        if not user_row:
            logger.warning("No test user found — cannot seed demo tables.")
            return
        table_defs = [
            ("1", "main", 4), ("2", "main", 2), ("3", "main", 6), ("4", "main", 4),
            ("5", "patio", 4), ("6", "patio", 2), ("7", "vip", 8), ("8", "vip", 6),
        ]
        for tn, zone, cap in table_defs:
            await conn.execute(
                """INSERT INTO venue_tables (venue_id, table_number, zone, capacity, status, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, 'available', $5, $5)""",
                vid, tn, zone, cap, now,
            )
        logger.info("Demo tables seeded: 8 tables")


async def ensure_demo_ecosystem():
    """Seed a complete, realistic demo ecosystem using REAL system structures.
    Creates: guests, entry events, sessions with items, KDS tickets, and a closed session.
    STATE-AWARE — checks if the demo state is correct and re-seeds if degraded."""
    from database import get_postgres_pool
    import json as _json
    import uuid as _uuid

    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _uuid.UUID("40a24e04-75b6-435d-bfff-ab0d469ce543")
    vid_str = str(vid)
    now = datetime.now(timezone.utc)

    EXPECTED_OPEN_SESSIONS = 5  # 3 table + 2 bar (John Smith + Sofia + Lucas)

    async with pool.acquire() as conn:
        open_count = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1 AND status='open'", vid
        )
        if open_count >= EXPECTED_OPEN_SESSIONS:
            logger.info(f"Demo ecosystem healthy ({open_count} open sessions). Skipping.")
            return

        logger.info(f"Demo ecosystem degraded ({open_count}/{EXPECTED_OPEN_SESSIONS} open sessions). Re-seeding...")

        user_row = await conn.fetchrow("SELECT id FROM users WHERE email='teste@teste.com'")
        if not user_row:
            logger.warning("No test user — cannot seed ecosystem.")
            return
        user_id = user_row["id"]

        # Clean up degraded data
        await conn.execute(
            "DELETE FROM kds_ticket_items WHERE ticket_id IN (SELECT id FROM kds_tickets WHERE venue_id=$1)", vid)
        await conn.execute("DELETE FROM kds_tickets WHERE venue_id=$1", vid)
        await conn.execute("DELETE FROM tap_payments WHERE venue_id=$1", vid)
        await conn.execute("DELETE FROM tap_items WHERE venue_id=$1", vid)
        await conn.execute("DELETE FROM tap_sessions WHERE venue_id=$1", vid)
        await conn.execute("DELETE FROM entry_events WHERE venue_id=$1", vid)
        await conn.execute("DELETE FROM venue_tables WHERE venue_id=$1", vid)

    # ── 0. Rebuild tables ──
    async with pool.acquire() as conn:
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

    # ── 1. Build catalog lookup from MongoDB ──
    cursor = db.venue_catalog.find({"venue_id": vid_str, "active": True}, {"_id": 0})
    catalog_raw = await cursor.to_list(200)
    if not catalog_raw:
        # Seed catalog if missing
        bar_items = [
            {"name": "Margarita", "category": "Cocktails", "price": 14.0, "is_alcohol": True},
            {"name": "Mojito", "category": "Cocktails", "price": 13.0, "is_alcohol": True},
            {"name": "Old Fashioned", "category": "Cocktails", "price": 15.0, "is_alcohol": True},
            {"name": "Caipirinha", "category": "Cocktails", "price": 13.0, "is_alcohol": True},
            {"name": "IPA Draft", "category": "Beers", "price": 9.0, "is_alcohol": True},
            {"name": "Lager", "category": "Beers", "price": 8.0, "is_alcohol": True},
            {"name": "Pilsner", "category": "Beers", "price": 8.0, "is_alcohol": True},
            {"name": "Stout", "category": "Beers", "price": 9.0, "is_alcohol": True},
            {"name": "Vodka Shot", "category": "Spirits", "price": 8.0, "is_alcohol": True},
            {"name": "Tequila Shot", "category": "Spirits", "price": 9.0, "is_alcohol": True},
            {"name": "Whiskey Neat", "category": "Spirits", "price": 12.0, "is_alcohol": True},
            {"name": "Gin & Tonic", "category": "Spirits", "price": 11.0, "is_alcohol": True},
            {"name": "Sparkling Water", "category": "Non-alcoholic", "price": 4.0, "is_alcohol": False},
            {"name": "Coca-Cola", "category": "Non-alcoholic", "price": 4.0, "is_alcohol": False},
            {"name": "Orange Juice", "category": "Non-alcoholic", "price": 5.0, "is_alcohol": False},
            {"name": "Red Bull", "category": "Non-alcoholic", "price": 6.0, "is_alcohol": False},
            {"name": "Classic Burger", "category": "Mains", "price": 18.0, "is_alcohol": False},
            {"name": "Grilled Chicken", "category": "Mains", "price": 16.0, "is_alcohol": False},
            {"name": "Fish & Chips", "category": "Mains", "price": 17.0, "is_alcohol": False},
            {"name": "Pasta Carbonara", "category": "Mains", "price": 15.0, "is_alcohol": False},
            {"name": "Caesar Salad", "category": "Starters", "price": 12.0, "is_alcohol": False},
            {"name": "Bruschetta", "category": "Starters", "price": 10.0, "is_alcohol": False},
            {"name": "Soup of the Day", "category": "Starters", "price": 9.0, "is_alcohol": False},
            {"name": "Shrimp Cocktail", "category": "Starters", "price": 14.0, "is_alcohol": False},
            {"name": "Loaded Nachos", "category": "Snacks", "price": 11.0, "is_alcohol": False},
            {"name": "Chicken Wings", "category": "Snacks", "price": 13.0, "is_alcohol": False},
            {"name": "Fries", "category": "Snacks", "price": 7.0, "is_alcohol": False},
            {"name": "Mozzarella Sticks", "category": "Snacks", "price": 9.0, "is_alcohol": False},
        ]
        await db.venue_catalog.delete_many({"venue_id": vid_str})
        for item in bar_items:
            await db.venue_catalog.insert_one({
                "id": str(_uuid.uuid4()), "venue_id": vid_str,
                "name": item["name"], "category": item["category"],
                "price": item["price"], "is_alcohol": item["is_alcohol"],
                "image_url": None, "active": True, "created_at": now,
            })
        cursor = db.venue_catalog.find({"venue_id": vid_str, "active": True}, {"_id": 0})
        catalog_raw = await cursor.to_list(200)

    catalog = {item["name"]: item for item in catalog_raw}

    def cat(name):
        return catalog.get(name, {})

    # ── 2. Ensure venue_guests in MongoDB ──
    demo_guests = [
        {"id": "d0000001-0000-0000-0000-000000000001", "name": "Maria Santos", "email": "maria.santos@demo.com", "phone": "+5511999001001", "nfc_tag": "201"},
        {"id": "d0000002-0000-0000-0000-000000000002", "name": "Ricardo Almeida", "email": "ricardo.alm@demo.com", "phone": "+5511999002002", "nfc_tag": "305"},
        {"id": "d0000003-0000-0000-0000-000000000003", "name": "Fernando VIP", "email": "fernando.vip@demo.com", "phone": "+5511999003003", "nfc_tag": "701"},
        {"id": "d0000004-0000-0000-0000-000000000004", "name": "Sofia Cardoso", "email": "sofia.card@demo.com", "phone": "+5511999004004", "nfc_tag": "106"},
        {"id": "d0000005-0000-0000-0000-000000000005", "name": "Lucas Oliveira", "email": "lucas.oliv@demo.com", "phone": "+5511999005005", "nfc_tag": "107"},
        {"id": "d0000006-0000-0000-0000-000000000006", "name": "Alex Turner", "email": "alex@demo.com", "phone": "+5511999006006", "nfc_tag": "105"},
        {"id": "d0000007-0000-0000-0000-000000000007", "name": "John Smith", "email": "john@demo.com", "phone": "+5511999007007", "nfc_tag": "104"},
    ]

    for g in demo_guests:
        existing = await db.venue_guests.find_one({"id": g["id"], "venue_id": vid_str})
        if not existing:
            await db.venue_guests.insert_one({
                "id": g["id"], "venue_id": vid_str, "name": g["name"],
                "email": g["email"], "phone": g["phone"], "nfc_tag": g.get("nfc_tag"), "dob": None, "photo": None,
                "flags": [], "tags": ["vip"] if "VIP" in g["name"] else [],
                "spend_total": 0, "visits": 1, "last_visit": now,
                "created_at": now, "updated_at": now,
            })

    # ── 3. Create entry_events for ALL guests (Pulse "Inside") ──
    async with pool.acquire() as conn:
        for g in demo_guests:
            await conn.execute(
                """INSERT INTO entry_events
                   (venue_id, event_id, guest_id, entry_type, cover_amount, cover_paid, decision, staff_user_id, created_at)
                   VALUES ($1, $1, $2::uuid, 'consumption_only', 0, false, 'allowed', $3, $4)""",
                vid, _uuid.UUID(g["id"]), user_id, now,
            )

    guest_id_map = {g["name"]: g["id"] for g in demo_guests}

    # ── 4. Create TABLE sessions (3 occupied tables) ──
    table_sessions = [
        {"table": "2", "guest": "Maria Santos", "tab": 201, "server": "Carlos Silva",
         "items": [("IPA Draft", 2), ("Caesar Salad", 1), ("Bruschetta", 1), ("Sparkling Water", 1)]},
        {"table": "3", "guest": "Ricardo Almeida", "tab": 305, "server": "Ana Perez",
         "items": [("Margarita", 2), ("Old Fashioned", 1), ("Grilled Chicken", 2),
                   ("Fish & Chips", 1), ("Loaded Nachos", 1), ("Lager", 3)]},
        {"table": "7", "guest": "Fernando VIP", "tab": 701, "server": "Marco Rossi",
         "items": [("Whiskey Neat", 4), ("Mojito", 4), ("Classic Burger", 3),
                   ("Chicken Wings", 3), ("Vodka Shot", 6), ("Tequila Shot", 4),
                   ("Pilsner", 4), ("Loaded Nachos", 2), ("Fries", 3)]},
    ]

    async with pool.acquire() as conn:
        for ts in table_sessions:
            gid = guest_id_map.get(ts["guest"])
            meta = _json.dumps({"guest_name": ts["guest"], "tab_number": ts["tab"], "server_name": ts["server"]})
            sess = await conn.fetchrow(
                """INSERT INTO tap_sessions
                   (venue_id, guest_id, table_id, session_type, opened_by_user_id, status, meta, opened_at, subtotal, total)
                   VALUES ($1, $2::uuid, $3, 'table', $4, 'open', $5::jsonb, $6, 0, 0) RETURNING id""",
                vid, _uuid.UUID(gid), table_ids[ts["table"]], user_id, meta, now,
            )
            sid = sess["id"]
            total = 0.0
            for item_name, qty in ts["items"]:
                ci = cat(item_name)
                if not ci: continue
                price = ci["price"]
                line = price * qty
                total += line
                item_row = await conn.fetchrow(
                    """INSERT INTO tap_items
                       (venue_id, tap_session_id, catalog_item_id, item_name, category,
                        unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id""",
                    vid, sid, _uuid.UUID(ci["id"]), ci["name"], ci["category"],
                    price, qty, line, ci.get("is_alcohol", False), user_id, now,
                )
                dest = "bar" if ci.get("is_alcohol", False) else "kitchen"
                tk = await conn.fetchrow(
                    """INSERT INTO kds_tickets
                       (venue_id, tap_session_id, table_id, destination, status, created_by_user_id, meta, created_at)
                       VALUES ($1, $2, $3, $4, 'pending', $5, $6::jsonb, $7) RETURNING id""",
                    vid, sid, table_ids[ts["table"]], dest, user_id,
                    _json.dumps({"guest_name": ts["guest"]}), now,
                )
                await conn.execute(
                    "INSERT INTO kds_ticket_items (ticket_id, tap_item_id, item_name, qty) VALUES ($1, $2, $3, $4)",
                    tk["id"], item_row["id"], ci["name"], qty,
                )
            await conn.execute("UPDATE tap_sessions SET subtotal=$1, total=$1 WHERE id=$2", total, sid)
            await conn.execute("UPDATE venue_tables SET status='occupied', current_session_id=$1 WHERE id=$2", sid, table_ids[ts["table"]])

    # ── 5. Create BAR (tap) sessions ──
    bar_sessions = [
        {"guest": "Sofia Cardoso", "tab": 106,
         "items": [("Mojito", 1), ("Vodka Shot", 2), ("Chicken Wings", 1)]},
        {"guest": "Lucas Oliveira", "tab": 107,
         "items": [("IPA Draft", 3), ("Fries", 1)]},
        {"guest": "John Smith", "tab": 104,
         "items": [("Lager", 2), ("Loaded Nachos", 1)]},
        {"guest": "Alex Turner", "tab": 105,
         "items": [("Old Fashioned", 2), ("Chicken Wings", 1)]},
    ]

    async with pool.acquire() as conn:
        for bs in bar_sessions:
            gid = guest_id_map.get(bs["guest"])
            meta = _json.dumps({"guest_name": bs["guest"], "tab_number": bs["tab"]})
            sess = await conn.fetchrow(
                """INSERT INTO tap_sessions
                   (venue_id, guest_id, session_type, opened_by_user_id, status, meta, opened_at, subtotal, total)
                   VALUES ($1, $2::uuid, 'tap', $3, 'open', $4::jsonb, $5, 0, 0) RETURNING id""",
                vid, _uuid.UUID(gid), user_id, meta, now,
            )
            sid = sess["id"]
            total = 0.0
            for item_name, qty in bs["items"]:
                ci = cat(item_name)
                if not ci: continue
                price = ci["price"]
                line = price * qty
                total += line
                item_row = await conn.fetchrow(
                    """INSERT INTO tap_items
                       (venue_id, tap_session_id, catalog_item_id, item_name, category,
                        unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id""",
                    vid, sid, _uuid.UUID(ci["id"]), ci["name"], ci["category"],
                    price, qty, line, ci.get("is_alcohol", False), user_id, now,
                )
                dest = "bar" if ci.get("is_alcohol", False) else "kitchen"
                tk = await conn.fetchrow(
                    """INSERT INTO kds_tickets
                       (venue_id, tap_session_id, destination, status, created_by_user_id, meta, created_at)
                       VALUES ($1, $2, $3, 'pending', $4, $5::jsonb, $6) RETURNING id""",
                    vid, sid, dest, user_id, _json.dumps({"guest_name": bs["guest"]}), now,
                )
                await conn.execute(
                    "INSERT INTO kds_ticket_items (ticket_id, tap_item_id, item_name, qty) VALUES ($1, $2, $3, $4)",
                    tk["id"], item_row["id"], ci["name"], qty,
                )
            await conn.execute("UPDATE tap_sessions SET subtotal=$1, total=$1 WHERE id=$2", total, sid)

    # ── 6. Create one CLOSED session with tip (for Manager revenue) ──
    async with pool.acquire() as conn:
        closed_guest = "Alex Turner"
        closed_gid = guest_id_map[closed_guest]
        # Close Alex Turner's session and add payment + tip
        alex_sess = await conn.fetchrow(
            "SELECT id, total FROM tap_sessions WHERE venue_id=$1 AND meta->>'guest_name'=$2 AND status='open'",
            vid, closed_guest,
        )
        if alex_sess:
            tip_amount = round(float(alex_sess["total"]) * 0.20, 2)
            close_meta = _json.dumps({
                "guest_name": closed_guest, "tab_number": 105,
                "payment_location": "pay_here", "tip_recorded": True,
                "tip_amount": tip_amount, "tip_percent": 20.0,
                "tip_distribution": [{"staff_id": str(user_id), "sold": float(alex_sess["total"]), "proportion": 1.0, "tip": tip_amount}],
            })
            await conn.execute(
                "UPDATE tap_sessions SET status='closed', closed_at=$1, closed_by_user_id=$2, meta=$3::jsonb WHERE id=$4",
                now, user_id, close_meta, alex_sess["id"],
            )
            await conn.execute(
                """INSERT INTO tap_payments (venue_id, tap_session_id, amount, method, paid_by_user_id, paid_at)
                   VALUES ($1, $2, $3, 'card', $4, $5)""",
                vid, alex_sess["id"], alex_sess["total"], user_id, now,
            )

    logger.info("Demo ecosystem seeded: 7 guests, 7 entry events, 6 open sessions, 1 closed with tip, KDS tickets")

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
