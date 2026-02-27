from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from middleware.auth_middleware import require_auth
from database import get_mongo_db, get_postgres_pool
from datetime import datetime, timezone, date
import hashlib
import json
import uuid
import base64
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _hash_identifier(value: str) -> str:
    """SHA-256 hash for global dedupe without leaking PII."""
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    return f"{local[0]}***@{domain}"


def _mask_phone(phone: str) -> str:
    if not phone or len(phone) < 4:
        return "***"
    return f"***{phone[-4:]}"


# ─── Venue config ────────────────────────────────────────────────
@router.get("/venue/config")
async def get_venue_config(venue_id: str, user: dict = Depends(require_auth)):
    db = get_mongo_db()
    cfg = await db.venue_configs.find_one({"venue_id": venue_id}, {"_id": 0})
    if not cfg:
        cfg = {
            "venue_id": venue_id,
            "host_collect_dob": False,
            "host_collect_photo": True,
            "entry_types": ["vip", "cover", "cover_consumption", "consumption_only"],
        }
    return cfg


# ─── C1: Guest Intake ────────────────────────────────────────────
@router.post("/guest/intake")
async def guest_intake(
    user: dict = Depends(require_auth),
    name: str = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    dob: str = Form(None),
    venue_id: str = Form(...),
    photo: str = Form(None),
):
    """C1 — Register a new guest. PII → MongoDB, hashes → PG global_persons."""
    if not name.strip():
        raise HTTPException(400, "Name is required")

    db = get_mongo_db()
    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)

    # ── Build hashes for global dedupe ──
    email_hash = _hash_identifier(email) if email else None
    phone_hash = _hash_identifier(phone) if phone else None

    # ── Upsert global_person in PG ──
    global_person_id = None
    async with pool.acquire() as conn:
        if email_hash or phone_hash:
            conditions = []
            params = []
            idx = 1
            if email_hash:
                conditions.append(f"email_hash = ${idx}")
                params.append(email_hash)
                idx += 1
            if phone_hash:
                conditions.append(f"phone_hash = ${idx}")
                params.append(phone_hash)
                idx += 1
            where = " OR ".join(conditions)
            row = await conn.fetchrow(
                f"SELECT id FROM global_persons WHERE {where}", *params
            )
            if row:
                global_person_id = row["id"]
            else:
                row = await conn.fetchrow(
                    """INSERT INTO global_persons (email_hash, phone_hash, created_at, updated_at)
                       VALUES ($1, $2, $3, $3) RETURNING id""",
                    email_hash, phone_hash, now,
                )
                global_person_id = row["id"]

    # ── Store PII in MongoDB (venue-isolated) ──
    guest_id = str(uuid.uuid4())
    guest_doc = {
        "id": guest_id,
        "venue_id": venue_id,
        "global_person_id": str(global_person_id) if global_person_id else None,
        "name": name.strip(),
        "email": email.strip().lower() if email else None,
        "phone": phone.strip() if phone else None,
        "dob": dob if dob else None,
        "photo": photo if photo else None,
        "flags": [],
        "tags": [],
        "spend_total": 0,
        "visits": 0,
        "last_visit": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.venue_guests.insert_one(guest_doc)

    return {
        "guest_id": guest_id,
        "global_person_id": str(global_person_id) if global_person_id else None,
        "name": name.strip(),
        "created_at": now.isoformat(),
    }


# ─── C1.1: Dedupe Search ─────────────────────────────────────────
@router.post("/guest/dedupe")
async def dedupe_search(
    user: dict = Depends(require_auth),
    email: str = Form(None),
    phone: str = Form(None),
    venue_id: str = Form(...),
):
    """C1.1 — Check for possible duplicate guests across venues (hashed) and within venue."""
    db = get_mongo_db()
    pool = get_postgres_pool()
    matches = []

    # ── Global dedupe via PG hashes ──
    email_hash = _hash_identifier(email) if email else None
    phone_hash = _hash_identifier(phone) if phone else None

    global_person_ids = set()
    async with pool.acquire() as conn:
        if email_hash:
            rows = await conn.fetch(
                "SELECT id FROM global_persons WHERE email_hash = $1", email_hash
            )
            for r in rows:
                global_person_ids.add(str(r["id"]))
        if phone_hash:
            rows = await conn.fetch(
                "SELECT id FROM global_persons WHERE phone_hash = $1", phone_hash
            )
            for r in rows:
                global_person_ids.add(str(r["id"]))

    # ── Venue-local search via MongoDB (PII stays venue-isolated) ──
    local_query = {"venue_id": venue_id}
    or_conditions = []
    if email:
        or_conditions.append({"email": email.strip().lower()})
    if phone:
        or_conditions.append({"phone": phone.strip()})
    if global_person_ids:
        or_conditions.append({"global_person_id": {"$in": list(global_person_ids)}})

    if or_conditions:
        local_query["$or"] = or_conditions
        cursor = db.venue_guests.find(local_query, {"_id": 0})
        docs = await cursor.to_list(20)
        for doc in docs:
            matches.append({
                "guest_id": doc["id"],
                "name": doc["name"],
                "email_masked": _mask_email(doc.get("email", "")),
                "phone_masked": _mask_phone(doc.get("phone", "")),
                "visits": doc.get("visits", 0),
                "spend_total": doc.get("spend_total", 0),
                "flags": doc.get("flags", []),
                "tags": doc.get("tags", []),
                "last_visit": doc.get("last_visit"),
                "photo": doc.get("photo"),
                "match_type": "venue_local",
            })

    # ── Cross-venue matches (masked only, no PII leak) ──
    if global_person_ids:
        cross_cursor = db.venue_guests.find(
            {
                "venue_id": {"$ne": venue_id},
                "global_person_id": {"$in": list(global_person_ids)},
            },
            {"_id": 0},
        )
        cross_docs = await cross_cursor.to_list(10)
        for doc in cross_docs:
            matches.append({
                "guest_id": None,
                "name": doc["name"][:1] + "***",
                "email_masked": _mask_email(doc.get("email", "")),
                "phone_masked": _mask_phone(doc.get("phone", "")),
                "visits": doc.get("visits", 0),
                "spend_total": doc.get("spend_total", 0),
                "flags": doc.get("flags", []),
                "tags": doc.get("tags", []),
                "last_visit": doc.get("last_visit"),
                "photo": None,
                "match_type": "cross_venue",
            })

    return {"matches": matches, "total": len(matches)}


# ─── C2: Decision Card (get guest with chips) ────────────────────
@router.get("/guest/{guest_id}")
async def get_guest_decision_card(guest_id: str, venue_id: str, user: dict = Depends(require_auth)):
    """C2 — Load guest profile with risk/value chips for decision."""
    db = get_mongo_db()
    pool = get_postgres_pool()

    doc = await db.venue_guests.find_one(
        {"id": guest_id, "venue_id": venue_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(404, "Guest not found in this venue")

    # ── Build risk chips ──
    risk_chips = []
    if "blocked" in doc.get("flags", []):
        risk_chips.append({"type": "blocked", "label": "Blocked", "severity": "critical"})
    if "flagged" in doc.get("flags", []):
        risk_chips.append({"type": "flagged", "label": "Flagged", "severity": "warning"})

    # Check unpaid entries in PG
    async with pool.acquire() as conn:
        unpaid = await conn.fetchval(
            """SELECT COUNT(*) FROM entry_events
               WHERE guest_id = $1::uuid AND venue_id = $2::uuid
               AND cover_paid = false AND cover_amount > 0""",
            uuid.UUID(guest_id), uuid.UUID(venue_id),
        ) if doc.get("global_person_id") else 0

    if unpaid and unpaid > 0:
        risk_chips.append({"type": "unpaid", "label": f"Unpaid ({unpaid})", "severity": "warning"})

    # ── Build value chips ──
    value_chips = []
    if "vip" in doc.get("tags", []):
        value_chips.append({"type": "vip", "label": "VIP"})
    spend = doc.get("spend_total", 0)
    if spend >= 500:
        value_chips.append({"type": "big_spender", "label": "Big Spender"})
    elif spend >= 100:
        value_chips.append({"type": "regular", "label": "Regular"})
    visits = doc.get("visits", 0)
    if visits >= 10:
        value_chips.append({"type": "loyal", "label": f"{visits} visits"})

    return {
        "guest_id": doc["id"],
        "name": doc["name"],
        "email": doc.get("email"),
        "phone": doc.get("phone"),
        "dob": doc.get("dob"),
        "photo": doc.get("photo"),
        "visits": visits,
        "spend_total": spend,
        "flags": doc.get("flags", []),
        "tags": doc.get("tags", []),
        "risk_chips": risk_chips,
        "value_chips": value_chips,
        "last_visit": doc.get("last_visit"),
    }


# ─── C2: Record Decision ─────────────────────────────────────────
@router.post("/entry/decision")
async def record_entry_decision(
    user: dict = Depends(require_auth),
    guest_id: str = Form(...),
    venue_id: str = Form(...),
    decision: str = Form(...),
    entry_type: str = Form("consumption_only"),
    cover_amount: float = Form(0),
    cover_paid: bool = Form(False),
):
    """C2 — Record allow/deny decision in PG entry_events."""
    if decision not in ("allowed", "denied"):
        raise HTTPException(400, "Decision must be 'allowed' or 'denied'")

    db = get_mongo_db()
    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)

    # Get guest's global_person_id
    guest_doc = await db.venue_guests.find_one({"id": guest_id, "venue_id": venue_id}, {"_id": 0})
    if not guest_doc:
        raise HTTPException(404, "Guest not found")

    gp_id = guest_doc.get("global_person_id")
    staff_id = user.get("sub")

    # ── Insert entry_event in PG ──
    async with pool.acquire() as conn:
        entry_row = await conn.fetchrow(
            """INSERT INTO entry_events
               (venue_id, event_id, guest_id, global_person_id,
                entry_type, cover_amount, cover_paid, decision,
                staff_user_id, created_at)
               VALUES ($1::uuid, $2::uuid, $3::uuid, $4,
                       $5, $6, $7, $8, $9::uuid, $10)
               RETURNING id""",
            uuid.UUID(venue_id),
            uuid.UUID(venue_id),  # event_id = venue_id for now (no event mgmt yet)
            uuid.UUID(guest_id),
            uuid.UUID(gp_id) if gp_id else None,
            entry_type,
            cover_amount,
            cover_paid,
            decision,
            uuid.UUID(staff_id),
            now,
        )

    # ── Update guest in MongoDB ──
    if decision == "allowed":
        await db.venue_guests.update_one(
            {"id": guest_id, "venue_id": venue_id},
            {
                "$inc": {"visits": 1},
                "$set": {"last_visit": now, "updated_at": now},
            },
        )

    return {
        "entry_id": str(entry_row["id"]),
        "decision": decision,
        "guest_id": guest_id,
        "created_at": now.isoformat(),
    }


# ─── C3: Today's entries ─────────────────────────────────────────
@router.get("/entries/today")
async def get_today_entries(venue_id: str, user: dict = Depends(require_auth)):
    """C3 — List today's entry events for a venue."""
    pool = get_postgres_pool()
    db = get_mongo_db()
    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, guest_id, decision, entry_type, cover_amount,
                      cover_paid, created_at
               FROM entry_events
               WHERE venue_id = $1::uuid AND created_at >= $2
               ORDER BY created_at DESC""",
            uuid.UUID(venue_id), today_start,
        )

    # Enrich with guest names from MongoDB
    entries = []
    for r in rows:
        guest_doc = await db.venue_guests.find_one(
            {"id": str(r["guest_id"])}, {"_id": 0, "name": 1, "photo": 1}
        )
        entries.append({
            "entry_id": str(r["id"]),
            "guest_id": str(r["guest_id"]),
            "guest_name": guest_doc["name"] if guest_doc else "Unknown",
            "guest_photo": guest_doc.get("photo") if guest_doc else None,
            "decision": r["decision"],
            "entry_type": r["entry_type"],
            "cover_amount": float(r["cover_amount"]) if r["cover_amount"] else 0,
            "cover_paid": r["cover_paid"],
            "created_at": r["created_at"].isoformat(),
        })

    return {
        "entries": entries,
        "total": len(entries),
        "allowed": sum(1 for e in entries if e["decision"] == "allowed"),
        "denied": sum(1 for e in entries if e["decision"] == "denied"),
    }
