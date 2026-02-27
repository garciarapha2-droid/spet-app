# SPETAP - Product Requirements Document

## Original Problem Statement
SPETAP is a multi-tenant SaaS platform for venue operations (clubs, restaurants, bars, events).

### Surfaces
- CEO Dashboard, Owner Dashboard, Manager Dashboard
- Staff Apps: Host (PULSE) + Bartender (TAP)

### Core Principles
- Strict multi-tenant data isolation by `venue_id`
- Global person record uses hashed identifiers only
- Venue-specific guest PII remains isolated

### Product Modes
- **PULSE (Entry & Identity):** Club/Restaurant Host modes, guest registration, photo capture, risk/value signals
- **TAP (Consumption/Bar):** Bar modes, tabs, checkout, Table Mode
- **EVENT WALLET:** Cashless event module

### Paid Add-ons
- **LOYALTY:** Points and rewards
- **RESTAURANT (KDS):** Kitchen Display System

### Tech Stack
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python)
- **Databases:** PostgreSQL (transactional SOT) + MongoDB (configs, logs, read models)
- **Billing:** Stripe (test mode)
- **Auth:** JWT-based

### Design System
- Stripe-like light-first aesthetic
- Inter font
- Purple primary color tokens (HSL 253)
- Token-based light/dark themes via CSS variables

---

## What's Been Implemented

### Session 1 (2026-02-27)
- Project scaffolding (React frontend + FastAPI backend)
- Hybrid database setup (PostgreSQL + MongoDB)
- Full PostgreSQL schema (14+ tables: users, companies, user_access, subscriptions, entitlements, etc.)
- JWT-based authentication (currently via MongoDB)
- Frontend design system tokens in index.css
- Routing structure with placeholder pages
- Initial PulseEntry (C0) page

### Session 2 (2026-02-27) - Current
- **FIXED: Tailwind CSS completely broken** — Added missing `@tailwind base/components/utilities` directives to index.css
- **FIXED: Light mode tokens had dark values** — Corrected --border, --input, --muted, --secondary for light mode
- **FIXED: Backend crashing** — Installed PostgreSQL, created spetap database/user, applied full schema
- **FIXED: Owner redirect route mismatch** — /owner/dashboard → /owner
- Added @layer base wrapping for Shadcn compatibility
- Added destructive color tokens (were missing)
- All tests passing (10/10 backend, all frontend features verified)

### Session 2b (2026-02-27) - Auth Migration
- **COMPLETED: Auth migrated MongoDB → PostgreSQL** — login, signup, /me all via asyncpg
- Test user seeded in PostgreSQL (teste@teste.com / 12345, role=super_admin, ALL permissions, company=Demo Club)

### Session 2c (2026-02-27) - PULSE C1→C3
- **COMPLETED: C1 Guest Intake** — Name, Email, Phone, DOB (conditional HOST_COLLECT_DOB), Photo (camera/upload)
- **COMPLETED: C1.1 Dedupe** — SHA-256 hashes in PG global_persons, venue isolation, masked data UI (m***@test.com)
- **COMPLETED: C2 Decision Card** — Risk chips (blocked, flagged, unpaid), Value chips (VIP, big_spender, regular, loyal), Allow/Deny
- **COMPLETED: C3 Success** — Entry event logged in PG entry_events, KPIs update in real-time, "Next Guest" reset
- **Data Architecture**: PII → MongoDB venue_guests (venue-isolated), Hashes → PG global_persons, Decisions → PG entry_events
- **Testing: 100% pass** — 20/20 backend tests, all frontend C1-C3 flows verified

### Session 2d (2026-02-27) - TAP B0+B1 + Test User + Login UX
- **COMPLETED: Test user updated** — Password changed to `12345`, role=super_admin, ALL entitlements enabled
- **COMPLETED: Forgot Password link** — Added `Forgot my password?` below login button (placeholder)
- **COMPLETED: TAP B0** — Config (Disco/Restaurant/Event modes), Stats (open_tabs, running_total, closed_today, revenue_today), 12-item Catalog
- **COMPLETED: TAP B1** — Open tab (PG tap_sessions), Add items (PG tap_items, catalog from MongoDB), Close tab (PG tap_payments), 3-column layout
- **Data Architecture**: Sessions/Items/Payments → PostgreSQL, Catalog → MongoDB
- **Testing: 100% pass** — 27/27 backend tests, all frontend flows verified

---

## Prioritized Backlog

### P1 (Next)
- Implement Table & KDS Modules with feature-gating
- Implement TAP B2-B5: Advanced features (void items, table mode, shift summary)

### P2
- Manager, Owner, CEO Dashboards with aggregated data
- Event Wallet module
- Loyalty add-on module
- Stripe webhook handlers for subscription lifecycle
- Offline-first for staff apps (Host, Tap)

---

## Architecture

```
/app/
├── backend/
│   ├── server.py (FastAPI entry, CORS, routes)
│   ├── database.py (MongoDB + PostgreSQL connections)
│   ├── config.py (Settings from .env)
│   ├── init_postgres.sql (Full PG schema)
│   ├── routes/ (auth, billing, pulse, tap, manager, owner, ceo)
│   ├── utils/ (auth.py, hashing.py)
│   ├── middleware/ (auth_middleware.py)
│   └── models/ (requests.py, responses.py)
└── frontend/
    ├── src/
    │   ├── index.css (Design tokens + @tailwind directives)
    │   ├── App.js (Router)
    │   ├── pages/ (Login, Modules, Pulse, Tap, Manager, Owner, CEO)
    │   ├── components/ (PulseHeader, ProtectedRoute, ThemeToggle, ui/)
    │   ├── contexts/ (AuthContext, ThemeContext)
    │   └── services/ (api.js)
    └── tailwind.config.js (Token mapping)
```

## Test User
- Email: teste@teste.com
- Password: teste123
- Role: owner (via MongoDB user_access)
