from fastapi import APIRouter, HTTPException, Request, Depends
from middleware.auth_middleware import require_auth
from database import get_postgres_pool, get_mongo_db
from config import get_settings
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from utils.auth import hash_password
from utils.constants import PLANS, PROMO_ACTIVE, resolve_plan_id, get_plan, get_checkout_price
from datetime import datetime, timezone
import json
import uuid
import logging

router = APIRouter()
logger = logging.getLogger("onboarding")
settings = get_settings()


@router.get("/plans")
async def get_plans():
    """Return available plans with official and promo pricing."""
    plans_out = []
    for pid, p in PLANS.items():
        plans_out.append({
            "id": pid,
            "name": p["name"],
            "price": p["price"],
            "promo_price": p.get("promo_price"),
            "promo_active": PROMO_ACTIVE,
            "currency": p["currency"],
            "interval": p["interval"],
            "modules": p["modules"],
            "limits": p["limits"],
            "features": p["features"],
        })
    return {"plans": plans_out}


@router.post("/create-checkout")
async def create_checkout(request: Request, user: dict = Depends(require_auth)):
    """Create a Stripe checkout session for payment retry."""
    body = await request.json()
    origin_url = body.get("origin_url", "").strip()
    plan_id = body.get("plan_id", "").strip()

    if not origin_url:
        raise HTTPException(status_code=400, detail="Origin URL required")

    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, email, plan_id, status FROM users WHERE id = $1::uuid",
            user["sub"],
        )
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        if not plan_id:
            plan_id = resolve_plan_id(user_row.get("plan_id", "core") or "core")

        plan = get_plan(plan_id)
        if not plan:
            raise HTTPException(status_code=400, detail="Invalid plan")

        access = await conn.fetchrow(
            "SELECT company_id FROM user_access WHERE user_id = $1::uuid LIMIT 1",
            user["sub"],
        )
        company_id = str(access["company_id"]) if access and access["company_id"] else ""

    checkout_price = get_checkout_price(plan_id)
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment"

    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url=f"{origin_url}/api/webhook/stripe",
    )

    checkout_req = CheckoutSessionRequest(
        amount=checkout_price,
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["sub"],
            "company_id": company_id,
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "email": user_row["email"],
        },
    )

    session = await stripe_checkout.create_checkout_session(checkout_req)

    tx_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["sub"],
        "company_id": company_id,
        "stripe_session_id": session.session_id,
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "amount": checkout_price,
        "official_price": plan["price"],
        "currency": plan["currency"],
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx_doc)

    if plan_id != user_row.get("plan_id"):
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE users SET plan_id = $1 WHERE id = $2::uuid",
                plan_id, user["sub"],
            )

    return {"url": session.url, "session_id": session.session_id}


@router.get("/checkout/status/{session_id}")
async def check_checkout_status(session_id: str, user: dict = Depends(require_auth)):
    """Poll checkout status. Activates user on successful payment."""
    db = get_mongo_db()
    pool = get_postgres_pool()

    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url="",
    )

    status = await stripe_checkout.get_checkout_status(session_id)

    existing = await db.payment_transactions.find_one(
        {"stripe_session_id": session_id}, {"_id": 0}
    )

    if existing and existing.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"stripe_session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )

        if status.payment_status == "paid":
            user_id = existing.get("user_id") or user["sub"]
            async with pool.acquire() as conn:
                await conn.execute(
                    "UPDATE users SET status = 'active', updated_at = $1 WHERE id = $2::uuid AND status = 'pending_payment'",
                    datetime.now(timezone.utc), user_id,
                )
            logger.info(f"[ONBOARDING] User {user_id} activated after payment")

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }


@router.get("/status")
async def get_onboarding_status(user: dict = Depends(require_auth)):
    """Get current onboarding state."""
    pool = get_postgres_pool()
    db = get_mongo_db()

    async with pool.acquire() as conn:
        user_row = await conn.fetchrow(
            "SELECT id, name, email, status, onboarding_completed, onboarding_step, plan_id FROM users WHERE id = $1::uuid",
            user["sub"],
        )
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        access = await conn.fetchrow(
            "SELECT company_id, venue_id FROM user_access WHERE user_id = $1::uuid LIMIT 1",
            user["sub"],
        )

    venue = None
    if access and access["venue_id"]:
        venue = await db.venues.find_one({"id": str(access["venue_id"])}, {"_id": 0})

    return {
        "status": user_row["status"],
        "onboarding_completed": user_row.get("onboarding_completed", False),
        "onboarding_step": user_row.get("onboarding_step", 0),
        "plan_id": user_row.get("plan_id"),
        "has_venue": venue is not None,
        "venue": venue,
        "company_id": str(access["company_id"]) if access and access["company_id"] else None,
    }


@router.post("/account-setup")
async def onboarding_account_setup(request: Request, user: dict = Depends(require_auth)):
    """Step 2: Set up venue name and type."""
    body = await request.json()
    venue_name = body.get("venue_name", "").strip()
    venue_type = body.get("venue_type", "bar").strip()
    user_name = body.get("user_name", "").strip()

    if not venue_name:
        raise HTTPException(status_code=400, detail="Venue name is required")

    pool = get_postgres_pool()
    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        if user_name:
            await conn.execute(
                "UPDATE users SET name = $1, updated_at = $2 WHERE id = $3::uuid",
                user_name, now, user["sub"],
            )

        access = await conn.fetchrow(
            "SELECT id, company_id, venue_id FROM user_access WHERE user_id = $1::uuid LIMIT 1",
            user["sub"],
        )
        if not access:
            raise HTTPException(status_code=400, detail="No company access found")

        company_id = str(access["company_id"])

        if access["venue_id"]:
            await db.venues.update_one(
                {"id": str(access["venue_id"])},
                {"$set": {"name": venue_name, "venue_type": venue_type, "updated_at": now.isoformat()}},
            )
            venue_id = str(access["venue_id"])
        else:
            venue_id = str(uuid.uuid4())
            await db.venues.insert_one({
                "id": venue_id,
                "company_id": company_id,
                "name": venue_name,
                "venue_type": venue_type,
                "status": "active",
                "created_at": now.isoformat(),
            })

            await db.venue_configs.insert_one({
                "venue_id": venue_id,
                "modules": ["pulse", "tap", "table", "kds"],
                "host_collect_dob": True,
                "host_collect_photo": True,
                "bar_mode": "bar",
                "entry_types": ["vip", "cover", "cover_consumption", "consumption_only"],
            })

            await conn.execute(
                "UPDATE user_access SET venue_id = $1::uuid WHERE id = $2",
                uuid.UUID(venue_id), access["id"],
            )

        await conn.execute(
            "UPDATE users SET onboarding_step = GREATEST(onboarding_step, 2), updated_at = $1 WHERE id = $2::uuid",
            now, user["sub"],
        )

    return {"venue_id": venue_id, "step": 2}


@router.post("/password-reset")
async def onboarding_password_reset(request: Request, user: dict = Depends(require_auth)):
    """Step 3: Force password reset during onboarding."""
    body = await request.json()
    new_password = body.get("new_password", "").strip()

    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)

    hashed = hash_password(new_password)
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET password_hash = $1, onboarding_step = GREATEST(onboarding_step, 3), updated_at = $2 WHERE id = $3::uuid",
            hashed, now, user["sub"],
        )

    return {"step": 3}


@router.post("/modules-setup")
async def onboarding_modules_setup(request: Request, user: dict = Depends(require_auth)):
    """Step 4: Configure which modules are enabled."""
    body = await request.json()
    modules = body.get("modules", [])

    valid_modules = {"pulse", "tap", "table", "kds"}
    enabled_modules = [m for m in modules if m in valid_modules]

    if not enabled_modules:
        enabled_modules = ["pulse", "tap"]

    pool = get_postgres_pool()
    db = get_mongo_db()
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        access = await conn.fetchrow(
            "SELECT id, venue_id FROM user_access WHERE user_id = $1::uuid LIMIT 1",
            user["sub"],
        )
        if not access or not access["venue_id"]:
            raise HTTPException(status_code=400, detail="Complete account setup first")

        venue_id = str(access["venue_id"])

        permissions = {m: True for m in enabled_modules}
        permissions["HOST_COLLECT_DOB"] = True

        await conn.execute(
            "UPDATE user_access SET permissions = $1::jsonb WHERE id = $2",
            json.dumps(permissions), access["id"],
        )

        await db.venue_configs.update_one(
            {"venue_id": venue_id},
            {"$set": {"modules": enabled_modules}},
            upsert=True,
        )

        await conn.execute(
            "UPDATE users SET onboarding_step = GREATEST(onboarding_step, 4), updated_at = $1 WHERE id = $2::uuid",
            now, user["sub"],
        )

    return {"modules": enabled_modules, "step": 4}


@router.post("/team-setup")
async def onboarding_team_setup(request: Request, user: dict = Depends(require_auth)):
    """Step 5: Team setup placeholder."""
    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET onboarding_step = GREATEST(onboarding_step, 5), updated_at = $1 WHERE id = $2::uuid",
            now, user["sub"],
        )

    return {"step": 5}


@router.post("/complete")
async def onboarding_complete(user: dict = Depends(require_auth)):
    """Mark onboarding as completed."""
    pool = get_postgres_pool()
    now = datetime.now(timezone.utc)

    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET onboarding_completed = TRUE, onboarding_step = 6, updated_at = $1 WHERE id = $2::uuid",
            now, user["sub"],
        )

    return {"completed": True, "step": 6}
