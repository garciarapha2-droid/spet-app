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
- Email: `teste@teste.com` / Password: `12345`
- Venue ID: `40a24e04-75b6-435d-bfff-ab0d469ce543`

---

## What's Been Implemented

### UI & Flow Alignments (Feb 27, 2026) ✅
1. **Kanban Menu System** — Horizontal category tabs at top (Beers, Cocktails, Spirits, Non-alcoholic, Snacks, Starters, Mains, Plates). Category title centered + bold. Items as clean rows (name, price, edit, delete). Consistent across BAR, TAP, and TABLE.
2. **Table Context** — Shows table number, Tab #, elapsed time, assigned server (editable). Server selector in header.
3. **KDS Drag & Drop + Buttons** — Cards movable by drag & drop between 5 columns. Action buttons (Start Preparing, Mark Ready, Delivered) kept. "Delayed" is a real backend status. Dismiss just closes popup.
4. **Custom Item with Photo** — Take Photo + Upload buttons. Creates in menu, NOT in tab. Available on BAR, TAP, TABLE.
5. **Tab # Everywhere** — Auto-created at guest entry. Visible in Entry, Inside, Bar, TAP, Table, Exit.
6. **Navigation** — Table→Tap, Tap→Bar, KDS→previous. Double-click event on home opens directly.
7. **Quantity + Trash** — Seletor + trash icon in all tab detail views.

### Earlier Implementation
- JWT auth, Venue Home with calendar, Pulse entry/inside/exit, barman CRUD, KDS 5-column Kanban, Demo data seeding, Catalog CRUD API with photo upload

---

## Backlog (Prioritized)

### P1 — PHASE 2: Manager Dashboard
- Overview (KPIs: Revenue Today/Week/Month, Avg Ticket, Unique Guests, Open Tabs)
- Charts (Revenue by hour, Top 10 items, Guest funnel)
- Alerts (Device offline, Excessive voids, Abnormal cancellations)
- Shifts & Operations (shift closing, cash reconciliation, audit trail, CSV/PDF export)
- Staff & Roles (RBAC, scheduling calendar with start/end time, affects TAP/Table server selection)
- Menu/Products/Pricing (modifiers, promotions, combos, photo upload)
- NFC & Guests (tag inventory, guest profile, visit history, segmentation)
- Loyalty & Rewards (points rules, anti-fraud, daily limits)
- Reports & Finance (sales by item/staff/hour, exceptions, export CSV/webhooks)
- Settings (venue profile, integrations, branding, policies)

### P1 — PHASE 3: Owner Dashboard
- Overview (Total Revenue Today/MTD/YTD, Estimated Profit, Growth %, ARPU, Retention)
- Performance by Venue (table with Health Status 🟢🟡🔴)
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
