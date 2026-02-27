# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (clubs, bars, restaurants). Named **SPETAP**.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configs, guests, catalog, roles, events, snapshots)
- **Auth**: JWT (localStorage: `spetap_token`)
- **LLM**: GPT-5.2 via emergentintegrations (Emergent LLM Key)
- **Credential**: `teste@teste.com` / `12345` (Protected System Account)

---

## What's Been Implemented

### Bug Fix — Tap Search (#-optional) (Feb 27, 2026) ✅
- Search field accepts `123` or `#123` — both find Tab #123
- Priority: numeric → tab_number match first, then name fallback
- Name search ("Alex") still works

### Event Guests & Staff UI (Feb 27, 2026) ✅
**Event Detail Panel:**
- Opens when clicking an event card (expandable below)
- Two tabs: **Guests** (with count) and **Staff** (with count)
- Guest search: Pulse guest lookup with debounced search, add/remove
- Staff: assign from venue_barmen with role + hourly_rate snapshot, remove
- "End Event" button: clears guest temporal presence, preserves Pulse data
- Total hourly cost summary in Staff tab

**Create Event Wizard:**
- Step 1: Event name, cover price, cover+consumption price
- Step 2: Assign staff (select barman, set role + $/hr) — optional
- Creates event + assigns all staff in one flow

### P0 Product Rules (Feb 27, 2026) ✅
- **Bar/Tap Guest Confirmation**: Modal with photo, name, tab# before ordering
- **Table ID Verification**: Modal for alcohol items (checkbox 21+), cached per session, badge
- **Event vs Guest Memory**: Events start empty, guests global in Pulse, event_guest temporal
- **Staff per Event**: Assignment with role + hourly_rate snapshot

### Conversational AI Assistant (Feb 27, 2026) ✅
- Owner & Manager dashboards: conversational AI with next steps, deletable cards
- Staff Breakdown: Wages, Tips, Total columns

### Earlier Implementations ✅
- Manager Dashboard (8 sections), Owner Dashboard (7 sections)
- Shift vs Operations (6 sub-sections incl. AI analysis)
- Pulse, Tap, Bar, Table, KDS core modules
- System Account Protection, KDS Dismiss fix

---

## Key API Endpoints

### Search & Scan
- `GET /api/pulse/guests/search?venue_id=X&q=Y` — Search Pulse guests by name

### Events
- `GET/POST /api/venue/{vid}/events/{eid}/guests` — Event guest CRUD
- `DELETE /api/venue/{vid}/events/{eid}/guests/{gid}` — Remove guest
- `POST /api/venue/{vid}/events/{eid}/end` — End event, clear guests
- `GET/POST /api/venue/{vid}/events/{eid}/staff` — Event staff CRUD
- `DELETE /api/venue/{vid}/events/{eid}/staff/{sid}` — Remove staff

### Tap/Table
- `POST /api/tap/session/{id}/verify-id` — ID verification for alcohol
- `GET /api/tap/session/{id}` — Includes guest_photo, id_verified

---

## Backlog
- **P1**: Event Dashboard (guests present, staff active, revenue, cost, AI summary)
- **P2**: KDS/Bar Order Routing, Tip-Splitting Logic, Push Notifications
- **P3**: Stripe Webhooks, Offline-First, Event Wallet Module
