from fastapi import APIRouter, HTTPException, Request
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
from database import get_mongo_db
from config import get_settings
import uuid
from datetime import datetime, timezone

router = APIRouter()
settings = get_settings()

# Fixed pricing plans — never accept amounts from frontend
PLANS = {
    "starter": {"name": "Starter", "price": 79.00, "currency": "usd", "interval": "month", "features": ["1 Venue", "Pulse + Tap", "Basic KDS", "Up to 5 staff", "Email support"]},
    "growth":  {"name": "Growth",  "price": 149.00, "currency": "usd", "interval": "month", "features": ["3 Venues", "All Modules", "Advanced KDS + Bar", "Up to 20 staff", "Priority support", "Manager dashboard"]},
    "enterprise": {"name": "Enterprise", "price": 299.00, "currency": "usd", "interval": "month", "features": ["Unlimited Venues", "All Modules", "Custom integrations", "Unlimited staff", "Dedicated support", "CEO dashboard", "API access"]},
}


@router.get("/plans")
async def get_plans():
    """Return available pricing plans"""
    return {"plans": [
        {"id": k, **{key: v[key] for key in ["name", "price", "currency", "interval", "features"]}}
        for k, v in PLANS.items()
    ]}


@router.post("/lead")
async def capture_lead(request: Request):
    """Step 1: Capture lead info before payment"""
    body = await request.json()
    name = body.get("name", "").strip()
    email = body.get("email", "").strip()
    phone = body.get("phone", "").strip()
    plan_id = body.get("plan_id", "").strip()

    if not name or not email or not plan_id:
        raise HTTPException(status_code=400, detail="Name, email, and plan are required")

    if plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    db = get_mongo_db()

    lead_id = str(uuid.uuid4())
    lead_doc = {
        "id": lead_id,
        "name": name,
        "email": email,
        "phone": phone,
        "plan_id": plan_id,
        "plan_name": PLANS[plan_id]["name"],
        "status": "captured",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(lead_doc)

    return {"lead_id": lead_id, "status": "captured"}


@router.post("/checkout")
async def create_checkout(request: Request):
    """Step 2: Create Stripe checkout session for a plan"""
    body = await request.json()
    plan_id = body.get("plan_id", "").strip()
    lead_id = body.get("lead_id", "").strip()
    origin_url = body.get("origin_url", "").strip()

    if not plan_id or plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    if not origin_url:
        raise HTTPException(status_code=400, detail="Origin URL required")

    plan = PLANS[plan_id]
    db = get_mongo_db()

    # Build URLs from origin
    success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/pricing"

    # Create Stripe checkout
    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url=f"{origin_url}/api/webhook/stripe"
    )

    checkout_req = CheckoutSessionRequest(
        amount=plan["price"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "lead_id": lead_id or "",
            "source": "pricing_page",
        }
    )

    session = await stripe_checkout.create_checkout_session(checkout_req)

    # Store transaction
    tx_doc = {
        "id": str(uuid.uuid4()),
        "stripe_session_id": session.session_id,
        "lead_id": lead_id,
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "amount": plan["price"],
        "currency": plan["currency"],
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx_doc)

    return {"url": session.url, "session_id": session.session_id}


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Poll checkout status after redirect"""
    db = get_mongo_db()

    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url=""
    )

    status = await stripe_checkout.get_checkout_status(session_id)

    # Idempotent update — only update if not already completed
    existing = await db.payment_transactions.find_one(
        {"stripe_session_id": session_id},
        {"_id": 0}
    )

    if existing and existing.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"stripe_session_id": session_id},
            {"$set": {
                "payment_status": status.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }}
        )

        # If paid, update lead status
        if status.payment_status == "paid" and existing.get("lead_id"):
            await db.leads.update_one(
                {"id": existing["lead_id"]},
                {"$set": {
                    "status": "converted",
                    "converted_at": datetime.now(timezone.utc).isoformat(),
                }}
            )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }
