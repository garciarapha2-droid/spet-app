# SPETAP - Product Requirements Document

## Original Problem Statement
SPETAP is a multi-tenant SaaS platform for venue operations (clubs, restaurants, bars, events).

### Surfaces
- CEO Dashboard, Owner Dashboard, Manager Dashboard
- Staff Apps: Host (PULSE) + Bartender (TAP)

### Core Principles
- Strict multi-tenant data isolation by `venue_id`
- `session_id` is the canonical identifier (not `table_id`)
- Void operations are ledger-safe (mark voided, never delete)
- KDS Kanban always visible with 4 columns even when empty

### Tech Stack
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python)
- **Databases:** PostgreSQL (transactional) + MongoDB (configs, catalog, barmen)
- **Auth:** JWT-based, PostgreSQL

---

## What's Been Implemented

### Venue Home - COMPLETE
- Calendar view with events, login redirects to `/venue/home`
- **Modules dropdown in header** (not cards): Pulse, TAP, Table, Kitchen, Manager, Owner
- CEO hidden from module list (access by specific email only)
- Owners (role_level >= 70) see all operational modules

### Navigation & Headers - COMPLETE
- Module dropdown in PulseHeader
- **Consistent gap-4 + dividers** across ALL pages (fixed ThemeToggle `fixed` positioning)
- Back-to-TAP / DISCO MODE toggle on Table page

### PULSE Module (C0-C3) - COMPLETE
- NFC scan + Manual Entry, Guest Intake with photo, Deduplication, Decision Card, Success

### Guest Profile - COMPLETE
- Block/Unblock wristband + red alert, Open tab warning

### Inside Page - COMPLETE
- Clickable guests → profile, search, 3-column grid

### Bar/Bartender Page - COMPLETE
- NFC scan, blocked wristband screen, catalog + custom drinks, cart, revenue REMOVED

### Exit Page - COMPLETE
- Open tab / blocked wristband → RED MODAL (center screen), exit history

### TAP Module - COMPLETE
- DISCO MODE + Table toggle
- **Barman Management**: CRUD from dropdown (add/edit pencil/delete trash)
- Must select barman before adding items
- Custom item addition, void/remove items (ledger-safe with reason)
- Revenue NOT shown

### TABLE Module - COMPLETE
- Table layout with zones, open/close, add items via `/table/{id}/add-item`
- **Server/Waiter selection** when opening table (dropdown from barmen list)
- Void items, Send to KDS, DISCO MODE toggle, table CRUD

### KDS Module - COMPLETE
- **4-Column Kanban**: Pending → Preparing → Ready → **Delayed**
- All columns visible even when empty
- **Live timers**: countdown when preparing ("28:55 left"), count-up when delayed ("+0:05 over!")
- **Delayed order popup**: Full-screen modal with "ORDER DELAYED", details, "Mark Ready" / "Dismiss"
- **"X delayed" badge** in header when orders are overdue
- Kitchen/Bar toggle (food→kitchen, drinks→bar)
- Chef sets estimated time when starting preparation
- Owners/managers always have KDS access

### Barman/Staff System - COMPLETE
- CRUD API: GET/POST/PUT/DELETE `/api/staff/barmen`
- Soft-delete (active=false), venue-scoped
- Used in TAP dropdown and Table server selector

### Rewards System - COMPLETE
- Points config, 4 tiers, configurable rewards catalog

### Block Wristband System - COMPLETE
- Block/Unblock from guest profile, full-screen BLOCKED screen at bar

---

## Prioritized Backlog

### P1 - Next
- Manager Dashboard (menu/catalog management, barmen, venue settings) — blocked on user designs
- Owner Dashboard (multi-venue analytics) — blocked on user designs

### P2
- Event Wallet module (cashless events)
- Loyalty add-on enhancements (reward redemption)
- Tips system (proportional by barman)
- Restaurant vs Club mode

### P3
- Offline-first for staff apps
- Stripe webhook handlers
- CEO Dashboard

---

## Architecture
```
/app/backend/
  server.py, database.py, config.py
  routes/ (auth, billing, pulse, tap, table, kds, venue, rewards, barmen, manager, owner, ceo)
  models/ (requests.py, responses.py)
  middleware/ (auth_middleware.py)
  init_postgres.sql

/app/frontend/src/
  pages/ (venue/, pulse/, TapPage, TablePage, KitchenPage)
  components/ (PulseHeader, ThemeToggle, ui/)
  services/ (api.js)
```

## Test User
- Email: teste@teste.com | Password: 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Test Results
- iteration_9: 7/7 backend + 100% frontend (P0 bugs, modules, demo data)
- iteration_10: 11/11 backend + 100% frontend (Barman CRUD, Table server, Modules dropdown, KDS 4-column Kanban)
