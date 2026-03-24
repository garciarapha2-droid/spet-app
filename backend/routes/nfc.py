"""NFC API — Tag registration and scanning for mobile app.
All data stored in PostgreSQL (nfc_tags table), guest lookup from MongoDB."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from middleware.auth_middleware import require_auth
from database import get_postgres_pool, get_mongo_db
from ws_manager import ws_manager
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class NfcRegisterRequest(BaseModel):
    tag_uid: str
    guest_id: str
    venue_id: str
    label: str = None


class NfcScanRequest(BaseModel):
    tag_uid: str
    venue_id: str


class NfcUnlinkRequest(BaseModel):
    tag_uid: str
    venue_id: str


# ─── POST /register — Bind a physical NFC tag to a guest ─────────

@router.post("/register")
async def register_nfc_tag(req: NfcRegisterRequest, user: dict = Depends(require_auth)):
    """
    Register (bind) a real NFC tag to a guest in a venue.
    - Validates that the tag_uid is not already active in this venue.
    - Validates that the guest_id exists in MongoDB.
    - Stores binding in PostgreSQL nfc_tags table.
    """
    tag_uid = req.tag_uid.strip().upper()
    if not tag_uid:
        raise HTTPException(400, "tag_uid is required")

    pool = get_postgres_pool()
    db = get_mongo_db()

    # 1. Validate guest exists in this venue
    guest = await db.venue_guests.find_one(
        {"id": req.guest_id, "venue_id": req.venue_id}, {"_id": 0}
    )
    if not guest:
        raise HTTPException(404, "Guest not found in this venue")

    staff_id = user.get("sub", "unknown")

    async with pool.acquire() as conn:
        # 2. Check if tag exists in this venue (any status)
        existing = await conn.fetchrow(
            "SELECT id, guest_id, status FROM nfc_tags WHERE tag_uid=$1 AND venue_id=$2",
            tag_uid, req.venue_id,
        )
        if existing:
            if existing["status"] == "active":
                if str(existing["guest_id"]) == req.guest_id:
                    return {
                        "tag_id": str(existing["id"]),
                        "tag_uid": tag_uid,
                        "guest_id": req.guest_id,
                        "guest_name": guest.get("name", ""),
                        "venue_id": req.venue_id,
                        "status": "active",
                        "message": "Tag already registered to this guest",
                    }
                raise HTTPException(
                    409,
                    f"Tag {tag_uid} is already assigned to another guest in this venue. "
                    "Unlink it first with POST /api/nfc/unlink.",
                )
            # Tag exists but is unlinked/replaced — reactivate with new guest
            await conn.execute(
                "UPDATE nfc_tags SET guest_id=$1, status='active', label=$2, assigned_by=$3, created_at=$4, last_scanned=NULL WHERE id=$5",
                req.guest_id, req.label, staff_id, datetime.now(timezone.utc), existing["id"],
            )
            # Deactivate any other active tag for this guest
            await conn.execute(
                "UPDATE nfc_tags SET status='replaced' WHERE guest_id=$1 AND venue_id=$2 AND status='active' AND id!=$3",
                req.guest_id, req.venue_id, existing["id"],
            )
            return {
                "tag_id": str(existing["id"]),
                "tag_uid": tag_uid,
                "guest_id": req.guest_id,
                "guest_name": guest.get("name", ""),
                "venue_id": req.venue_id,
                "status": "active",
                "label": req.label,
                "assigned_by": staff_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "message": "Tag re-registered successfully",
            }

        # 3. Deactivate any previous binding for this guest (one active tag per guest)
        await conn.execute(
            "UPDATE nfc_tags SET status='replaced' WHERE guest_id=$1 AND venue_id=$2 AND status='active'",
            req.guest_id, req.venue_id,
        )

        # 4. Insert new binding
        row = await conn.fetchrow(
            """INSERT INTO nfc_tags (tag_uid, guest_id, venue_id, status, label, assigned_by, created_at)
               VALUES ($1, $2, $3, 'active', $4, $5, $6)
               RETURNING id, created_at""",
            tag_uid, req.guest_id, req.venue_id,
            req.label, staff_id, datetime.now(timezone.utc),
        )

    logger.info(f"NFC tag {tag_uid} registered to guest {req.guest_id} in venue {req.venue_id}")

    return {
        "tag_id": str(row["id"]),
        "tag_uid": tag_uid,
        "guest_id": req.guest_id,
        "guest_name": guest.get("name", ""),
        "venue_id": req.venue_id,
        "status": "active",
        "label": req.label,
        "assigned_by": staff_id,
        "created_at": row["created_at"].isoformat(),
        "message": "Tag registered successfully",
    }


# ─── POST /scan — Scan a tag and return guest context ─────────────

@router.post("/scan")
async def scan_nfc_tag(req: NfcScanRequest, user: dict = Depends(require_auth)):
    """
    Scan an NFC tag: look up binding, return guest + entry context.
    - Finds active binding by tag_uid + venue_id.
    - Returns full guest profile from MongoDB.
    - Updates last_scanned timestamp.
    - Includes open tab info if available.
    """
    tag_uid = req.tag_uid.strip().upper()
    if not tag_uid:
        raise HTTPException(400, "tag_uid is required")

    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        # 1. Look up active tag binding
        tag_row = await conn.fetchrow(
            "SELECT id, guest_id, venue_id, label, created_at FROM nfc_tags WHERE tag_uid=$1 AND venue_id=$2 AND status='active'",
            tag_uid, req.venue_id,
        )
        if not tag_row:
            raise HTTPException(
                404,
                f"No active binding found for tag {tag_uid} in this venue. "
                "Register it first with POST /api/nfc/register.",
            )

        # 2. Update last_scanned
        now = datetime.now(timezone.utc)
        await conn.execute(
            "UPDATE nfc_tags SET last_scanned=$1 WHERE id=$2",
            now, tag_row["id"],
        )

    guest_id = str(tag_row["guest_id"])

    # 3. Fetch guest from MongoDB
    guest = await db.venue_guests.find_one(
        {"id": guest_id, "venue_id": req.venue_id}, {"_id": 0}
    )
    if not guest:
        raise HTTPException(404, "Guest linked to this tag no longer exists in this venue")

    # 4. Check for open tab in tap_sessions
    tab_number = None
    tab_total = 0
    async with pool.acquire() as conn:
        tab_row = await conn.fetchrow(
            """SELECT id, meta, total FROM tap_sessions
               WHERE guest_id=$1::uuid AND venue_id=$2::uuid AND status='open'
               ORDER BY opened_at DESC LIMIT 1""",
            uuid.UUID(guest_id), uuid.UUID(req.venue_id),
        )
        if tab_row:
            meta = tab_row["meta"]
            if isinstance(meta, str):
                import json
                try:
                    meta = json.loads(meta)
                except Exception:
                    meta = {}
            tab_number = meta.get("tab_number") if meta else None
            tab_total = float(tab_row["total"]) if tab_row["total"] else 0

    # 5. Build risk/value chips (same logic as pulse decision card)
    risk_chips = []
    if "blocked" in guest.get("flags", []):
        risk_chips.append({"type": "blocked", "label": "Blocked", "severity": "critical"})
    if "flagged" in guest.get("flags", []):
        risk_chips.append({"type": "flagged", "label": "Flagged", "severity": "warning"})

    value_chips = []
    if "vip" in guest.get("tags", []):
        value_chips.append({"type": "vip", "label": "VIP"})
    spend = guest.get("spend_total", 0)
    if spend >= 500:
        value_chips.append({"type": "big_spender", "label": "Big Spender"})
    elif spend >= 100:
        value_chips.append({"type": "regular", "label": "Regular"})

    # 6. Broadcast scan event
    await ws_manager.broadcast(req.venue_id, "nfc_scanned", {
        "guest_id": guest_id,
        "guest_name": guest.get("name", ""),
        "tag_uid": tag_uid,
        "tab_number": tab_number,
    })

    return {
        "tag_uid": tag_uid,
        "tag_id": str(tag_row["id"]),
        "guest": {
            "id": guest_id,
            "name": guest.get("name", ""),
            "email": guest.get("email"),
            "phone": guest.get("phone"),
            "photo": guest.get("photo"),
            "visits": guest.get("visits", 0),
            "spend_total": spend,
            "flags": guest.get("flags", []),
            "tags": guest.get("tags", []),
            "risk_chips": risk_chips,
            "value_chips": value_chips,
            "last_visit": guest.get("last_visit").isoformat() if guest.get("last_visit") else None,
        },
        "tab": {
            "number": tab_number,
            "total": tab_total,
            "has_open_tab": tab_number is not None,
        },
        "scanned_at": now.isoformat(),
    }


# ─── POST /unlink — Deactivate a tag binding ─────────────────────

@router.post("/unlink")
async def unlink_nfc_tag(req: NfcUnlinkRequest, user: dict = Depends(require_auth)):
    """Deactivate an NFC tag binding (does not delete, just marks as unlinked)."""
    tag_uid = req.tag_uid.strip().upper()
    pool = get_postgres_pool()

    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE nfc_tags SET status='unlinked' WHERE tag_uid=$1 AND venue_id=$2 AND status='active'",
            tag_uid, req.venue_id,
        )
        if result == "UPDATE 0":
            raise HTTPException(404, "No active tag binding found")

    return {"tag_uid": tag_uid, "venue_id": req.venue_id, "status": "unlinked"}


# ─── GET /tags — List all tags for a venue ────────────────────────

@router.get("/tags")
async def list_venue_tags(venue_id: str, status: str = "active", user: dict = Depends(require_auth)):
    """List all NFC tag bindings for a venue, optionally filtered by status."""
    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, tag_uid, guest_id, status, label, assigned_by, created_at, last_scanned "
            "FROM nfc_tags WHERE venue_id=$1 AND ($2='all' OR status=$2) ORDER BY created_at DESC",
            venue_id, status,
        )

    tags = []
    for r in rows:
        guest = await db.venue_guests.find_one(
            {"id": str(r["guest_id"]), "venue_id": venue_id},
            {"_id": 0, "name": 1, "photo": 1},
        )
        tags.append({
            "tag_id": str(r["id"]),
            "tag_uid": r["tag_uid"],
            "guest_id": str(r["guest_id"]),
            "guest_name": guest.get("name", "Unknown") if guest else "Unknown",
            "guest_photo": guest.get("photo") if guest else None,
            "status": r["status"],
            "label": r["label"],
            "assigned_by": r["assigned_by"],
            "created_at": r["created_at"].isoformat(),
            "last_scanned": r["last_scanned"].isoformat() if r["last_scanned"] else None,
        })

    return {"tags": tags, "total": len(tags)}
