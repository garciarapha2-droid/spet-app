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
| TAP | Bar operations, tabs, checkout | ✅ Implemented |
| TABLE | Table management integrated with TAP | ✅ Implemented |
| KDS | Kitchen Display System (Kanban: Pending→Preparing→Ready→Delivered→Delayed) | ✅ Implemented |
| EVENT WALLET | Cashless event module | Backlog |
| LOYALTY | Points/rewards add-on | Backlog |
| RESTAURANT | KDS add-on | Backlog |

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configurations, guest PII)
- **Auth**: JWT-based (localStorage: `spetap_token`)
- **Currency**: USD ($)

## Multi-tenancy
- Strict data isolation by `venue_id`
- All API endpoints require `venue_id`

## Design System
- Stripe-like, desktop-first, full-width UI
- Dark/light theme toggle

## Key Credentials
- Email: `teste@teste.com` / Password: `12345`
- Venue ID: `40a24e04-75b6-435d-bfff-ab0d469ce543`
- Company ID: `c0000001-0000-0000-0000-000000000001`

---

## What's Been Implemented

### Phase 1: Demo Club Corrections (Feb 27, 2026) ✅
1. **Guest Module**: Name + Tab # in header, Birthday field always visible (optional)
2. **Inside Page**: Guest list with Tab #, status (Open/Blocked), VIP badges
3. **Bar Module**: Full demo menu (Cocktails, Beers, Spirits, Non-alcoholic) with USD prices
4. **Custom Item**: Creates item in catalog menu, NOT directly to tab
5. **Exit/Payment**: "Go to Checkout" + "Mark as Paid" buttons in exit modal
6. **TAP Page**: Kanban menu with 7 categories, barman management, tab numbers
7. **Table Mode**: 8 tables across 3 zones (main/vip/patio) with status indicators
8. **KDS**: 5-column Kanban (Pending, Preparing, Ready, Delivered, Delayed)
9. **Demo Data**: Comprehensive seed with guests, tabs, tables, KDS tickets
10. **Testing**: 100% pass rate (11 backend + 9 frontend tests)

### Previous Work
- JWT auth system with role-based access
- Venue Home with calendar + events + modules dropdown
- TAP module with Kanban menu, barman CRUD, unique tab numbers
- Table module with server selection
- Guest registration with dedupe, photo capture, risk/value signals
- Navigation between modules

---

## Backlog (Prioritized)

### P1 — Next
- **Manager Dashboard**: Overview (KPIs, Charts, Alerts), Staff & Roles (scheduling), Menu/Products (photo upload), Shifts & Operations, NFC & Guests, Reports, Loyalty, Settings
- **Owner Dashboard**: Overview (KPIs), Performance by Venue, AI Insights, Finance & Risk, Growth & Loyalty, People & Ops, System & Expansion
- **Item Photo Upload**: Camera capture / file upload for catalog items

### P2 — Upcoming
- Staff Management (full RBAC, scheduling, affects TAP/Table server selection)
- KDS/Bar Order Routing (auto-split food→KDS, drinks→Bar)
- Tip-Splitting Logic

### P3 — Future
- Event Wallet Module (cashless)
- Loyalty Add-on (points, rewards, anti-fraud)
- Stripe Webhooks for subscriptions
- Offline-First capabilities
- CEO Dashboard
