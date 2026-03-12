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
            logger.info(f"Demo tables already present ({existing}). Skipping table seed.")
            return
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
        # Occupy Table 2, 3, 7 with sessions
        occupy_defs = [
            ("2", "Maria Santos", 201, "Carlos Silva", 0),
            ("3", "Ricardo Almeida", 305, "Ana Perez", 0),
            ("7", "Fernando VIP", 701, "Marco Rossi", 0),
        ]
        for tn, gname, tab_num, server, total in occupy_defs:
            sid = _uuid.uuid4()
            meta = _json.dumps({"guest_name": gname, "tab_number": tab_num, "server_name": server})
            await conn.execute(
                """INSERT INTO tap_sessions (id, venue_id, status, session_type, table_id, opened_by_user_id, opened_at, subtotal, total, meta)
                   VALUES ($1, $2, 'open', 'table', $3, $4, $5, $6, $6, $7::jsonb)""",
                sid, vid, table_ids[tn], user_id, now, total, meta,
            )
            await conn.execute("UPDATE venue_tables SET status='occupied', current_session_id=$1 WHERE id=$2", sid, table_ids[tn])
        logger.info("Demo tables seeded: 8 tables (3 occupied)")


async def ensure_demo_ecosystem():
    """Seed a complete, realistic demo ecosystem using REAL system structures.
    Creates: guests, entry events, sessions with items, KDS tickets, and a closed session.
    ADDITIVE ONLY — idempotent check prevents duplicates."""
    from database import get_postgres_pool
    import json as _json
    import uuid as _uuid

    pool = get_postgres_pool()
    db = get_mongo_db()
    vid = _uuid.UUID("40a24e04-75b6-435d-bfff-ab0d469ce543")
    vid_str = str(vid)
    now = datetime.now(timezone.utc)

    # Idempotency: skip if items already exist
    async with pool.acquire() as conn:
        item_count = await conn.fetchval("SELECT COUNT(*) FROM tap_items WHERE venue_id=$1", vid)
        if item_count > 0:
            logger.info(f"Demo ecosystem already seeded ({item_count} items). Skipping.")
            return

        user_row = await conn.fetchrow("SELECT id FROM users WHERE email='teste@teste.com'")
        if not user_row:
            logger.warning("No test user — cannot seed ecosystem.")
            return
        user_id = user_row["id"]

    # ── 1. Build catalog lookup from MongoDB ──
    cursor = db.venue_catalog.find({"venue_id": vid_str, "active": True}, {"_id": 0})
    catalog_raw = await cursor.to_list(200)
    catalog = {item["name"]: item for item in catalog_raw}

    def cat(name):
        return catalog.get(name, {})

    # ── 2. Create venue_guests in MongoDB for table occupants ──
    demo_guests = [
        {"id": "d0000001-0000-0000-0000-000000000001", "name": "Maria Santos", "email": "maria.santos@demo.com", "phone": "+5511999001001"},
        {"id": "d0000002-0000-0000-0000-000000000002", "name": "Ricardo Almeida", "email": "ricardo.alm@demo.com", "phone": "+5511999002002"},
        {"id": "d0000003-0000-0000-0000-000000000003", "name": "Fernando VIP", "email": "fernando.vip@demo.com", "phone": "+5511999003003"},
        {"id": "d0000004-0000-0000-0000-000000000004", "name": "Sofia Cardoso", "email": "sofia.card@demo.com", "phone": "+5511999004004"},
        {"id": "d0000005-0000-0000-0000-000000000005", "name": "Lucas Oliveira", "email": "lucas.oliv@demo.com", "phone": "+5511999005005"},
    ]

    for g in demo_guests:
        existing = await db.venue_guests.find_one({"id": g["id"], "venue_id": vid_str})
        if not existing:
            await db.venue_guests.insert_one({
                "id": g["id"], "venue_id": vid_str, "name": g["name"],
                "email": g["email"], "phone": g["phone"], "dob": None, "photo": None,
                "flags": [], "tags": ["vip"] if "VIP" in g["name"] else [],
                "spend_total": 0, "visits": 1, "last_visit": now,
                "created_at": now, "updated_at": now,
            })

    # ── 3. Create entry_events for all demo guests (Pulse "Inside") ──
    all_guest_ids = [g["id"] for g in demo_guests]
    # Also include existing guests
    existing_guests = await db.venue_guests.find(
        {"venue_id": vid_str, "id": {"$regex": "^a000000"}}, {"_id": 0, "id": 1}
    ).to_list(10)
    for eg in existing_guests[:2]:
        all_guest_ids.append(eg["id"])

    async with pool.acquire() as conn:
        for gid in all_guest_ids:
            await conn.execute(
                """INSERT INTO entry_events
                   (venue_id, event_id, guest_id, entry_type, cover_amount, cover_paid, decision, staff_user_id, created_at)
                   VALUES ($1, $1, $2::uuid, 'consumption_only', 0, false, 'allowed', $3, $4)""",
                vid, _uuid.UUID(gid), user_id, now,
            )

    # ── 3b. Create bar sessions for existing guests that entered ──
    existing_guest_sessions = [
        {"id": "a0000001-0000-0000-0000-000000000001", "name": "John Smith",
         "items": [("Lager", 2), ("Loaded Nachos", 1)]},
        {"id": "a0000004-0000-0000-0000-000000000004", "name": "Alex Turner",
         "items": [("Old Fashioned", 2), ("Chicken Wings", 1)], "close_with_tip": True},
    ]
    async with pool.acquire() as conn:
        tab_base = await conn.fetchval("SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1", vid)
        for egs in existing_guest_sessions:
            tab_base += 1
            tab_number = 100 + tab_base
            is_closed = egs.get("close_with_tip", False)
            meta_dict = {"guest_name": egs["name"], "tab_number": tab_number}
            if is_closed:
                meta_dict.update({"payment_location": "pay_here", "tip_recorded": True, "tip_amount": 0, "tip_percent": 20.0})
            meta_json = _json.dumps(meta_dict)
            sess_row = await conn.fetchrow(
                """INSERT INTO tap_sessions
                   (venue_id, guest_id, session_type, opened_by_user_id, status, meta, opened_at)
                   VALUES ($1, $2::uuid, 'tap', $3, 'open', $4::jsonb, $5) RETURNING id""",
                vid, _uuid.UUID(egs["id"]), user_id, meta_json, now,
            )
            egs_sid = sess_row["id"]
            egs_total = 0
            for item_name, qty in egs["items"]:
                ci = cat(item_name)
                if not ci: continue
                price = ci["price"]
                line = price * qty
                egs_total += line
                item_row = await conn.fetchrow(
                    """INSERT INTO tap_items
                       (venue_id, tap_session_id, catalog_item_id, item_name, category,
                        unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id""",
                    vid, egs_sid, _uuid.UUID(ci["id"]), ci["name"], ci["category"],
                    price, qty, line, ci.get("is_alcohol", False), user_id, now,
                )
                dest = "bar" if ci.get("is_alcohol", False) else "kitchen"
                tk_meta = _json.dumps({"guest_name": egs["name"]})
                tk = await conn.fetchrow(
                    """INSERT INTO kds_tickets
                       (venue_id, tap_session_id, destination, status, created_by_user_id, meta, created_at)
                       VALUES ($1, $2, $3, 'pending', $4, $5::jsonb, $6) RETURNING id""",
                    vid, egs_sid, dest, user_id, tk_meta, now,
                )
                await conn.execute(
                    "INSERT INTO kds_ticket_items (ticket_id, tap_item_id, item_name, qty) VALUES ($1, $2, $3, $4)",
                    tk["id"], item_row["id"], ci["name"], qty,
                )
            await conn.execute("UPDATE tap_sessions SET subtotal=$1, total=$1 WHERE id=$2", egs_total, egs_sid)

            # Close with tip if requested
            if is_closed:
                tip_amount = round(egs_total * 0.20, 2)
                close_meta = _json.dumps({
                    "guest_name": egs["name"], "tab_number": tab_number,
                    "payment_location": "pay_here", "tip_recorded": True,
                    "tip_amount": tip_amount, "tip_percent": 20.0,
                    "tip_distribution": [{"staff_id": str(user_id), "sold": egs_total, "proportion": 1.0, "tip": tip_amount}],
                })
                await conn.execute(
                    """UPDATE tap_sessions SET status='closed', closed_at=$1, closed_by_user_id=$2, meta=$3::jsonb WHERE id=$4""",
                    now, user_id, close_meta, egs_sid,
                )
                await conn.execute(
                    """INSERT INTO tap_payments (venue_id, tap_session_id, amount, method, paid_by_user_id, paid_at)
                       VALUES ($1, $2, $3, 'card', $4, $5)""",
                    vid, egs_sid, egs_total, user_id, now,
                )

    # ── 4. Get existing table sessions and their table_ids ──
    async with pool.acquire() as conn:
        sessions = await conn.fetch(
            "SELECT id, table_id, meta FROM tap_sessions WHERE venue_id=$1 AND status='open' AND session_type='table'", vid
        )

    session_map = {}
    for s in sessions:
        meta = _json.loads(s["meta"]) if isinstance(s["meta"], str) else (s["meta"] or {})
        session_map[meta.get("guest_name", "")] = {"id": s["id"], "table_id": s["table_id"]}

    # ── 5. Add REAL tap_items to table sessions ──
    table_orders = {
        "Maria Santos": [
            ("IPA Draft", 2), ("Caesar Salad", 1), ("Bruschetta", 1), ("Sparkling Water", 1),
        ],
        "Ricardo Almeida": [
            ("Margarita", 2), ("Old Fashioned", 1), ("Grilled Chicken", 2),
            ("Fish & Chips", 1), ("Loaded Nachos", 1), ("Lager", 3),
        ],
        "Fernando VIP": [
            ("Whiskey Neat", 4), ("Mojito", 4), ("Classic Burger", 3),
            ("Chicken Wings", 3), ("Vodka Shot", 6), ("Tequila Shot", 4),
            ("Pilsner", 4), ("Loaded Nachos", 2), ("Fries", 3),
        ],
    }

    # Also link guests to sessions
    guest_id_map = {g["name"]: g["id"] for g in demo_guests}

    async with pool.acquire() as conn:
        for guest_name, items in table_orders.items():
            sess = session_map.get(guest_name)
            if not sess:
                continue
            sid = sess["id"]
            tid = sess["table_id"]
            gid = guest_id_map.get(guest_name)

            # Link guest to session
            if gid:
                await conn.execute(
                    "UPDATE tap_sessions SET guest_id=$1::uuid WHERE id=$2",
                    _uuid.UUID(gid), sid,
                )

            session_total = 0
            for item_name, qty in items:
                ci = cat(item_name)
                if not ci:
                    continue
                price = ci["price"]
                line = price * qty
                session_total += line

                item_row = await conn.fetchrow(
                    """INSERT INTO tap_items
                       (venue_id, tap_session_id, catalog_item_id, item_name, category,
                        unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)
                       RETURNING id""",
                    vid, sid, _uuid.UUID(ci["id"]), ci["name"], ci["category"],
                    price, qty, line, ci.get("is_alcohol", False), user_id, now,
                )

                # Auto-create KDS ticket for this item
                destination = "bar" if ci.get("is_alcohol", False) else "kitchen"
                ticket_meta = _json.dumps({"guest_name": guest_name})
                ticket = await conn.fetchrow(
                    """INSERT INTO kds_tickets
                       (venue_id, tap_session_id, table_id, destination, status, created_by_user_id, meta, created_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8) RETURNING id""",
                    vid, sid, tid, destination,
                    "preparing" if destination == "bar" else "pending",
                    user_id, ticket_meta, now,
                )
                await conn.execute(
                    """INSERT INTO kds_ticket_items (ticket_id, tap_item_id, item_name, qty)
                       VALUES ($1, $2, $3, $4)""",
                    ticket["id"], item_row["id"], ci["name"], qty,
                )

            # Update session total to match real items
            await conn.execute(
                "UPDATE tap_sessions SET subtotal=$1, total=$1 WHERE id=$2",
                session_total, sid,
            )

    # ── 6. Create BAR (tap) sessions with items ──
    bar_sessions = [
        {
            "guest_id": "d0000004-0000-0000-0000-000000000004", "guest_name": "Sofia Cardoso",
            "items": [("Mojito", 1), ("Vodka Shot", 2), ("Chicken Wings", 1)],
        },
        {
            "guest_id": "d0000005-0000-0000-0000-000000000005", "guest_name": "Lucas Oliveira",
            "items": [("IPA Draft", 3), ("Fries", 1)],
        },
    ]

    async with pool.acquire() as conn:
        tab_counter = await conn.fetchval(
            "SELECT COUNT(*) FROM tap_sessions WHERE venue_id=$1", vid
        )

        for bs in bar_sessions:
            tab_counter += 1
            tab_number = 100 + tab_counter
            meta_json = _json.dumps({"guest_name": bs["guest_name"], "tab_number": tab_number})
            sess_row = await conn.fetchrow(
                """INSERT INTO tap_sessions
                   (venue_id, guest_id, session_type, opened_by_user_id, status, meta, opened_at)
                   VALUES ($1, $2::uuid, 'tap', $3, 'open', $4::jsonb, $5)
                   RETURNING id""",
                vid, _uuid.UUID(bs["guest_id"]), user_id, meta_json, now,
            )
            bar_sid = sess_row["id"]
            bar_total = 0

            for item_name, qty in bs["items"]:
                ci = cat(item_name)
                if not ci:
                    continue
                price = ci["price"]
                line = price * qty
                bar_total += line

                item_row = await conn.fetchrow(
                    """INSERT INTO tap_items
                       (venue_id, tap_session_id, catalog_item_id, item_name, category,
                        unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                       VALUES ($1, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)
                       RETURNING id""",
                    vid, bar_sid, _uuid.UUID(ci["id"]), ci["name"], ci["category"],
                    price, qty, line, ci.get("is_alcohol", False), user_id, now,
                )

                destination = "bar" if ci.get("is_alcohol", False) else "kitchen"
                ticket_meta = _json.dumps({"guest_name": bs["guest_name"]})
                ticket = await conn.fetchrow(
                    """INSERT INTO kds_tickets
                       (venue_id, tap_session_id, destination, status, created_by_user_id, meta, created_at)
                       VALUES ($1, $2, $3, 'pending', $4, $5::jsonb, $6) RETURNING id""",
                    vid, bar_sid, destination, user_id, ticket_meta, now,
                )
                await conn.execute(
                    """INSERT INTO kds_ticket_items (ticket_id, tap_item_id, item_name, qty)
                       VALUES ($1, $2, $3, $4)""",
                    ticket["id"], item_row["id"], ci["name"], qty,
                )

            await conn.execute(
                "UPDATE tap_sessions SET subtotal=$1, total=$1 WHERE id=$2",
                bar_total, bar_sid,
            )

    logger.info("Demo ecosystem seeded: guests, entries, items, KDS tickets, bar sessions, closed session with tip")

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
