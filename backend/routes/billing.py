from fastapi import APIRouter, HTTPException, Request, Depends, Header
from middleware.auth_middleware import require_auth
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse
from database import get_mongo_db
from config import get_settings
import uuid
from datetime import datetime, timezone
import json

router = APIRouter()
settings = get_settings()

@router.post("/checkout/session")
async def create_checkout_session(request: CheckoutSessionRequest, user: dict = Depends(require_auth)):
    """Create Stripe checkout session for subscription"""
    db = get_mongo_db()
    
    # Initialize Stripe
    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url=f"{request.success_url.split('?')[0].rsplit('/', 2)[0]}/api/webhook/stripe"
    )
    
    # Create checkout session
    session = await stripe_checkout.create_checkout_session(request)
    
    # Store transaction
    company_id = request.metadata.get('company_id') if hasattr(request, 'metadata') else None
    
    transaction_doc = {
        "id": str(uuid.uuid4()),
        "company_id": company_id,
        "user_id": user['sub'],
        "stripe_session_id": session.session_id,
        "amount": request.amount if hasattr(request, 'amount') else 0,
        "currency": request.currency if hasattr(request, 'currency') else 'usd',
        "payment_status": 'pending',
        "metadata": request.metadata if hasattr(request, 'metadata') else {},
        "created_at": datetime.now(timezone.utc)
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get checkout session status"""
    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url=""
    )
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    db = get_mongo_db()
    await db.payment_transactions.update_one(
        {"stripe_session_id": session_id},
        {"$set": {
            "payment_status": status.payment_status,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    return status

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhooks"""
    body = await request.body()
    
    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url=""
    )
    
    try:
        webhook_event = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Process webhook event idempotently
        db = get_mongo_db()
        
        # Check if event already processed (idempotency)
        existing = await db.invoice_events.find_one({"stripe_event_id": webhook_event.event_id})
        
        if existing:
            return {"status": "already_processed"}
        
        # Store event
        event_doc = {
            "id": str(uuid.uuid4()),
            "stripe_event_id": webhook_event.event_id,
            "stripe_event_type": webhook_event.event_type,
            "payload": {"event_type": webhook_event.event_type},
            "received_at": datetime.now(timezone.utc),
            "processing_status": 'received'
        }
        await db.invoice_events.insert_one(event_doc)
        
        # Process based on event type
        # TODO: Implement subscription state changes
        
        # Mark as processed
        await db.invoice_events.update_one(
            {"id": event_doc["id"]},
            {"$set": {
                "processing_status": 'processed',
                "processed_at": datetime.now(timezone.utc)
            }}
        )
        
        return {"status": "success"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/entitlements")
async def get_entitlements(user: dict = Depends(require_auth), company_id: str = None):
    """Get entitlements for a company/venue"""
    db = get_mongo_db()
    
    # Get company_id from user's first role if not provided
    if not company_id and user.get('roles'):
        company_id = user['roles'][0].get('company_id')
    
    if not company_id:
        return {"modules": []}
    
    entitlements = await db.entitlements.find({
        "company_id": company_id,
        "status": {"$in": ["active", "grace"]}
    }).to_list(100)
    
    modules = []
    for ent in entitlements:
        modules.append({
            "module": ent['module'],
            "status": ent['status'],
            "scope": ent['scope'],
            "active": ent['status'] == 'active'
        })
    
    return {"modules": modules}
