-- SPETAP Postgres Schema (Billing, Ledger, Transactional)
-- This handles all financial and subscription data
--
-- SAFETY: This file ONLY uses CREATE TABLE IF NOT EXISTS.
-- It NEVER drops, truncates, or deletes existing data.
-- Protected user accounts must NEVER be affected by schema changes.
--

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'USER' NOT NULL,
    is_system_account BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Companies (top-level tenants)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User access (RBAC with company/venue scope)
CREATE TABLE IF NOT EXISTS user_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    venue_id UUID,  -- MongoDB reference
    role VARCHAR(50) NOT NULL,  -- platform_admin, ceo, owner, manager, host, tap, kitchen, cashier
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_access_user ON user_access(user_id);
CREATE INDEX idx_user_access_company ON user_access(company_id);
CREATE INDEX idx_user_access_venue ON user_access(venue_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    stripe_setup_fee_price_id VARCHAR(255),
    stripe_checkout_session_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'incomplete',  -- incomplete, trialing, active, past_due, canceled, unpaid
    interval VARCHAR(20),  -- month, year
    currency VARCHAR(10) DEFAULT 'usd',
    current_period_amount_cents BIGINT,
    setup_fee_amount_cents BIGINT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    grace_period_days INTEGER DEFAULT 7,
    past_due_since TIMESTAMPTZ,
    access_cutoff_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    setup_fee_refundable BOOLEAN DEFAULT FALSE,
    plan_key VARCHAR(100),
    meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_customer ON subscriptions(stripe_customer_id);

-- Entitlements (feature gating)
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    venue_id UUID,  -- MongoDB reference, nullable for company-level
    scope VARCHAR(20) NOT NULL,  -- company or venue
    module VARCHAR(50) NOT NULL,  -- pulse, tap, restaurant, loyalty, event_wallet
    status VARCHAR(20) DEFAULT 'disabled',  -- active, grace, disabled, revoked
    active_from TIMESTAMPTZ,
    active_until TIMESTAMPTZ,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT entitlement_scope_venue_check CHECK (
        (scope='company' AND venue_id IS NULL) OR
        (scope='venue' AND venue_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX ux_entitlement_company_module ON entitlements(company_id, module) WHERE scope='company';
CREATE UNIQUE INDEX ux_entitlement_venue_module ON entitlements(venue_id, module) WHERE scope='venue';
CREATE INDEX idx_entitlement_company ON entitlements(company_id);
CREATE INDEX idx_entitlement_status ON entitlements(status);

-- Invoice events (webhook audit log)
CREATE TABLE IF NOT EXISTS invoice_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,  -- idempotency
    stripe_event_type VARCHAR(100) NOT NULL,
    stripe_object_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_status VARCHAR(50) DEFAULT 'received',  -- received, processed, ignored, failed
    error_message TEXT,
    payload JSONB NOT NULL,
    amount_due_cents BIGINT,
    amount_paid_cents BIGINT,
    currency VARCHAR(10),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    invoice_status VARCHAR(50),
    payment_intent_status VARCHAR(50),
    meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_invoice_events_company ON invoice_events(company_id);
CREATE INDEX idx_invoice_events_type ON invoice_events(stripe_event_type);
CREATE INDEX idx_invoice_events_received ON invoice_events(received_at);

-- Payment transactions (Stripe checkout tracking)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stripe_session_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'usd',
    payment_status VARCHAR(50) DEFAULT 'pending',  -- pending, paid, failed, expired
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global person (dedupe without PII leak)
CREATE TABLE IF NOT EXISTS global_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_hash VARCHAR(255),
    phone_hash VARCHAR(255),
    face_embedding_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_global_persons_email_hash ON global_persons(email_hash);
CREATE INDEX idx_global_persons_phone_hash ON global_persons(phone_hash);

-- Entry events (ledger)
CREATE TABLE IF NOT EXISTS entry_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,  -- MongoDB reference
    event_id UUID NOT NULL,  -- MongoDB reference
    guest_id UUID NOT NULL,  -- MongoDB reference (venue_guest)
    global_person_id UUID REFERENCES global_persons(id),
    entry_type VARCHAR(50) NOT NULL,  -- vip, cover, cover_consumption, consumption_only
    cover_amount DECIMAL(10,2),
    cover_paid BOOLEAN DEFAULT FALSE,
    decision VARCHAR(20),  -- allowed, denied
    staff_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_entry_events_venue ON entry_events(venue_id);
CREATE INDEX idx_entry_events_event ON entry_events(event_id);
CREATE INDEX idx_entry_events_guest ON entry_events(guest_id);

-- TAP sessions (tabs)
CREATE TABLE IF NOT EXISTS tap_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    event_id UUID,
    nfc_card_id UUID,  -- MongoDB reference
    guest_id UUID,  -- MongoDB reference
    status VARCHAR(20) DEFAULT 'open',  -- open, closed, voided
    session_type VARCHAR(20) DEFAULT 'tap',  -- tap, table
    table_id UUID,  -- MongoDB reference
    opened_by_user_id UUID REFERENCES users(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by_user_id UUID REFERENCES users(id),
    closed_at TIMESTAMPTZ,
    subtotal DECIMAL(10,2) DEFAULT 0,
    adjustments_total DECIMAL(10,2) DEFAULT 0,
    tax_total DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_tap_sessions_venue ON tap_sessions(venue_id);
CREATE INDEX idx_tap_sessions_status ON tap_sessions(status);
CREATE INDEX idx_tap_sessions_card ON tap_sessions(nfc_card_id);

-- TAP items (ledger)
CREATE TABLE IF NOT EXISTS tap_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    tap_session_id UUID NOT NULL REFERENCES tap_sessions(id) ON DELETE CASCADE,
    catalog_item_id UUID NOT NULL,  -- MongoDB reference
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    line_total DECIMAL(10,2) NOT NULL,
    is_alcohol BOOLEAN DEFAULT FALSE,
    seat_number INTEGER,
    notes TEXT,
    modifiers JSONB DEFAULT '{}'::jsonb,
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    voided_at TIMESTAMPTZ,
    voided_by_user_id UUID REFERENCES users(id),
    void_reason TEXT
);

CREATE INDEX idx_tap_items_venue ON tap_items(venue_id);
CREATE INDEX idx_tap_items_session ON tap_items(tap_session_id);

-- TAP payments
CREATE TABLE IF NOT EXISTS tap_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    tap_session_id UUID NOT NULL REFERENCES tap_sessions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,  -- cash, card, comp, other
    external_ref VARCHAR(255),
    paid_by_user_id UUID REFERENCES users(id),
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tap_payments_venue ON tap_payments(venue_id);
CREATE INDEX idx_tap_payments_session ON tap_payments(tap_session_id);

-- Event wallet transactions (ledger)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    event_id UUID NOT NULL,
    wallet_id UUID NOT NULL,  -- MongoDB reference
    transaction_type VARCHAR(20) NOT NULL,  -- topup, debit, refund
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    description TEXT,
    staff_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_wallet_transactions_venue ON wallet_transactions(venue_id);
CREATE INDEX idx_wallet_transactions_event ON wallet_transactions(event_id);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);

-- Audit events (append-only)
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    company_id UUID,
    venue_id UUID,
    entity_type VARCHAR(50),
    entity_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_audit_events_user ON audit_events(user_id);
CREATE INDEX idx_audit_events_company ON audit_events(company_id);
CREATE INDEX idx_audit_events_venue ON audit_events(venue_id);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);
CREATE INDEX idx_audit_events_timestamp ON audit_events(timestamp DESC);

-- Venue tables (table management)
CREATE TABLE IF NOT EXISTS venue_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    zone VARCHAR(50) DEFAULT 'main',
    capacity INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'available',  -- available, occupied, reserved
    current_session_id UUID REFERENCES tap_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venue_tables_venue ON venue_tables(venue_id);
CREATE INDEX idx_venue_tables_status ON venue_tables(status);

-- KDS tickets
CREATE TABLE IF NOT EXISTS kds_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL,
    tap_session_id UUID REFERENCES tap_sessions(id) ON DELETE SET NULL,
    table_id UUID REFERENCES venue_tables(id) ON DELETE SET NULL,
    destination VARCHAR(20) NOT NULL DEFAULT 'kitchen',  -- kitchen, bar
    status VARCHAR(20) DEFAULT 'pending',  -- pending, preparing, ready, completed
    estimated_minutes INTEGER,
    created_by_user_id UUID REFERENCES users(id),
    started_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    meta JSONB DEFAULT '{}'
);

CREATE INDEX idx_kds_tickets_venue ON kds_tickets(venue_id);
CREATE INDEX idx_kds_tickets_status ON kds_tickets(status);
CREATE INDEX idx_kds_tickets_destination ON kds_tickets(destination);

-- KDS ticket items
CREATE TABLE IF NOT EXISTS kds_ticket_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES kds_tickets(id) ON DELETE CASCADE,
    tap_item_id UUID REFERENCES tap_items(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    modifiers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kds_ticket_items_ticket ON kds_ticket_items(ticket_id);
