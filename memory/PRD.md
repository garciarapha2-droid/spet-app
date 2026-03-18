# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards. The platform includes NFC wristband integration, real-time order management, SaaS checkout flow, and item customization.

## Core Requirements
1. **Authentication**: JWT with role-based access control (CEO, Owner, Manager, Staff)
2. **Venue Management**: Multi-venue support with module access per company
3. **Operational Screens**: Kitchen KDS, Tap (bar), Table (restaurant), Pulse (entry)
4. **Manager Dashboard**: Overview, Staff, Tables by Server, Menu, Shifts, Tips, Reports, Settings
5. **SaaS Checkout**: 2-step onboarding with Stripe integration
6. **Item Customization**: Modifier system for order items (Phase 3)

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (config/catalog)
- **Payments**: Stripe via emergentintegrations
- **Real-time**: WebSocket for manager updates

## Design Direction
- Toast-like operational clarity
- Neutral palette (white/gray/black) on operational screens
- Color only for: categories, status, highlights
- Typography: item name → strong dark, price → bold dark, secondary → muted gray
- Global rule: Active screen always on top (z-index)

## Completed Features

### Phase 1: Kitchen Order Cards (Toast KDS)
- 5-column kanban: Pending, Preparing, Ready, Delivered, Delayed
- Timer display per ticket
- Kitchen/Bar toggle
- Improved card spacing (gap-6)

### Phase 2: Menu Grid (Touch-friendly POS)
- Category sidebar with icons
- Color-coded item tiles
- Fast-add click + pencil edit flow
- Custom item creation

### Phase 3: Item Modifiers & Notes
- ItemCustomizeModal component
- Remove/add ingredients, extras, notes
- Backend: modifiers JSONB column in tap_items & kds_ticket_items
- PUT /api/tap/session/{id}/item/{item_id}

### Phase 4: Premium SaaS Checkout
- PricingPage.js with 2-step onboarding
- Stripe checkout integration
- CheckoutSuccessPage.js

### Design Refinement Pass (Current Session - March 2026)
- Global z-index hierarchy (header:50, dropdown:9999, modal:60)
- Barman/Server dropdown layering fixed
- Tab cards redesigned (name, tab#, total - Pulse style)
- Item details buttons always visible (not hover-only)
- Table module: add new table UI with validation
- Table cards: improved spacing with seats/status
- Manager: Tips view with server detail table
- Manager: Menu list/kanban toggle
- Manager: Settings with venue creation
- Manager: Tables by Server with WebSocket + polling real-time
- Revenue chart: emerald (not purple)
- Sidebar tabs: neutral foreground (not purple)
- KDS: increased spacing between cards
- Venue module: z-index fix for modules dropdown

## Upcoming Tasks
- Phase 5: Server History View (manager dashboard)
- PWA support
- Live Activity Feed
- Per-Event Dashboard
- KDS/Bar routing enhancements
- Push notifications
- Stripe Webhooks for subscriptions
- Offline-First capabilities

## Key API Endpoints
- POST /api/auth/login
- GET /api/manager/tips-detail?venue_id=X
- GET /api/manager/tables-by-server?venue_id=X
- POST /api/venue/create-venue
- PUT /api/tap/session/{id}/item/{item_id}
- POST /api/onboarding/create-checkout-session

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Known Limitations
- PostgreSQL is non-persistent in preview environment — but protected users are auto-recovered on every startup via `protected_users.py`

## Protected Users System (CRITICAL)
- File: `/app/backend/protected_users.py`
- Runs on every backend startup via `server.py` → `startup_protection(pool)`
- Guarantees: garcia.rapha2@gmail.com (CEO) and teste@teste.com (USER) ALWAYS exist
- If users are missing → auto-recreates with correct roles and access
- If users exist → verifies system flags, does NOT overwrite
- Schema is auto-initialized via `init_postgres.sql` (CREATE TABLE IF NOT EXISTS)
- seed_demo.py NEVER deletes users, companies, or user_access tables
