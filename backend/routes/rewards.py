from fastapi import APIRouter, HTTPException, Depends, Form
from middleware.auth_middleware import require_auth
from database import get_mongo_db
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/config")
async def get_rewards_config(venue_id: str, user: dict = Depends(require_auth)):
    """Get reward tiers and point rules for a venue."""
    db = get_mongo_db()
    cfg = await db.reward_configs.find_one({"venue_id": venue_id}, {"_id": 0})
    if not cfg:
        cfg = {
            "venue_id": venue_id,
            "enabled": False,
            "points_per_real": 1,
            "tiers": [
                {"name": "Bronze", "min_points": 0, "color": "#CD7F32", "perks": "Basic member"},
                {"name": "Silver", "min_points": 500, "color": "#C0C0C0", "perks": "Priority entry"},
                {"name": "Gold", "min_points": 2000, "color": "#FFD700", "perks": "VIP access + free drink"},
                {"name": "Platinum", "min_points": 5000, "color": "#E5E4E2", "perks": "All perks + reserved table"},
            ],
            "rewards": [
                {"id": str(uuid.uuid4()), "name": "Free Beer", "points_cost": 100, "active": True},
                {"id": str(uuid.uuid4()), "name": "VIP Upgrade", "points_cost": 500, "active": True},
                {"id": str(uuid.uuid4()), "name": "Free Entry", "points_cost": 300, "active": True},
            ],
        }
    return cfg


@router.post("/config")
async def save_rewards_config(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    enabled: bool = Form(True),
    points_per_real: int = Form(1),
):
    """Enable/update reward config for a venue."""
    db = get_mongo_db()
    now = datetime.now(timezone.utc)
    existing = await db.reward_configs.find_one({"venue_id": venue_id})
    if existing:
        await db.reward_configs.update_one(
            {"venue_id": venue_id},
            {"$set": {"enabled": enabled, "points_per_real": points_per_real, "updated_at": now}},
        )
    else:
        await db.reward_configs.insert_one({
            "venue_id": venue_id,
            "enabled": enabled,
            "points_per_real": points_per_real,
            "tiers": [
                {"name": "Bronze", "min_points": 0, "color": "#CD7F32", "perks": "Basic member"},
                {"name": "Silver", "min_points": 500, "color": "#C0C0C0", "perks": "Priority entry"},
                {"name": "Gold", "min_points": 2000, "color": "#FFD700", "perks": "VIP access + free drink"},
                {"name": "Platinum", "min_points": 5000, "color": "#E5E4E2", "perks": "All perks + reserved table"},
            ],
            "rewards": [],
            "created_at": now,
            "updated_at": now,
        })
    return {"status": "ok", "venue_id": venue_id, "enabled": enabled}


@router.post("/config/tiers")
async def update_tiers(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    tiers_json: str = Form(...),
):
    """Update tier definitions."""
    import json
    db = get_mongo_db()
    tiers = json.loads(tiers_json)
    await db.reward_configs.update_one(
        {"venue_id": venue_id},
        {"$set": {"tiers": tiers, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"status": "ok", "tiers": tiers}


@router.post("/config/rewards")
async def update_rewards_list(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    rewards_json: str = Form(...),
):
    """Update available rewards."""
    import json
    db = get_mongo_db()
    rewards = json.loads(rewards_json)
    for r in rewards:
        if not r.get("id"):
            r["id"] = str(uuid.uuid4())
    await db.reward_configs.update_one(
        {"venue_id": venue_id},
        {"$set": {"rewards": rewards, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    return {"status": "ok", "rewards": rewards}


@router.post("/points/add")
async def add_points(
    user: dict = Depends(require_auth),
    venue_id: str = Form(...),
    guest_id: str = Form(...),
    points: int = Form(...),
    reason: str = Form("purchase"),
):
    """Add reward points to a guest."""
    db = get_mongo_db()
    guest = await db.venue_guests.find_one({"id": guest_id, "venue_id": venue_id})
    if not guest:
        raise HTTPException(404, "Guest not found")

    current = guest.get("reward_points", 0)
    new_total = current + points
    await db.venue_guests.update_one(
        {"id": guest_id, "venue_id": venue_id},
        {"$set": {"reward_points": new_total, "updated_at": datetime.now(timezone.utc)}},
    )

    # Log the points transaction
    await db.reward_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "venue_id": venue_id,
        "guest_id": guest_id,
        "points": points,
        "reason": reason,
        "staff_id": user.get("sub"),
        "created_at": datetime.now(timezone.utc),
    })

    return {"guest_id": guest_id, "points_added": points, "total_points": new_total}


@router.get("/guest/{guest_id}/points")
async def get_guest_points(guest_id: str, venue_id: str, user: dict = Depends(require_auth)):
    """Get guest's reward points and tier."""
    db = get_mongo_db()
    guest = await db.venue_guests.find_one({"id": guest_id, "venue_id": venue_id}, {"_id": 0})
    if not guest:
        raise HTTPException(404, "Guest not found")

    points = guest.get("reward_points", 0)

    # Get tier config
    cfg = await db.reward_configs.find_one({"venue_id": venue_id}, {"_id": 0})
    tiers = cfg.get("tiers", []) if cfg else []
    current_tier = "None"
    for t in sorted(tiers, key=lambda x: x.get("min_points", 0), reverse=True):
        if points >= t.get("min_points", 0):
            current_tier = t["name"]
            break

    # Recent transactions
    cursor = db.reward_transactions.find(
        {"guest_id": guest_id, "venue_id": venue_id}, {"_id": 0}
    ).sort("created_at", -1).limit(20)
    transactions = await cursor.to_list(20)
    for t in transactions:
        if isinstance(t.get("created_at"), datetime):
            t["created_at"] = t["created_at"].isoformat()

    return {
        "guest_id": guest_id,
        "name": guest.get("name", ""),
        "points": points,
        "tier": current_tier,
        "transactions": transactions,
    }
