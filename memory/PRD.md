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

### Core Architecture
- Hybrid database setup (PostgreSQL + MongoDB)
- Full PostgreSQL schema (20+ tables including venue_tables, kds_tickets, kds_ticket_items)
- JWT-based authentication via PostgreSQL
- Tailwind CSS design system with token-based themes

### Venue Home - COMPLETE (2026-02-27)
- Login always redirects to `/venue/home`
- Shows active venue name + selector (if multiple venues)
- 7 module cards: Pulse, TAP, Table, Kitchen (KDS), Manager, Owner, CEO
- Cards respect entitlements + role (locked state with modal for no-access)
- All back/logout buttons across modules navigate to `/venue/home`
- Light/Dark theme toggle
- Backend: `/api/venue/home` endpoint with role-based module visibility

### Auth Module - COMPLETE
- Login/Signup via PostgreSQL
- Super admin user (teste@teste.com / 12345)
- Forgot Password link (placeholder)

### PULSE Module (C0-C3) - COMPLETE
- C0: NFC scan + Manual Entry
- C1: Guest Intake (Name, Email, Phone, DOB, Photo)
- C1.1: Deduplication (SHA-256 hashes in PG)
- C2: Decision Card (Risk/Value chips, Allow/Deny)
- C3: Success (Entry event logged, KPIs update)
- Inside Page: Grid of currently inside guests with Exit buttons
- Exit Page: Inside guests + Recent Exits panel
- Bar Page: Auto-redirect to /tap
- Rewards Page: Placeholder with lock icon
- Guest History: Event timeline per guest

### TAP Module (B0-B5) - COMPLETE
- B0: Config + Stats (open_tabs, running_total, closed_today, revenue_today)
- B1: Open/Close tabs, Add items, Payment (card/cash/comp)
- Catalog management via MongoDB
- All transactional data in PostgreSQL

### TABLE Module - COMPLETE (Tested 2026-02-27)
- 9 venue tables across 4 zones (Main, VIP, Patio, Bar)
- Open/Close tables with guest assignment
- Add items from catalog to table sessions
- Send items to KDS (food to kitchen, drinks to bar)
- Payment processing (card/cash/comp)
- Full integration with TAP sessions

### KDS Module - COMPLETE (Tested 2026-02-27)
- Kitchen/Bar destination routing based on is_alcohol flag
- 3-column Kanban: Pending/Preparing/Ready
- Ticket lifecycle: pending -> preparing -> ready -> completed
- Auto-refresh every 10s
- Estimated time setting
- Entitlement gating (kds:true permission required)

---

## Prioritized Backlog

### P1 - Next
- Manager/Owner/CEO Dashboards (data aggregation + visualization)

### P2
- Event Wallet module (cashless events)
- Loyalty add-on (points/rewards)

### P3
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
│   ├── routes/ (auth, billing, pulse, tap, table, kds, manager, owner, ceo)
│   ├── utils/ (auth.py, hashing.py)
│   ├── middleware/ (auth_middleware.py)
│   └── models/ (requests.py, responses.py)
└── frontend/
    ├── src/
    │   ├── index.css (Design tokens + @tailwind directives)
    │   ├── App.js (Router)
    │   ├── pages/ (Login, Modules, Pulse, Tap, Table, Kitchen, Manager, Owner, CEO)
    │   ├── components/ (PulseHeader, ProtectedRoute, ThemeToggle, ui/)
    │   ├── contexts/ (AuthContext, ThemeContext)
    │   └── services/ (api.js)
    └── tailwind.config.js (Token mapping)
```

## Test User
- Email: teste@teste.com
- Password: 12345
- Role: super_admin (all permissions enabled)
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Test Results
- iteration_5: 23/23 backend + all frontend (Table, KDS, TAP, Pulse regression) — 2026-02-27
- iteration_6: 10/10 backend + all frontend (Venue Home, navigation, redirects) — 2026-02-27
