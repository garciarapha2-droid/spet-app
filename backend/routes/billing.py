from fastapi import APIRouter, HTTPException, Request, Depends, Header
from middleware.auth_middleware import require_auth
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest, CheckoutSessionResponse
from database import get_postgres_conn, release_postgres_conn
from config import get_settings
import uuid
from datetime import datetime, timezone
import json

router = APIRouter()
settings = get_settings()

@router.post("/checkout/session")
async def create_checkout_session(request: CheckoutSessionRequest, user: dict = Depends(require_auth)):
    """Create Stripe checkout session for subscription"""
    conn = await get_postgres_conn()
    try:
        # Initialize Stripe
        stripe_checkout = StripeCheckout(
            api_key=settings.stripe_api_key,
            webhook_url=f"{request.success_url.split('?')[0].rsplit('/', 2)[0]}/api/webhook/stripe"
        )
        
        # Create checkout session
        session = await stripe_checkout.create_checkout_session(request)
        
        # Store transaction
        company_id = request.metadata.get('company_id') if hasattr(request, 'metadata') else None
        
        await conn.execute(
            """INSERT INTO payment_transactions 
               (id, company_id, user_id, stripe_session_id, amount, currency, payment_status, metadata, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            uuid.uuid4(),
            uuid.UUID(company_id) if company_id else None,
            uuid.UUID(user['sub']),
            session.session_id,
            request.amount if hasattr(request, 'amount') else 0,
            request.currency if hasattr(request, 'currency') else 'usd',
            'pending',
            json.dumps(request.metadata if hasattr(request, 'metadata') else {}),
            datetime.now(timezone.utc)
        )
        
        return {"url": session.url, "session_id": session.session_id}
        
    finally:
        await release_postgres_conn(conn)

@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get checkout session status"""
    stripe_checkout = StripeCheckout(
        api_key=settings.stripe_api_key,
        webhook_url=""
    )
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    conn = await get_postgres_conn()
    try:
        await conn.execute(
            """UPDATE payment_transactions 
               SET payment_status = $1, updated_at = $2
               WHERE stripe_session_id = $3""",
            status.payment_status,
            datetime.now(timezone.utc),
            session_id
        )
    finally:
        await release_postgres_conn(conn)
    
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
        conn = await get_postgres_conn()
        try:
            # Check if event already processed (idempotency)
            existing = await conn.fetchrow(
                "SELECT id FROM invoice_events WHERE stripe_event_id = $1",
                webhook_event.event_id
            )
            
            if existing:
                return {"status": "already_processed"}
            
            # Store event
            event_id = uuid.uuid4()
            await conn.execute(
                """INSERT INTO invoice_events 
                   (id, stripe_event_id, stripe_event_type, payload, received_at, processing_status)
                   VALUES ($1, $2, $3, $4, $5, $6)""",
                event_id,
                webhook_event.event_id,
                webhook_event.event_type,
                json.dumps({"event_type": webhook_event.event_type}),
                datetime.now(timezone.utc),
                'received'
            )
            
            # Process based on event type
            if webhook_event.event_type == "checkout.session.completed":
                # Update subscription and entitlements
                pass
            elif webhook_event.event_type == "customer.subscription.updated":
                # Update subscription status
                pass
            elif webhook_event.event_type == "invoice.paid":
                # Activate entitlements
                pass
            elif webhook_event.event_type == "invoice.payment_failed":
                # Set to past_due
                pass
            
            # Mark as processed
            await conn.execute(
                "UPDATE invoice_events SET processing_status = $1, processed_at = $2 WHERE id = $3",
                'processed',
                datetime.now(timezone.utc),
                event_id
            )
            
            return {"status": "success"}
            
        finally:
            await release_postgres_conn(conn)
            
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/entitlements")
async def get_entitlements(user: dict = Depends(require_auth), company_id: str = None):
    """Get entitlements for a company/venue"""
    conn = await get_postgres_conn()
    try:
        query = """SELECT module, status, scope, active_from, active_until 
                   FROM entitlements 
                   WHERE company_id = $1 AND status IN ('active', 'grace')"""
        
        # Get company_id from user's first role if not provided
        if not company_id and user.get('roles'):
            company_id = user['roles'][0].get('company_id')
        
        if not company_id:
            return {"modules": []}
        
        rows = await conn.fetch(query, uuid.UUID(company_id))
        
        modules = []
        for row in rows:
            modules.append({
                "module": row['module'],
                "status": row['status'],
                "scope": row['scope'],
                "active": row['status'] == 'active'
            })
        
        return {"modules": modules}
        
    finally:
        await release_postgres_conn(conn)
