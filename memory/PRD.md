# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (clubs, bars, restaurants). Named **SPETAP**.

## Core Surfaces
- CEO Dashboard
- Owner Dashboard  
- Manager Dashboard
- Staff Apps: Host (Pulse), Tap (Bar), Table, KDS (Kitchen)

## Core Modules
| Module | Description | Status |
|--------|-------------|--------|
| PULSE | Guest entry, identity verification, photo capture, risk/value signals | ✅ Implemented |
| TAP | Bar operations, tabs, checkout, list-based menu | ✅ Implemented |
| TABLE | Table management integrated with TAP | ✅ Implemented |
| KDS | Kitchen Display System (5-col Kanban with D&D: Pending→Preparing→Ready→Delivered→Delayed) | ✅ Implemented |
| EVENT WALLET | Cashless event module | Backlog |
| LOYALTY | Points/rewards add-on | Backlog |

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configurations, guest PII, catalog)
- **Auth**: JWT-based (localStorage: `spetap_token`)
- **Currency**: USD ($)
- **Multi-tenancy**: Strict data isolation by `venue_id`

## Key Credentials
- Email: `teste@teste.com` / Password: `12345`
- Venue ID: `40a24e04-75b6-435d-bfff-ab0d469ce543`

---

## What's Been Implemented

### UX & Operational Corrections (Feb 27, 2026) ✅
1. **Tab # at Registration**: Auto-created when guest entry is allowed. Visible EVERYWHERE.
2. **KDS Drag & Drop**: Cards movable between columns by dragging. 5 columns: Pending, Preparing, Ready, Delivered, Delayed.
3. **Menu as List**: Categories shown as clean rows. Items only after selecting category. Applies to TAP, Bar, Table.
4. **Edit/Delete Menu Items**: Edit (pencil) and Delete (trash) on every item, including demo data.
5. **Custom Item with Photo**: Form includes Take Photo (camera) and Upload buttons. Creates item in menu, NOT in tab.
6. **Trash in Tab**: Every item in active tab has trash icon to remove instantly.
7. **Back Navigation**: Table→Tap, Tap→Bar, KDS→previous screen.
8. **Venue Home**: Double-click event opens directly.
9. **Exit**: Tab # visible during exit validation.
10. **Catalog CRUD API**: PUT /api/tap/catalog/{id}, DELETE /api/tap/catalog/{id}, POST /api/tap/catalog/{id}/photo

### Phase 1: Demo Club Corrections (Feb 27, 2026) ✅
- Guest module with birthday, Bar demo menu, Table demo data, KDS 5 columns, Demo data seeded

### Earlier Work
- JWT auth, Venue Home with calendar, TAP Kanban menu, barman CRUD, Table with server selection, Guest registration with dedupe

---

## Backlog (Prioritized)

### P1 — Next (PHASE 2)
- **Manager Dashboard**: 
  - Overview (KPIs: Revenue, Avg Ticket, Open Tabs, Unique Guests)
  - Charts (Revenue by hour, Top 10 items, Funnel)
  - Alerts (Device offline, Excessive voids, Duplicated NFC)
  - Shifts & Operations (shift closing, cash reconciliation, audit trail)
  - Staff & Roles (scheduling with calendar, RBAC, devices)
  - Menu/Products/Pricing (modifiers, promotions, combos)
  - NFC & Guests (inventory, guest profile, segmentation)
  - Loyalty & Rewards (points rules, anti-fraud)
  - Reports & Finance (sales by item/staff/hour, export CSV)
  - Settings (venue profile, integrations, branding, policies)

### P1 — Next (PHASE 3)
- **Owner Dashboard**:
  - Overview (Total Revenue: Today/MTD/YTD, Estimated Profit, Growth %, ARPU)
  - Performance by Venue (table/cards with Health Status)
  - AI Insights (rule-based: Situation→Impact→Suggestion)
  - Finance & Risk (chargebacks, refund rate, thresholds)
  - Growth & Loyalty (new vs returning, LTV, points)
  - People & Ops (strategic signals only)
  - System & Expansion

### P2 — Upcoming
- KDS/Bar Order Routing (auto-split food→KDS, drinks→Bar)
- Tip-Splitting Logic
- CEO Dashboard

### P3 — Future
- Event Wallet Module (cashless)
- Stripe Webhooks for subscriptions
- Offline-First capabilities
