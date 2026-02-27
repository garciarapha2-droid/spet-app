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
- UI built for dark environments + queues + pressure

### Product Modes
- **PULSE (Entry & Identity):** Club/Restaurant Host modes, guest registration, photo capture, risk/value signals
- **TAP (Consumption/Bar):** Bar modes, tabs, checkout, Table Mode
- **EVENT WALLET:** Cashless event module (planned)

### Paid Add-ons
- **LOYALTY:** Points and rewards (IMPLEMENTED)
- **RESTAURANT (KDS):** Kitchen Display System (IMPLEMENTED)

### Tech Stack
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python)
- **Databases:** PostgreSQL (transactional SOT) + MongoDB (configs, logs, read models, catalog)
- **Billing:** Stripe (test mode, setup only)
- **Auth:** JWT-based, PostgreSQL users table

---

## What's Been Implemented

### Core Architecture - COMPLETE
- Hybrid database (PostgreSQL + MongoDB)
- Full PostgreSQL schema with 20+ tables
- JWT-based auth via PostgreSQL
- Tailwind CSS design system with CSS variable tokens

### Venue Select (Post-Login) - COMPLETE (2026-02-27)
- Login always redirects to `/venue/home`
- Calendar view showing current month with event highlights
- Create events on-the-fly or pre-scheduled
- Venue selector (for multi-venue users)
- "Enter Venue" button → navigates to module

### Navigation System - COMPLETE (2026-02-27)
- Module dropdown in header (click venue name → shows all modules)
- Pulse sub-tabs: Guest, Inside, Bar, Exit, Rewards
- Module access respects roles + permissions
- Venue Home accessible from any page

### Auth Module - COMPLETE
- Login/Signup via PostgreSQL
- Super admin user (teste@teste.com / 12345)
- Forgot Password link (placeholder)

### PULSE Module (C0-C3) - COMPLETE
- C0: NFC scan + Manual Entry
- C1: Guest Intake (Name, Email, Phone, DOB, Photo)
- C1.1: Deduplication (SHA-256 hashes)
- C2: Decision Card (Risk/Value chips, Allow/Deny)
- C3: Success + auto-reset

### Guest Profile - COMPLETE (2026-02-27)
- Click guest in "Guests Today" → full profile page `/pulse/guest/:id`
- Tabs: History, Consumptions, Events, Rewards
- Entry/exit history with timestamps
- Spending breakdown with item-level detail
- Events attended at venue
- Reward points + tier status

### Bar/Bartender Page - COMPLETE (2026-02-27)
- NFC scanner → photo identity confirmation modal
- Full catalog with category filters (Beer, Cocktails, Food, Non-Alcohol, Spirits)
- Custom drink/item addition (name + price + category)
- Cart with quantity management
- Reward points assignment at checkout
- Open tabs sidebar

### Exit Page - COMPLETE (2026-02-27)
- Inside guests list with exit buttons
- All exits today panel with entry/exit times + duration
- Search functionality

### Rewards System - COMPLETE (2026-02-27)
- Points configuration (points per R$ spent)
- 4-tier system: Bronze, Silver, Gold, Platinum
- Configurable tier names, min points, colors, perks
- Available rewards catalog with point costs
- Edit configuration mode
- Points assignment from bar page
- Guest rewards tab in profile

### TAP Module (B0-B5) - COMPLETE
- Catalog, Sessions, Items, Payments
- Custom items support
- Active sessions listing

### TABLE Module - COMPLETE
- 9 venue tables across 4 zones
- Open/Close tables, add items, send to KDS

### KDS Module - COMPLETE
- Kitchen/Bar destination routing
- 3-column Kanban: Pending/Preparing/Ready
- Ticket lifecycle management

---

## Prioritized Backlog

### P1 - Next
- Manager/Owner/CEO Dashboards (data aggregation + visualization)

### P2
- Event Wallet module (cashless events)
- Offline-first for staff apps

### P3
- Stripe webhook handlers for subscription lifecycle
- Restaurant Host mode

---

## Architecture
```
/app/
├── backend/
│   ├── server.py (FastAPI entry, CORS, routes)
│   ├── database.py (MongoDB + PostgreSQL connections)
│   ├── routes/ (auth, billing, pulse, tap, table, kds, venue, rewards, manager, owner, ceo)
│   ├── utils/ (auth.py, hashing.py)
│   └── middleware/ (auth_middleware.py)
└── frontend/
    ├── src/
    │   ├── App.js (Router with 15+ routes)
    │   ├── pages/
    │   │   ├── venue/ (VenueHomePage - select page)
    │   │   ├── pulse/ (Entry, Inside, Bar, Exit, Rewards, GuestProfile)
    │   │   ├── TapPage, TablePage, KitchenPage
    │   │   └── ManagerPage, OwnerPage, CEOPage
    │   ├── components/ (PulseHeader with module dropdown, ProtectedRoute, ThemeToggle)
    │   └── services/ (api.js)
    └── tailwind.config.js
```

## Test User
- Email: teste@teste.com | Password: 12345
- Role: super_admin | Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Test Results
- iteration_5: 23/23 (Table, KDS, TAP, Pulse)
- iteration_6: 10/10 (Venue Home, navigation)
- iteration_7: 15/15 (Venue Select, Bar, Exit, Rewards, Guest Profile, Events) — 2026-02-27
