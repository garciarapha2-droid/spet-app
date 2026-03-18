# SPET — Product Requirements Document

## Original Problem Statement
Build a premium restaurant POS/operational platform ("SPET") with:
- Real-time Kitchen Display System (KDS)
- Touch-friendly POS for Tap (bar) and Table service
- Guest management (Pulse module)
- Manager & CEO dashboards with role-based access
- SaaS onboarding with Stripe checkout
- Item modifiers & customization system
- Dark theme design system with precise brand tokens

## User Personas
- **CEO**: Full platform access, company-level analytics, user management
- **Manager**: Venue operations, staff management, revenue dashboards
- **Staff (USER)**: POS operations (Tap, Table, Kitchen)

## Core Modules
1. **Pulse** — Guest entry/exit, inside tracking, rewards
2. **Tap** — Bar POS with tab management, NFC scan
3. **Table** — Table service POS with server assignment
4. **Kitchen** — KDS with kanban workflow, timers, delayed order alerts
5. **Manager** — Revenue dashboards, staff management
6. **Owner** — Venue configuration, billing
7. **CEO** — Multi-company analytics (restricted access)
8. **Pricing/Checkout** — Public landing page, lead capture, Stripe payment

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Lucide icons
- **Backend**: FastAPI, PostgreSQL (auth + orders), MongoDB (catalog + operations)
- **Payments**: Stripe via emergentintegrations
- **Auth**: JWT with RBAC (CEO, USER roles)
- **Deployment**: Supervisor-managed, Kubernetes

## Design System
- Dark theme by default with exact HSL tokens in index.css
- SpetLogo component (CSS-based, theme-aware)
- Inter font family
- Primary color: purple/violet accent

## What's Been Implemented

### RBAC System ✅
- CEO and USER roles with backend enforcement
- Permanent system accounts (undeletable)
- Frontend route protection (CEORoute)

### Design System ✅
- 15 dark mode CSS tokens matched exactly
- SpetLogo component across all pages
- Typography hierarchy with Inter font

### Phase 1: Kitchen Order Cards (Toast-style) ✅
- 5-column kanban: Pending, Preparing, Ready, Delivered, Delayed
- Toast KDS card structure: order #, guest, timer, type, status badge
- Item list with quantities and modifiers display
- Drag-and-drop between columns
- ETA modal for preparation time
- Delayed order popup alerts
- Kitchen/Bar toggle

### Phase 2: Menu Grid (POS-style) ✅
- Vertical category sidebar with icons (8 categories)
- Large touch-friendly item tile grid (4 columns)
- Fixed left panel (tabs/table map)
- Fixed right panel (order summary)
- Both TapPage and TablePage share same POS pattern

### Phase 3: Item Modifiers & Notes ✅
- **ItemCustomizeModal** component with ingredient toggles, extras, notes
- Click on item = fast add (unchanged)
- Pencil icon on order items opens customization modal
- Ingredients loaded from catalog (default_ingredients field)
- Modifiers stored as JSONB: {removed: [...], extras: [...]}
- Notes stored in text field
- **Backend**: PUT /api/tap/session/{id}/item/{id} updates modifiers
- **Backend**: GET /api/tap/catalog/{id} returns default_ingredients
- **KDS reflection**: Kitchen cards show "No X" (red) and "Extra X" (green)
- Backward-compatible — no existing flows broken

### Checkout Flow (2-step) ✅
- Public pricing page at /pricing with hero, features, plans
- 3 plans: Starter ($79), Growth ($149), Enterprise ($299)
- 2-step modal: Lead capture (name, email, phone) → Stripe redirect
- Backend lead storage + Stripe checkout session creation
- Success page with payment status polling

## Pending (On Hold)
- **Phase 4**: Server History View — awaiting user review

## Backlog / Future
- PWA support
- Live Activity Feed
- Per-Event Dashboard
- Module access control per company (SaaS)
- KDS / Bar Order Routing enhancements
- Push notifications
- Stripe Webhooks for subscriptions
- Offline-First
- Event Wallet / Native app

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- USER: teste@teste.com / 12345

## Key Files
- `frontend/src/components/ItemCustomizeModal.js` — Customization modal
- `frontend/src/pages/KitchenPage.js` — KDS kanban
- `frontend/src/pages/TapPage.js` — Bar POS
- `frontend/src/pages/TablePage.js` — Table POS
- `frontend/src/pages/PricingPage.js` — Landing + checkout
- `frontend/src/pages/CheckoutSuccessPage.js` — Post-payment
- `backend/routes/tap.py` — Tap API (modifiers, items, sessions)
- `backend/routes/kds.py` — KDS tickets with modifiers
- `backend/routes/onboarding.py` — Plans, leads, Stripe checkout
- `frontend/src/index.css` — Design tokens (source of truth)

## Database Schema Changes
- `tap_items`: Added `modifiers JSONB DEFAULT '{}'`
- `kds_ticket_items`: Added `modifiers JSONB DEFAULT '{}'`
- MongoDB `venue_catalog`: Added `default_ingredients` array field

## Environment Notes
- PostgreSQL is NON-PERSISTENT in preview — needs re-seeding on restart
- Seed sequence: start postgres, start mongo, run init_postgres.sql, run seed_demo.py, run seed_ingredients.py
