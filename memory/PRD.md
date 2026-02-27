# SPETAP - Product Requirements Document

## Original Problem Statement
SPETAP is a multi-tenant SaaS platform for venue operations (clubs, restaurants, bars, events).

### Surfaces
- CEO Dashboard, Owner Dashboard, Manager Dashboard
- Staff Apps: Host (PULSE) + Bartender (TAP)

### Core Principles
- Strict multi-tenant data isolation by `venue_id`
- UI built for dark environments + queues + pressure
- Guest PII isolated per venue; global person uses hashed IDs only
- `session_id` is the canonical identifier (not `table_id`)

### Tech Stack
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python)
- **Databases:** PostgreSQL (transactional) + MongoDB (configs, catalog)
- **Auth:** JWT-based, PostgreSQL

---

## What's Been Implemented

### Venue Select (Post-Login) - COMPLETE
- Calendar view with event highlights, create events on-the-fly
- Login always redirects to `/venue/home`

### Navigation System - COMPLETE
- Module dropdown in header (SPETAP → Demo Club → modules)
- Pulse sub-tabs: Guest, Inside, Bar, Exit, Rewards
- Consistent header spacing with dividers (gap-4) across all pages

### PULSE Module (C0-C3) - COMPLETE
- C0: NFC scan + Manual Entry with camera fix
- C1: Guest Intake with photo capture
- C1.1: Deduplication
- C2: Decision Card with risk/value chips
- C3: Success + auto-reset

### Guest Profile - COMPLETE
- Click guest → `/pulse/guest/:id` with 4 tabs
- Block/Unblock wristband + red alert
- Open tab warning with amount

### Inside Page - COMPLETE
- Guests clickable → navigate to profile
- 3-column grid with photo, entry time, VIP badge
- Search functionality

### Bar/Bartender Page - COMPLETE
- NFC scan → identity confirmation (photo modal)
- Blocked wristband → full-screen RED BLOCKED screen
- Full catalog with category filters + custom drink addition
- Cart with quantities + reward points assignment
- Revenue display REMOVED per user request

### Exit Page - COMPLETE
- Open tab check → MODAL (red border, center screen) instead of toast
- Blocked wristband → MODAL warning
- All exits today with entry/exit times + duration

### TAP Module - COMPLETE
- DISCO MODE label + Table toggle switch
- Barman selector (must select before adding items)
- NFC scanner/search for guest lookup
- Custom item addition, void/remove items
- Revenue NOT shown in header (only Tabs count)
- Open/close tabs, pay with card/cash/comp

### TABLE Module - COMPLETE
- Table layout with zones (main, vip, patio, bar)
- Open/Close tables, add items via `/table/{id}/add-item`
- Void/remove items (ledger-safe with reason)
- Send to Kitchen/Bar (uses session_id as canonical)
- Back-to-TAP / DISCO MODE toggle in header
- Table management: Add/Edit/Delete tables

### KDS Module - COMPLETE
- Kitchen/Bar destination routing (alcohol → bar, food → kitchen)
- 3-column Kanban: Pending → Preparing → Ready
- Owners/managers always have KDS access
- Correct table numbers displayed on tickets

### Rewards System - COMPLETE
- Points config, 4 tiers (Bronze/Silver/Gold/Platinum)
- Configurable rewards catalog

### Block Wristband System - COMPLETE
- Block/Unblock from guest profile
- Full-screen BLOCKED screen at bar scan

---

## Prioritized Backlog

### P1 - Next
- Complete TAP/Bar feature requests: barman enforcement already done, revenue removed
- KDS/Bar Order Routing: food→kitchen, drinks→bar (DONE in backend)
- Manager Dashboard (cadastro de menu/catalog, barmen, venue settings) — blocked on user designs
- Owner Dashboard (multi-venue analytics) — blocked on user designs
- Staff Management: register barmen via Manager

### P2
- Restaurant vs Club mode
- Menu/catalog management (create/edit/delete via Manager)
- Event Wallet module (cashless events)
- Loyalty add-on enhancements (reward redemption flow)
- Tips system (proportional calculation by barman)

### P3
- Offline-first for staff apps
- Stripe webhook handlers for subscriptions
- CEO Dashboard

---

## Architecture
```
/app/
├── backend/
│   ├── server.py
│   ├── routes/ (auth, billing, pulse, tap, table, kds, venue, rewards, manager, owner, ceo)
│   ├── models/ (requests.py, responses.py)
│   ├── middleware/ (auth_middleware.py)
│   └── utils/ (auth.py, hashing.py)
└── frontend/
    ├── src/
    │   ├── pages/ (venue/, pulse/, TapPage, TablePage, KitchenPage, Manager, Owner, CEO)
    │   ├── components/ (PulseHeader, pulse/GuestIntakeForm, etc.)
    │   └── services/ (api.js)
    └── tailwind.config.js
```

## Test User
- Email: teste@teste.com | Password: 12345
- Role: owner | Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Test Results
- iteration_5: 23/23 (Table, KDS, TAP, Pulse)
- iteration_6: 10/10 (Venue Home, navigation)
- iteration_7: 15/15 (Venue Select, Bar, Exit, Rewards, Guest Profile)
- iteration_8: 16/16 (Block wristband, TAP features)
- iteration_9: 7/7 backend + 100% frontend (Critical P0 bug fixes: KDS send, void item, exit modal, header spacing) — 2026-02-27
