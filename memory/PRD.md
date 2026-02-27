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

### P0: System Account Protection (Feb 27, 2026) ✅
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

### UI & Flow Alignments (Feb 27, 2026) ✅
1. **Kanban Menu System** — Horizontal category tabs across BAR, TAP, TABLE
2. **Table Context** — Shows table number, Tab #, elapsed time, assigned server
3. **KDS Drag & Drop + Buttons** — 5 columns with action buttons and delayed status
4. **Custom Item with Photo** — Create in menu with photo upload
5. **Tab # Everywhere** — Auto-created at guest entry, visible universally
6. **Navigation** — Contextual back-navigation
7. **Quantity + Trash** — In all tab detail views

### Earlier Implementation
- JWT auth, Venue Home with calendar, Pulse entry/inside/exit, barman CRUD, KDS 5-column Kanban, Demo data seeding, Catalog CRUD API with photo upload

---

## Backlog (Prioritized)

### P1 — PHASE 3: Owner Dashboard
- Owner Overview (Total Revenue Today/MTD/YTD, Estimated Profit, Growth %, ARPU, Retention)
- Performance by Venue (table with Health Status)
- AI Insights (rule-based: Situation→Impact→Suggestion, dismissable cards)
- Finance & Risk (chargebacks, refund rate, configurable thresholds)
- Growth & Loyalty (new vs returning, LTV, points)
- People & Ops (strategic signals, turnover, incidents)
- System & Expansion (uptime, webhook errors, new venues)

### P2 — Future
- KDS/Bar Order Routing (auto-split food→KDS, drinks→Bar)
- Tip-Splitting Logic
- Event Wallet Module (cashless)
- Stripe Webhooks
- Offline-First
- CEO Dashboard
