#!/usr/bin/env python3
"""Seed SPETAP with comprehensive demo data for Demo Club."""
import asyncio
import uuid
import json
from datetime import datetime, timezone, timedelta, date
from motor.motor_asyncio import AsyncIOMotorClient
import asyncpg
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "spetap_db")
PG_URL = os.getenv("POSTGRES_URL", "postgresql://spetap_user:spetap_password@localhost:5432/spetap")

VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
COMPANY_ID = "c0000001-0000-0000-0000-000000000001"

# Fixed UUIDs for demo guests
GUEST_JOHN = "a0000001-0000-0000-0000-000000000001"
GUEST_MARIA = "a0000002-0000-0000-0000-000000000002"
GUEST_KEVIN = "a0000003-0000-0000-0000-000000000003"


async def seed():
    mongo = AsyncIOMotorClient(MONGO_URL)
    db = mongo[DB_NAME]
    pool = await asyncpg.create_pool(PG_URL, min_size=2, max_size=5)
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    print("=== SEEDING SPETAP DEMO DATA ===")

    # ─── 1. PG: User + Company + Access ───────────────────
    from utils.auth import hash_password
    hashed = hash_password("12345")

    async with pool.acquire() as conn:
        # Check if user exists
        user = await conn.fetchrow("SELECT id FROM users WHERE email = 'teste@teste.com'")
        if not user:
            user_row = await conn.fetchrow(
                """INSERT INTO users (email, password_hash, status, created_at, updated_at)
                   VALUES ('teste@teste.com', $1, 'active', $2, $2) RETURNING id""",
                hashed, now,
            )
            user_id = user_row["id"]
            print(f"  Created user: teste@teste.com (id={user_id})")
        else:
            user_id = user["id"]
            print(f"  User exists: teste@teste.com (id={user_id})")

        # Company
        company = await conn.fetchrow("SELECT id FROM companies WHERE id = $1::uuid", uuid.UUID(COMPANY_ID))
        if not company:
            await conn.execute(
                """INSERT INTO companies (id, name, status, created_at, updated_at)
                   VALUES ($1::uuid, 'Demo Club Inc.', 'active', $2, $2)""",
                uuid.UUID(COMPANY_ID), now,
            )
            print("  Created company: Demo Club Inc.")

        # User access (owner + manager + platform_admin)
        existing_access = await conn.fetchrow(
            "SELECT id FROM user_access WHERE user_id = $1 AND company_id = $2::uuid",
            user_id, uuid.UUID(COMPANY_ID),
        )
        if not existing_access:
            await conn.execute(
                """INSERT INTO user_access (user_id, company_id, venue_id, role, permissions, created_at)
                   VALUES ($1, $2::uuid, $3::uuid, 'platform_admin', $4::jsonb, $5)""",
                user_id, uuid.UUID(COMPANY_ID), uuid.UUID(VENUE_ID),
                json.dumps({"HOST_COLLECT_DOB": True, "kds": True}), now,
            )
            print("  Created user access: platform_admin")

    # ─── 2. MongoDB: Venue Config ──────────────────────────
    await db.venue_configs.update_one(
        {"venue_id": VENUE_ID},
        {"$set": {
            "venue_id": VENUE_ID,
            "host_collect_dob": True,
            "host_collect_photo": True,
            "entry_types": ["vip", "cover", "cover_consumption", "consumption_only"],
            "bar_mode": "disco",
        }, "$setOnInsert": {
            "modules": ["pulse", "tap", "table", "kds"],
        }},
        upsert=True,
    )
    print("  Venue config set (host_collect_dob=True)")

    # ─── 3. MongoDB: Catalog Items (BAR + TAP) ────────────
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
    ]
    tap_food_items = [
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

    all_items = bar_items + tap_food_items
    # Clear old catalog and insert fresh
    await db.venue_catalog.delete_many({"venue_id": VENUE_ID})
    catalog_map = {}
    for item in all_items:
        item_id = str(uuid.uuid4())
        catalog_map[item["name"]] = item_id
        await db.venue_catalog.insert_one({
            "id": item_id,
            "venue_id": VENUE_ID,
            "name": item["name"],
            "category": item["category"],
            "price": item["price"],
            "is_alcohol": item["is_alcohol"],
            "image_url": None,
            "active": True,
            "created_at": now,
        })
    print(f"  Seeded {len(all_items)} catalog items")

    # ─── 4. MongoDB: Barmen ────────────────────────────────
    await db.venue_barmen.delete_many({"venue_id": VENUE_ID})
    barmen_names = ["Carlos Silva", "Ana Perez", "Marco Rossi"]
    for name in barmen_names:
        await db.venue_barmen.insert_one({
            "id": str(uuid.uuid4()),
            "venue_id": VENUE_ID,
            "name": name,
            "active": True,
        })
    print(f"  Seeded {len(barmen_names)} barmen")

    # ─── 5. MongoDB: Demo Guests ───────────────────────────
    await db.venue_guests.delete_many({"venue_id": VENUE_ID})
    guests = [
        {"id": GUEST_JOHN, "name": "John Smith", "email": "john@demo.com", "phone": "+1555123001", "dob": "1992-05-15", "tags": ["vip"], "flags": [], "visits": 12, "spend_total": 450, "wristband_blocked": False},
        {"id": GUEST_MARIA, "name": "Maria Lopez", "email": "maria@demo.com", "phone": "+1555123002", "dob": "1995-08-22", "tags": [], "flags": [], "visits": 5, "spend_total": 180, "wristband_blocked": False},
        {"id": GUEST_KEVIN, "name": "Kevin Brown", "email": "kevin@demo.com", "phone": "+1555123003", "dob": "1990-01-10", "tags": [], "flags": ["flagged"], "visits": 3, "spend_total": 90, "wristband_blocked": True, "wristband_block_reason": "Security concern"},
        {"id": "a0000004-0000-0000-0000-000000000004", "name": "Alex Turner", "email": "alex@demo.com", "phone": "+1555123004", "dob": "1993-11-08", "tags": [], "flags": [], "visits": 2, "spend_total": 40, "wristband_blocked": False},
    ]
    for g in guests:
        await db.venue_guests.insert_one({
            **g,
            "venue_id": VENUE_ID,
            "global_person_id": None,
            "photo": None,
            "reward_points": 0,
            "last_visit": now,
            "created_at": now - timedelta(days=30),
            "updated_at": now,
        })
    print(f"  Seeded {len(guests)} demo guests")

    # ─── 6. PG: Entry Events (today — guests inside) ──────
    async with pool.acquire() as conn:
        user_row = await conn.fetchrow("SELECT id FROM users WHERE email = 'teste@teste.com'")
        staff_id = user_row["id"]

        # Clear today's entry events for this venue
        await conn.execute(
            "DELETE FROM entry_events WHERE venue_id = $1::uuid AND created_at >= $2",
            uuid.UUID(VENUE_ID), today_start,
        )

        # John Smith — allowed in (Inside)
        await conn.execute(
            """INSERT INTO entry_events (venue_id, event_id, guest_id, entry_type, cover_amount, cover_paid, decision, staff_user_id, created_at)
               VALUES ($1::uuid, $1::uuid, $2::uuid, 'vip', 0, true, 'allowed', $3, $4)""",
            uuid.UUID(VENUE_ID), uuid.UUID(GUEST_JOHN), staff_id, now - timedelta(minutes=90),
        )
        # Maria Lopez — allowed in (Inside, closed tab but still present)
        await conn.execute(
            """INSERT INTO entry_events (venue_id, event_id, guest_id, entry_type, cover_amount, cover_paid, decision, staff_user_id, created_at)
               VALUES ($1::uuid, $1::uuid, $2::uuid, 'cover', 20, true, 'allowed', $3, $4)""",
            uuid.UUID(VENUE_ID), uuid.UUID(GUEST_MARIA), staff_id, now - timedelta(minutes=60),
        )
        # Kevin Brown — allowed in (Blocked wristband, but still inside)
        await conn.execute(
            """INSERT INTO entry_events (venue_id, event_id, guest_id, entry_type, cover_amount, cover_paid, decision, staff_user_id, created_at)
               VALUES ($1::uuid, $1::uuid, $2::uuid, 'consumption_only', 0, false, 'allowed', $3, $4)""",
            uuid.UUID(VENUE_ID), uuid.UUID(GUEST_KEVIN), staff_id, now - timedelta(minutes=45),
        )
        # Alex Turner — allowed in (no registered guest, walk-in)
        alex_id = "a0000004-0000-0000-0000-000000000004"
        await conn.execute(
            """INSERT INTO entry_events (venue_id, event_id, guest_id, entry_type, cover_amount, cover_paid, decision, staff_user_id, created_at)
               VALUES ($1::uuid, $1::uuid, $2::uuid, 'cover', 20, true, 'allowed', $3, $4)""",
            uuid.UUID(VENUE_ID), uuid.UUID(alex_id), staff_id, now - timedelta(minutes=55),
        )
        print("  Seeded entry events for 3 guests")

        # ─── 7. PG: Tables ─────────────────────────────────
        await conn.execute("DELETE FROM venue_tables WHERE venue_id = $1::uuid", uuid.UUID(VENUE_ID))
        table_ids = {}
        tables_data = [
            ("1", "main", 4, "available"),
            ("2", "main", 4, "available"),  # Will be set to occupied after session creation
            ("3", "main", 6, "available"),  # Will be set to needs_payment
            ("4", "main", 2, "available"),
            ("5", "vip", 6, "available"),
            ("6", "vip", 4, "available"),
            ("7", "patio", 4, "available"),
            ("8", "patio", 8, "available"),
        ]
        for tn, zone, cap, status in tables_data:
            row = await conn.fetchrow(
                """INSERT INTO venue_tables (venue_id, table_number, zone, capacity, status)
                   VALUES ($1::uuid, $2, $3, $4, $5) RETURNING id""",
                uuid.UUID(VENUE_ID), tn, zone, cap, status,
            )
            table_ids[tn] = row["id"]
        print(f"  Seeded {len(tables_data)} tables")

        # ─── 8. PG: Tab Sessions with items ────────────────
        # Clear old sessions  
        await conn.execute(
            "DELETE FROM tap_payments WHERE venue_id = $1::uuid", uuid.UUID(VENUE_ID)
        )
        await conn.execute(
            "DELETE FROM kds_ticket_items WHERE ticket_id IN (SELECT id FROM kds_tickets WHERE venue_id = $1::uuid)", uuid.UUID(VENUE_ID)
        )
        await conn.execute(
            "DELETE FROM kds_tickets WHERE venue_id = $1::uuid", uuid.UUID(VENUE_ID)
        )
        await conn.execute(
            "DELETE FROM tap_items WHERE venue_id = $1::uuid", uuid.UUID(VENUE_ID)
        )
        await conn.execute(
            "DELETE FROM tap_sessions WHERE venue_id = $1::uuid", uuid.UUID(VENUE_ID)
        )

        # Session 1: John Smith — Tab #123 — Open (at Table 2)
        meta_john = json.dumps({"guest_name": "John Smith", "tab_number": 123, "server_name": "Carlos Silva"})
        sess1 = await conn.fetchrow(
            """INSERT INTO tap_sessions (venue_id, guest_id, table_id, session_type, opened_by_user_id, status, meta, opened_at, subtotal, total)
               VALUES ($1::uuid, $2::uuid, $3, 'table', $4, 'open', $5::jsonb, $6, 45.0, 45.0) RETURNING id""",
            uuid.UUID(VENUE_ID), uuid.UUID(GUEST_JOHN), table_ids["2"], staff_id,
            meta_john, now - timedelta(hours=1, minutes=30),
        )
        sess1_id = sess1["id"]
        # Add items: 2x Classic Burger, 1x IPA Draft
        for item_name, cat, price, qty, is_alc in [
            ("Classic Burger", "Mains", 18.0, 2, False),
            ("IPA Draft", "Beers", 9.0, 1, True),
        ]:
            await conn.execute(
                """INSERT INTO tap_items (venue_id, tap_session_id, catalog_item_id, item_name, category, unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                   VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)""",
                uuid.UUID(VENUE_ID), sess1_id, uuid.UUID(catalog_map.get(item_name, str(uuid.uuid4()))),
                item_name, cat, price, qty, price * qty, is_alc, staff_id, now - timedelta(hours=1),
            )
        # Mark Table 2 as occupied
        await conn.execute(
            "UPDATE venue_tables SET status = 'occupied', current_session_id = $1 WHERE id = $2",
            sess1_id, table_ids["2"],
        )

        # Session 2: Maria Lopez — Tab #124 — Closed (paid)
        meta_maria = json.dumps({"guest_name": "Maria Lopez", "tab_number": 124})
        sess2 = await conn.fetchrow(
            """INSERT INTO tap_sessions (venue_id, guest_id, session_type, opened_by_user_id, status, meta, opened_at, closed_at, subtotal, total)
               VALUES ($1::uuid, $2::uuid, 'tap', $3, 'closed', $4::jsonb, $5, $6, 22.0, 22.0) RETURNING id""",
            uuid.UUID(VENUE_ID), uuid.UUID(GUEST_MARIA), staff_id,
            meta_maria, now - timedelta(hours=2, minutes=30), now - timedelta(hours=1),
        )
        sess2_id = sess2["id"]
        for item_name, cat, price, qty, is_alc in [
            ("Margarita", "Cocktails", 14.0, 1, True),
            ("Lager", "Beers", 8.0, 1, True),
        ]:
            await conn.execute(
                """INSERT INTO tap_items (venue_id, tap_session_id, catalog_item_id, item_name, category, unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                   VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)""",
                uuid.UUID(VENUE_ID), sess2_id, uuid.UUID(catalog_map.get(item_name, str(uuid.uuid4()))),
                item_name, cat, price, qty, price * qty, is_alc, staff_id, now - timedelta(hours=2),
            )
        # Payment for Maria
        await conn.execute(
            """INSERT INTO tap_payments (venue_id, tap_session_id, amount, method, paid_by_user_id, paid_at)
               VALUES ($1::uuid, $2, 22.0, 'card', $3, $4)""",
            uuid.UUID(VENUE_ID), sess2_id, staff_id, now - timedelta(hours=1),
        )

        # Session 3: Kevin Brown — Tab #125 — Open (tap mode, no table)
        meta_kevin = json.dumps({"guest_name": "Kevin Brown", "tab_number": 125})
        sess3 = await conn.fetchrow(
            """INSERT INTO tap_sessions (venue_id, guest_id, session_type, opened_by_user_id, status, meta, opened_at, subtotal, total)
               VALUES ($1::uuid, $2::uuid, 'tap', $3, 'open', $4::jsonb, $5, 17.0, 17.0) RETURNING id""",
            uuid.UUID(VENUE_ID), uuid.UUID(GUEST_KEVIN), staff_id,
            meta_kevin, now - timedelta(minutes=45),
        )
        sess3_id = sess3["id"]
        for item_name, cat, price, qty, is_alc in [
            ("Vodka Shot", "Spirits", 8.0, 1, True),
            ("Tequila Shot", "Spirits", 9.0, 1, True),
        ]:
            await conn.execute(
                """INSERT INTO tap_items (venue_id, tap_session_id, catalog_item_id, item_name, category, unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
                   VALUES ($1::uuid, $2, $3::uuid, $4, $5, $6, $7, $8, $9, $10, $11)""",
                uuid.UUID(VENUE_ID), sess3_id, uuid.UUID(catalog_map.get(item_name, str(uuid.uuid4()))),
                item_name, cat, price, qty, price * qty, is_alc, staff_id, now - timedelta(minutes=30),
            )

        # Session 4: Alex Turner at Table 3 — Tab #126 — Open (needs payment scenario)
        meta_guest = json.dumps({"guest_name": "Alex Turner", "tab_number": 126, "server_name": "Ana Perez"})
        sess4 = await conn.fetchrow(
            """INSERT INTO tap_sessions (venue_id, guest_id, table_id, session_type, opened_by_user_id, status, meta, opened_at, subtotal, total)
               VALUES ($1::uuid, $2::uuid, $3, 'table', $4, 'open', $5::jsonb, $6, 15.0, 15.0) RETURNING id""",
            uuid.UUID(VENUE_ID), uuid.UUID("a0000004-0000-0000-0000-000000000004"), table_ids["3"], staff_id,
            meta_guest, now - timedelta(minutes=55),
        )
        sess4_id = sess4["id"]
        await conn.execute(
            """INSERT INTO tap_items (venue_id, tap_session_id, catalog_item_id, item_name, category, unit_price, qty, line_total, is_alcohol, created_by_user_id, created_at)
               VALUES ($1::uuid, $2, $3::uuid, 'Pasta Carbonara', 'Mains', 15.0, 1, 15.0, false, $4, $5)""",
            uuid.UUID(VENUE_ID), sess4_id, uuid.UUID(catalog_map.get("Pasta Carbonara", str(uuid.uuid4()))),
            staff_id, now - timedelta(minutes=50),
        )
        # Mark Table 3 as occupied (needs payment)
        await conn.execute(
            "UPDATE venue_tables SET status = 'occupied', current_session_id = $1 WHERE id = $2",
            sess4_id, table_ids["3"],
        )
        print("  Seeded 4 tab sessions with items")

        # ─── 9. PG: KDS Tickets ───────────────────────────
        # Ticket 1: Table 2 — Burger x2 (Preparing, 15 min estimate, started 3 min ago — NOT delayed)
        ticket1 = await conn.fetchrow(
            """INSERT INTO kds_tickets (venue_id, tap_session_id, table_id, destination, status, estimated_minutes, created_by_user_id, started_at, created_at, meta)
               VALUES ($1::uuid, $2, $3, 'kitchen', 'preparing', 15, $4, $5, $6, $7::jsonb) RETURNING id""",
            uuid.UUID(VENUE_ID), sess1_id, table_ids["2"], staff_id,
            now - timedelta(minutes=3), now - timedelta(minutes=4),
            json.dumps({"guest_name": "John Smith"}),
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, item_name, qty)
               VALUES ($1, 'Classic Burger', 2)""",
            ticket1["id"],
        )

        # Ticket 2: Table 3 — Pasta x1 (Delayed — explicitly set as delayed)
        ticket2 = await conn.fetchrow(
            """INSERT INTO kds_tickets (venue_id, tap_session_id, table_id, destination, status, estimated_minutes, created_by_user_id, started_at, created_at, meta)
               VALUES ($1::uuid, $2, $3, 'kitchen', 'delayed', 10, $4, $5, $6, $7::jsonb) RETURNING id""",
            uuid.UUID(VENUE_ID), sess4_id, table_ids["3"], staff_id,
            now - timedelta(minutes=15), now - timedelta(minutes=16),
            json.dumps({"guest_name": "Alex Turner"}),
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, item_name, qty)
               VALUES ($1, 'Pasta Carbonara', 1)""",
            ticket2["id"],
        )

        # Ticket 3: Bar order — IPA Draft (pending)
        ticket3 = await conn.fetchrow(
            """INSERT INTO kds_tickets (venue_id, tap_session_id, destination, status, created_by_user_id, created_at, meta)
               VALUES ($1::uuid, $2, 'bar', 'pending', $3, $4, $5::jsonb) RETURNING id""",
            uuid.UUID(VENUE_ID), sess1_id, staff_id, now - timedelta(minutes=3),
            json.dumps({"guest_name": "John Smith"}),
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, item_name, qty)
               VALUES ($1, 'IPA Draft', 1)""",
            ticket3["id"],
        )

        # Ticket 3b: Kitchen — Fish & Chips (pending, for ETA modal testing)
        ticket3b = await conn.fetchrow(
            """INSERT INTO kds_tickets (venue_id, tap_session_id, table_id, destination, status, created_by_user_id, created_at, meta)
               VALUES ($1::uuid, $2, $3, 'kitchen', 'pending', $4, $5, $6::jsonb) RETURNING id""",
            uuid.UUID(VENUE_ID), sess1_id, table_ids["2"], staff_id, now - timedelta(minutes=2),
            json.dumps({"guest_name": "John Smith"}),
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, item_name, qty)
               VALUES ($1, 'Fish & Chips', 1)""",
            ticket3b["id"],
        )

        # Ticket 4: Ready ticket (kitchen)
        ticket4 = await conn.fetchrow(
            """INSERT INTO kds_tickets (venue_id, tap_session_id, destination, status, created_by_user_id, started_at, ready_at, created_at, meta)
               VALUES ($1::uuid, $2, 'kitchen', 'ready', $3, $4, $5, $6, $7::jsonb) RETURNING id""",
            uuid.UUID(VENUE_ID), sess3_id, staff_id,
            now - timedelta(minutes=20), now - timedelta(minutes=2), now - timedelta(minutes=22),
            json.dumps({"guest_name": "Kevin Brown"}),
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, item_name, qty)
               VALUES ($1, 'Chicken Wings', 1)""",
            ticket4["id"],
        )

        # Ticket 5: Bar — Cocktail (Delayed, started 12 min ago, estimate was 5)
        ticket5 = await conn.fetchrow(
            """INSERT INTO kds_tickets (venue_id, tap_session_id, destination, status, estimated_minutes, created_by_user_id, started_at, created_at, meta)
               VALUES ($1::uuid, $2, 'bar', 'delayed', 5, $3, $4, $5, $6::jsonb) RETURNING id""",
            uuid.UUID(VENUE_ID), sess3_id, staff_id,
            now - timedelta(minutes=12), now - timedelta(minutes=13),
            json.dumps({"guest_name": "Kevin Brown"}),
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, item_name, qty)
               VALUES ($1, 'Mojito', 1)""",
            ticket5["id"],
        )

        # Ticket 6: Bar — Preparing (normal, 10 min estimate, started 2 min ago — NOT delayed)
        ticket6 = await conn.fetchrow(
            """INSERT INTO kds_tickets (venue_id, tap_session_id, destination, status, estimated_minutes, created_by_user_id, started_at, created_at, meta)
               VALUES ($1::uuid, $2, 'bar', 'preparing', 10, $3, $4, $5, $6::jsonb) RETURNING id""",
            uuid.UUID(VENUE_ID), sess1_id, staff_id,
            now - timedelta(minutes=2), now - timedelta(minutes=3),
            json.dumps({"guest_name": "John Smith"}),
        )
        await conn.execute(
            """INSERT INTO kds_ticket_items (ticket_id, item_name, qty)
               VALUES ($1, 'Caipirinha', 1)""",
            ticket6["id"],
        )
        print("  Seeded 6 KDS tickets (Kitchen + Bar, including Delayed)")

    print("\n=== DEMO DATA COMPLETE ===")
    print("Login: teste@teste.com / 12345")
    print("Guests: John Smith (#123), Maria Lopez (#124), Kevin Brown (#125)")
    print("Tables: 8 tables (T2=Occupied, T3=Needs Payment)")

    await pool.close()
    mongo.close()


if __name__ == "__main__":
    asyncio.run(seed())
