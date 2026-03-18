# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards. The platform includes NFC wristband integration, real-time order management, SaaS checkout flow, and item customization.

## Architecture Decision
- **Lovable** = public experience (landing page, signup, login, checkout, user entry point)
- **Emergent** = protected SaaS app (internal dashboard, no public access)
- Unauthenticated users → redirect to Lovable login (REACT_APP_LOVABLE_LOGIN_URL)
- Auth backend stays in Emergent (JWT + RBAC)

## Core Requirements
1. **Authentication**: JWT with role-based access control (CEO, Owner, Manager, Staff)
2. **Venue Management**: Multi-venue support with module access per company
3. **Operational Screens**: Kitchen KDS, Tap (bar), Table (restaurant), Pulse (entry)
4. **Manager Dashboard**: Overview, Staff, Tables by Server, Menu, Shifts, Tips, Reports, Settings
5. **SaaS Checkout**: 2-step onboarding with Stripe integration (on Lovable side)
6. **Item Customization**: Modifier system for order items

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (config/catalog)
- **Payments**: Stripe via emergentintegrations
- **Real-time**: WebSocket for manager updates

## Design Direction
- Toast-like operational clarity
- Neutral palette (white/gray/black) on operational screens
- **Full-color category blocks** (amber for Beers, pink for Cocktails, etc.)
- Table cards: green (free), dark gray (busy) — no orange/red
- Bartender/Server selectors: neutral gray (not red)
- Tab cards with status indicators: green (normal), yellow (warning), red (issue)
- Global rule: Active screen always on top (z-index)

## Protected Users System
- File: `/app/backend/protected_users.py`
- Runs on every backend startup
- Guarantees: garcia.rapha2@gmail.com (CEO) and teste@teste.com (USER) ALWAYS exist
- Auto-recreates if missing, verifies if present

## Completed Features

### Architecture: Lovable/Emergent Separation
- Removed login/signup/landing pages from Emergent
- ProtectedRoute redirects to Lovable login
- API 401 interceptor redirects to Lovable
- Auth handoff route preserved for Lovable → Emergent flow

### Phase 1: Kitchen Order Cards (Toast KDS)
- 5-column kanban with timer display
- Improved card spacing (gap-6)

### Phase 2: Menu Grid (Touch-friendly POS)
- Category sidebar with full-color backgrounds
- Color-coded item tiles with category-matching backgrounds
- Fast-add click + pencil edit flow

### Phase 3: Item Modifiers & Notes
- ItemCustomizeModal component
- Remove/add ingredients, extras, notes

### Phase 4: Premium SaaS Checkout
- PricingPage + CheckoutSuccessPage (on Lovable side now)
- Stripe checkout integration

### UI/UX Refinement Pass (March 2026)
- Global z-index hierarchy (header:50, dropdown:9999, modal:9999)
- Tab cards with green/yellow/red status dots + manual status control
- Full-color category blocks (TAP + TABLE)
- Table cards: green=free, dark gray=busy (no orange/red)
- Bartender/Server selectors: neutral gray
- Age verification modal for alcohol items (TAP)
- ID verification modal z-index fix (TABLE)
- Empty category shows "Add Item" button
- Add new table UI with form validation
- Item details buttons always visible (not hover-only)
- Tips view in Manager panel
- Menu list/kanban toggle
- Settings with venue creation
- Tables by Server with WebSocket + polling real-time

## Upcoming Tasks
- Manager Panel refinement (next phase after user approval)
- Server History View
- PWA support
- Live Activity Feed
- Per-Event Dashboard
- KDS/Bar routing enhancements
- Push notifications
- Stripe Webhooks
- Offline-First capabilities

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Known Limitations
- PostgreSQL non-persistent in preview — protected users auto-recovered on startup
- Lovable integration URL is placeholder (https://spet.lovable.app/login)
