# SPETAP - Database Architecture (Corrected)

## Database Responsibilities

### PostgreSQL (Source of Truth for Financial & Critical Data)
**Purpose**: ACID-compliant transactions, billing integrity, audit trail

**Tables**:
- `users` - User accounts
- `companies` - Top-level tenants
- `user_access` - RBAC with company/venue scope
- `subscriptions` - Stripe subscription lifecycle
- `entitlements` - Feature gating (pulse, tap, restaurant, loyalty, event_wallet)
- `invoice_events` - Stripe webhook audit log (idempotency via stripe_event_id)
- `payment_transactions` - Checkout tracking
- `global_persons` - Dedupe hashes (email_hash, phone_hash, face_embedding_hash)
- `entry_events` - Guest entry ledger
- `tap_sessions` - Tab/session ledger
- `tap_items` - Item consumption ledger
- `tap_payments` - Payment ledger
- `wallet_transactions` - Event wallet transaction ledger
- `audit_events` - System-wide audit log

**Why Postgres?**:
- Transactional integrity for payments
- Foreign key constraints for data integrity
- ACID properties for billing state
- Strong consistency for subscriptions
- Point-in-time recovery for financial data

### MongoDB (Configuration & Read Models)
**Purpose**: Flexible schemas, fast reads, denormalized views

**Collections**:
- `venues` - Venue configuration
- `spaces` - Physical spaces within venues
- `events` - Event configuration
- `venue_guests` - Guest PII (venue-scoped, never cross-venue)
- `nfc_cards` - NFC card inventory
- `catalog_items` - Menu/product catalog
- `catalog_categories` - Category organization
- `kds_stations` - Kitchen display stations
- `kds_tickets` - Kitchen tickets (operational, not financial)
- `kds_ticket_items` - Ticket item details
- `tables` - Table configuration
- `event_wallets` - Wallet configuration
- Staff configuration, device management, read models

**Why MongoDB?**:
- Flexible schemas for venue configs
- Fast reads for operational data
- Easy denormalization for dashboards
- Good for logs and audit trails (non-financial)

## Data Flow Examples

### Billing Flow (Postgres Only)
1. User signs up → `users` table
2. Company created → `companies` table
3. Stripe checkout → `payment_transactions` table
4. Webhook received → `invoice_events` table (idempotent via stripe_event_id)
5. Subscription activated → `subscriptions` table
6. Entitlements granted → `entitlements` table

### Guest Entry Flow (Hybrid)
1. Guest scanned → Query `venue_guests` (MongoDB) for PII
2. Dedupe check → Query `global_persons` (Postgres) by email_hash/phone_hash
3. Entry recorded → Insert into `entry_events` (Postgres ledger)
4. Guest updated → Update `venue_guests` (MongoDB) with new visit

### TAP/Consumption Flow (Hybrid)
1. Tab opened → Insert `tap_sessions` (Postgres)
2. Menu fetched → Query `catalog_items` (MongoDB)
3. Item added → Insert `tap_items` (Postgres ledger)
4. Payment → Insert `tap_payments` (Postgres)
5. Session closed → Update `tap_sessions` (Postgres)

### Owner Dashboard (Read from Both)
1. Financial KPIs → Postgres (`tap_sessions`, `tap_payments`, `subscriptions`)
2. Venue performance → MongoDB (`venues`, denormalized read models)
3. Insights → Computed from both sources

## Migration Strategy
- Start: Both databases running
- Postgres: Initialize schema via init_postgres.sql
- MongoDB: Keep existing collections
- Backend: Use asyncpg for Postgres, motor for MongoDB
- Queries: Route based on data type (financial → Postgres, config → MongoDB)

## Connection Strings
```
POSTGRES_URL=postgresql://spetap_user:spetap_password@localhost:5432/spetap
MONGO_URL=mongodb://localhost:27017
DB_NAME=spetap_db
```

## Current Status
✅ PostgreSQL installed and running
✅ Database 'spetap' created
✅ Schema initialized (all tables created)
✅ Both connection pools configured
✅ Backend connecting to both databases
✅ Design tokens correctly implemented (LOCKED, no changes)
