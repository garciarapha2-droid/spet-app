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
):
    db = get_mongo_db()
    barman = {
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "name": name.strip(),
        "active": True,
    }
    await db.venue_barmen.insert_one(barman)
    barman.pop("_id", None)
    return barman


@router.put("/barmen/{barman_id}")
async def update_barman(
    barman_id: str,
    user: dict = Depends(require_auth),
    name: str = Form(...),
):
    db = get_mongo_db()
    result = await db.venue_barmen.update_one(
        {"id": barman_id},
        {"$set": {"name": name.strip()}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Barman not found")
    return {"id": barman_id, "name": name.strip(), "updated": True}


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
