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
- Module dropdown in header (SPETAP → Demo Club ▼ → modules)
- Pulse sub-tabs: Guest, Inside, Bar, Exit, Rewards
- Logout button properly spaced from theme toggle

### PULSE Module (C0-C3) - COMPLETE
- C0: NFC scan + Manual Entry with camera fix
- C1: Guest Intake with photo capture (camera readyState check)
- C1.1: Deduplication
- C2: Decision Card with risk/value chips
- C3: Success + auto-reset

### Guest Profile - COMPLETE
- Click guest → `/pulse/guest/:id` with 4 tabs (History, Consumptions, Events, Rewards)
- Block/Unblock wristband button + red alert banner
- Open tab warning with amount
- Stats: entries, exits, total spent, reward tier

### Inside Page - COMPLETE
- Guests are clickable → navigate to profile
- 3-column grid with photo, entry time, VIP badge, exit button
- Search functionality

### Bar/Bartender Page - COMPLETE
- NFC scan → identity confirmation (photo modal)
- Blocked wristband → full-screen RED BLOCKED screen
- Full catalog with category filters + custom drink addition
- Cart with quantities + reward points assignment
- Revenue total displayed

### Exit Page - COMPLETE
- Open tab check before exit (toast warning with amount)
- All exits today with entry/exit times + duration
- Search functionality

### TAP Module - COMPLETE
- Back button + Home button in header
- DISCO MODE label + Table toggle switch
- Barman selector dropdown (Carlos, Maria, João, Ana)
- NFC scanner/search for guest lookup
- Custom item addition (name + price + category)
- Revenue displayed in header (Tabs: X, Revenue: R$X)
- Open/close tabs, add items, pay with card/cash/comp

### Rewards System - COMPLETE
- Points config, 4 tiers (Bronze/Silver/Gold/Platinum)
- Configurable rewards catalog
- Points assignment from bar page

### TABLE Module - COMPLETE
- 9 venue tables across 4 zones
- Open/Close tables, add items, send to KDS

### KDS Module - COMPLETE
- Kitchen/Bar destination routing
- 3-column Kanban lifecycle

### Block Wristband System - COMPLETE
- Block from guest profile (reason: lost)
- Red alert in profile when blocked
- Full-screen red BLOCKED screen when scanned at bar
- Unblock functionality

---

## Prioritized Backlog

### P1 - Next
- Manager Dashboard (cadastro de menu/catalog, barmen, venue settings)
- Owner Dashboard (multi-venue analytics)
- Tips system (proportional calculation by barman)

### P2
- Restaurant vs Club mode (venue select adapts)
- Menu/catalog management (create/edit/delete items via Manager)
- Barman registration (via Manager)
- Event Wallet module (cashless events)

### P3
- Offline-first for staff apps
- Stripe webhook handlers

---

## Architecture
```
/app/
├── backend/
│   ├── server.py
│   ├── routes/ (auth, billing, pulse, tap, table, kds, venue, rewards, manager, owner, ceo)
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
- Role: super_admin | Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Test Results
- iteration_5: 23/23 (Table, KDS, TAP, Pulse)
- iteration_6: 10/10 (Venue Home, navigation)
- iteration_7: 15/15 (Venue Select, Bar, Exit, Rewards, Guest Profile)
- iteration_8: 16/16 (Block wristband, TAP NFC/barman/table toggle, Inside clickable, Exit tab warning) — 2026-02-27
