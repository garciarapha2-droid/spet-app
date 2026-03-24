"""CRM API routes: Deals, Customers, Activities — real persistence via Postgres."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from middleware.auth_middleware import require_auth
from database import get_postgres_pool
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

PLAN_MODULES = {
    "core": ["pulse"],
    "flow": ["pulse", "tap", "table"],
    "sync": ["pulse", "tap", "table", "kds", "bar", "finance"],
    "os": ["pulse", "tap", "table", "kds", "bar", "finance", "analytics", "ai"],
}


def _row_to_dict(row):
    """Convert asyncpg Record to dict, handling UUID and datetime."""
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, uuid.UUID):
            d[k] = str(v)
        elif isinstance(v, datetime):
            d[k] = v.isoformat()
        elif hasattr(v, 'isoformat'):
            d[k] = v.isoformat()
    return d


# ─── DEALS ─────────────────────────────────────────────────

@router.get("/deals")
async def list_deals(stage: Optional[str] = None, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        if stage:
            rows = await conn.fetch(
                "SELECT * FROM deals WHERE stage=$1 ORDER BY created_at DESC", stage
            )
        else:
            rows = await conn.fetch("SELECT * FROM deals ORDER BY created_at DESC")
    return {"deals": [_row_to_dict(r) for r in rows]}


@router.get("/deals/{deal_id}")
async def get_deal(deal_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        deal = await conn.fetchrow("SELECT * FROM deals WHERE id=$1::uuid", deal_id)
        if not deal:
            raise HTTPException(404, "Deal not found")
        activities = await conn.fetch(
            "SELECT * FROM deal_activities WHERE deal_id=$1::uuid ORDER BY created_at DESC",
            deal_id
        )
    result = _row_to_dict(deal)
    result["activities"] = [_row_to_dict(a) for a in activities]
    return result


class DealUpdate(BaseModel):
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    company_name: Optional[str] = None
    address: Optional[str] = None
    plan_id: Optional[str] = None
    stage: Optional[str] = None
    deal_value: Optional[float] = None
    notes: Optional[str] = None


@router.put("/deals/{deal_id}")
async def update_deal(deal_id: str, body: DealUpdate, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")

    set_parts = [f"{k}=${i+2}" for i, k in enumerate(updates.keys())]
    set_parts.append(f"updated_at=${len(updates)+2}")
    sql = f"UPDATE deals SET {', '.join(set_parts)} WHERE id=$1::uuid RETURNING *"
    values = [deal_id] + list(updates.values()) + [datetime.now(timezone.utc)]

    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *values)
        if not row:
            raise HTTPException(404, "Deal not found")
    return _row_to_dict(row)


@router.post("/deals/{deal_id}/won")
async def close_deal_as_won(deal_id: str, user: dict = Depends(require_auth)):
    """Mark deal as won and create customer automatically."""
    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        # 1. Get the deal
        deal = await conn.fetchrow("SELECT * FROM deals WHERE id=$1::uuid", deal_id)
        if not deal:
            raise HTTPException(404, "Deal not found")
        if deal["stage"] == "closed_won":
            raise HTTPException(400, "Deal already closed as won")

        # 2. Update deal
        await conn.execute(
            "UPDATE deals SET stage='closed_won', closed_at=$2, updated_at=$2 WHERE id=$1::uuid",
            deal_id, now
        )

        # 3. Create customer
        modules = PLAN_MODULES.get(deal["plan_id"], ["pulse"])
        customer = await conn.fetchrow(
            """INSERT INTO customers (company_name, contact_name, contact_email, contact_phone,
               address, plan_id, status, mrr, deal_id, notes, modules_enabled, signup_date)
               VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8::uuid, $9, $10, CURRENT_DATE)
               RETURNING *""",
            deal["company_name"], deal["contact_name"], deal["contact_email"],
            deal["contact_phone"], deal["address"], deal["plan_id"],
            float(deal["deal_value"]), deal_id, deal["notes"], modules
        )

        # 4. Log activity
        await conn.execute(
            "INSERT INTO deal_activities (deal_id, type, description) VALUES ($1::uuid, 'note', $2)",
            deal_id, "Deal closed as WON — customer created"
        )

    return {"success": True, "customer": _row_to_dict(customer)}


@router.post("/deals/{deal_id}/lost")
async def close_deal_as_lost(deal_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE deals SET stage='closed_lost', closed_at=$2, updated_at=$2 WHERE id=$1::uuid RETURNING *",
            deal_id, now
        )
        if not row:
            raise HTTPException(404, "Deal not found")
        await conn.execute(
            "INSERT INTO deal_activities (deal_id, type, description) VALUES ($1::uuid, 'note', $2)",
            deal_id, "Deal marked as LOST"
        )
    return _row_to_dict(row)


class DealCreate(BaseModel):
    contact_name: str
    contact_email: str
    contact_phone: Optional[str] = None
    company_name: str
    address: Optional[str] = None
    plan_id: str = "core"
    stage: str = "lead"
    deal_value: float = 0
    notes: Optional[str] = None


@router.post("/deals")
async def create_deal(body: DealCreate, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO deals (contact_name, contact_email, contact_phone, company_name,
               address, plan_id, stage, deal_value, notes)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *""",
            body.contact_name, body.contact_email, body.contact_phone, body.company_name,
            body.address, body.plan_id, body.stage, body.deal_value, body.notes
        )
    return _row_to_dict(row)


# ─── ACTIVITIES ────────────────────────────────────────────

class ActivityCreate(BaseModel):
    type: str = "note"
    description: str


@router.post("/deals/{deal_id}/activities")
async def add_activity(deal_id: str, body: ActivityCreate, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO deal_activities (deal_id, type, description) VALUES ($1::uuid, $2, $3) RETURNING *",
            deal_id, body.type, body.description
        )
    return _row_to_dict(row)


class ActivityUpdate(BaseModel):
    description: str


@router.put("/activities/{activity_id}")
async def update_activity(activity_id: str, body: ActivityUpdate, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE deal_activities SET description=$2, updated_at=$3 WHERE id=$1::uuid RETURNING *",
            activity_id, body.description, datetime.now(timezone.utc)
        )
        if not row:
            raise HTTPException(404, "Activity not found")
    return _row_to_dict(row)


@router.delete("/activities/{activity_id}")
async def delete_activity(activity_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM deal_activities WHERE id=$1::uuid", activity_id)
    return {"success": True}


# ─── CUSTOMERS ─────────────────────────────────────────────

@router.get("/customers")
async def list_customers(
    status: Optional[str] = None,
    plan_id: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(require_auth)
):
    pool = get_postgres_pool()
    conditions = []
    params = []
    idx = 1

    if status:
        conditions.append(f"status=${idx}")
        params.append(status)
        idx += 1
    if plan_id:
        conditions.append(f"plan_id=${idx}")
        params.append(plan_id)
        idx += 1
    if search:
        conditions.append(f"(company_name ILIKE ${idx} OR contact_name ILIKE ${idx} OR contact_email ILIKE ${idx})")
        params.append(f"%{search}%")
        idx += 1

    where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = f"SELECT * FROM customers{where} ORDER BY created_at DESC"

    async with pool.acquire() as conn:
        rows = await conn.fetch(sql, *params)
    return {"customers": [_row_to_dict(r) for r in rows]}


@router.get("/customers/{customer_id}")
async def get_customer(customer_id: str, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM customers WHERE id=$1::uuid", customer_id)
        if not row:
            raise HTTPException(404, "Customer not found")
    return _row_to_dict(row)




class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    plan_id: Optional[str] = None
    status: Optional[str] = None
    mrr: Optional[float] = None
    modules_enabled: Optional[list] = None
    notes: Optional[str] = None


@router.put("/customers/{customer_id}")
async def update_customer(customer_id: str, body: CustomerUpdate, user: dict = Depends(require_auth)):
    pool = get_postgres_pool()
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")

    set_parts = []
    values = [customer_id]
    idx = 2
    for k, v in updates.items():
        set_parts.append(f"{k}=${idx}")
        values.append(v)
        idx += 1
    set_parts.append(f"updated_at=${idx}")
    values.append(datetime.now(timezone.utc))

    sql = f"UPDATE customers SET {', '.join(set_parts)} WHERE id=$1::uuid RETURNING *"

    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *values)
        if not row:
            raise HTTPException(404, "Customer not found")
    return _row_to_dict(row)
