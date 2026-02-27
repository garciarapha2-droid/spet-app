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

---

## Prioritized Backlog

### P0 (Next)
- Migrate authentication from MongoDB to PostgreSQL (per architecture requirement)

### P1
- Implement Pulse Module (Club Host C0-C3): guest intake flow, deduplication, risk/value chips
- Implement TAP Module (Bar Mode B0-B5): 3 operational modes
- Implement Table & KDS Modules with feature-gating

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
