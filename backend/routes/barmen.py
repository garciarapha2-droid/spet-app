from fastapi import APIRouter, HTTPException, Depends, Form
from middleware.auth_middleware import require_auth
from database import get_mongo_db
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/barmen")
async def list_barmen(venue_id: str, user: dict = Depends(require_auth)):
    db = get_mongo_db()
    cursor = db.venue_barmen.find({"venue_id": venue_id, "active": True}, {"_id": 0})
    barmen = await cursor.to_list(100)
    return {"barmen": barmen}


@router.post("/barmen")
async def add_barman(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    name: str = Form(...),
    role: str = Form("server"),
    hourly_rate: float = Form(0),
):
    db = get_mongo_db()
    barman = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "name": name.strip(),
        "role": role,
        "hourly_rate": hourly_rate,
        "active": True,
    }
    await db.venue_barmen.insert_one(barman)
    barman.pop("_id", None)
    return barman


@router.put("/barmen/{barman_id}")
async def update_barman(
    barman_id: str,
    user: dict = Depends(require_auth),
    name: str = Form(None),
    role: str = Form(None),
    hourly_rate: float = Form(None),
):
    db = get_mongo_db()
    update_fields = {}
    if name is not None:
        update_fields["name"] = name.strip()
    if role is not None:
        update_fields["role"] = role
    if hourly_rate is not None:
        update_fields["hourly_rate"] = hourly_rate
    if not update_fields:
        raise HTTPException(400, "No fields to update")
    result = await db.venue_barmen.update_one(
        {"id": barman_id},
        {"$set": update_fields},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Barman not found")
    updated = await db.venue_barmen.find_one({"id": barman_id}, {"_id": 0})
    return updated


@router.delete("/barmen/{barman_id}")
async def delete_barman(barman_id: str, user: dict = Depends(require_auth)):
    db = get_mongo_db()
    result = await db.venue_barmen.update_one(
        {"id": barman_id},
        {"$set": {"active": False}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Barman not found")
    return {"id": barman_id, "deleted": True}
