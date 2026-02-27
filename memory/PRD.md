# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (clubs, bars, restaurants). Named **SPETAP**.

## Core Surfaces
- CEO Dashboard, Owner Dashboard, Manager Dashboard
- Staff Apps: Host (Pulse), Tap (Bar), Table, KDS (Kitchen)

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configurations, guest PII, catalog)
- **Auth**: JWT-based (localStorage: `spetap_token`)
- **Currency**: USD ($)
- **Multi-tenancy**: Strict data isolation by `venue_id`

## Key Credentials
- Email: `teste@teste.com` / Password: `12345` (PROTECTED SYSTEM ACCOUNT)
- Venue ID: `40a24e04-75b6-435d-bfff-ab0d469ce543`

---

## What's Been Implemented

### P0: System Account Protection ✅
- `DELETE /api/auth/users/{id}` returns 403 for `teste@teste.com`
- `ensure_system_account` in server.py recreates the account on every startup
- Seed script is idempotent for this user

### PHASE 2: Manager Dashboard (Feb 27, 2026) ✅
Complete implementation with 8 functional sections:
1. **Overview**: KPIs (Revenue Today/Week/Month, Avg Ticket, Unique Guests, Open Tabs, Voids), Revenue by Hour chart, Top 10 Items, Guest Funnel, Alerts
2. **Staff & Roles**: System users (RBAC), operational staff CRUD, scheduling calendar
3. **Menu / Products**: Full catalog management with search, category filters, add/edit/delete
4. **Shifts & Operations**: Shift closing with cash reconciliation, payment breakdown, audit trail
5. **NFC & Guests**: Guest list with search, detail panel (profile, entries, sessions)
6. **Reports & Finance**: Sales by item/hour/method, exceptions (voids), period selector, CSV export
7. **Loyalty & Rewards**: Enable/disable, points per dollar, daily limits, anti-fraud, tier system
8. **Settings**: Venue name, operating mode, currency, KDS toggle, integrations display

### PHASE 3: Owner Dashboard (Feb 27, 2026) ✅
Complete implementation with 7 functional sections:
1. **Overview**: Aggregated KPIs across all venues (Revenue Today/MTD/YTD, Growth %, Est. Profit, ARPU, Retention %, Guests Today, Open Tabs, Avg Ticket) + Venue cards with health status
2. **Performance by Venue**: Table with Health Status, Revenue, Tabs, Guests, Avg Ticket, Voids + Drill-down with Top Items
3. **AI Insights**: Rule-based analysis (Situation→Impact→Suggested Action) — Detects high void rate, long open tabs, revenue below average, KDS delays, missing entries. Dismissable cards sorted by priority.
4. **Finance & Risk**: Revenue MTD, Risk Score (0-100 based on void rate), Chargebacks, Payment Methods breakdown, Voids summary
5. **Growth & Loyalty**: New vs Returning guests, Guest Growth %, LTV, Guest Comparison bar, Loyalty members count, Total points issued
6. **People & Ops**: Total staff count, per-venue staff breakdown with recent shifts
7. **System & Expansion**: System status, Uptime, Venues count, Webhook status, Subscription info

### Bug Fixes (Feb 27, 2026) ✅
- **KDS Dismiss button**: Fixed popup re-appearing after dismiss by tracking dismissed ticket IDs in a Set

### UI & Flow Alignments (Earlier) ✅
- Kanban Menu System — Horizontal category tabs across BAR, TAP, TABLE
- Table Context — Shows table number, Tab #, elapsed time, assigned server
- KDS Drag & Drop + Buttons — 5 columns with action buttons and delayed status
- Custom Item with Photo — Create in menu with photo upload
- Tab # Everywhere — Auto-created at guest entry, visible universally

---

## Backlog (Prioritized)

### P2 — Future
- KDS/Bar Order Routing (auto-split food→KDS, drinks→Bar)
- Tip-Splitting Logic
- Event Wallet Module (cashless)
- Stripe Webhooks
- Offline-First
- CEO Dashboard
- Real-time notifications (push alerts for managers)
