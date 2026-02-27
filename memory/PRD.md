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
- Void operations are ledger-safe (mark voided, never delete)

### Tech Stack
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python)
- **Databases:** PostgreSQL (transactional) + MongoDB (configs, catalog, barmen)
- **Auth:** JWT-based, PostgreSQL

---

## What's Been Implemented

### Venue Select (Post-Login) - COMPLETE
- Calendar view with event highlights, create events on-the-fly
- Login always redirects to `/venue/home`
- **Module cards** below calendar: Pulse, TAP, Table, Kitchen (KDS), Manager, Owner
- Owners (role_level >= 70) have access to all operational modules

### Navigation System - COMPLETE
- Module dropdown in header (SPETAP → Demo Club → modules)
- Pulse sub-tabs: Guest, Inside, Bar, Exit, Rewards
- **Consistent header spacing** with `gap-4` + dividers across ALL pages
- **ThemeToggle fixed** - removed `fixed` positioning, now in flex flow

### PULSE Module (C0-C3) - COMPLETE
- C0: NFC scan + Manual Entry with camera
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
- Custom item addition, void/remove items (ledger-safe)
- Revenue NOT shown in header (only Tabs count)
- Open/close tabs, pay with card/cash/comp

### TABLE Module - COMPLETE
- Table layout with zones (main, vip, patio, bar)
- Open/Close tables, add items via `/table/{id}/add-item`
- Void/remove items (ledger-safe with reason + voided_by_user_id)
- Send to Kitchen/Bar (uses session_id as canonical)
- **Back-to-TAP / DISCO MODE toggle** in header
- Table management: Add/Edit/Delete tables
- Guest name displayed on occupied tables (`session_guest`)

### KDS Module - COMPLETE
- Kitchen/Bar destination routing (alcohol → bar, food → kitchen)
- 3-column Kanban: Pending → Preparing → Ready
- Owners/managers always have KDS access (role_level check)
- Correct table numbers displayed on tickets
- Kitchen/Bar filter toggle in header

### Rewards System - COMPLETE
- Points config, 4 tiers (Bronze/Silver/Gold/Platinum)
- Configurable rewards catalog

### Block Wristband System - COMPLETE
- Block/Unblock from guest profile
- Full-screen BLOCKED screen at bar scan

---

## Prioritized Backlog

### P1 - Next
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
│   ├── routes/ (auth, billing, pulse, tap, table, kds, venue, rewards)
│   ├── models/ (requests.py, responses.py)
│   ├── middleware/ (auth_middleware.py)
│   └── init_postgres.sql
└── frontend/
    ├── src/
    │   ├── pages/ (venue/, pulse/, TapPage, TablePage, KitchenPage)
    │   ├── components/ (PulseHeader, ThemeToggle, ui/)
    │   └── services/ (api.js)
    └── tailwind.config.js
```

## Test User
- Email: teste@teste.com | Password: 12345
- Role: owner | Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Test Results
- iteration_9: 7/7 backend + 100% frontend (P0 bug fixes, header, modules, demo data) — 2026-02-27
