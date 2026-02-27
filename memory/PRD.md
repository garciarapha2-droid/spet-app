# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (clubs, bars, restaurants). Named **SPETAP**.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configs, guests, catalog, roles, snapshots, events)
- **Auth**: JWT (localStorage: `spetap_token`)
- **LLM**: GPT-5.2 via emergentintegrations (Emergent LLM Key)
- **Key Credential**: `teste@teste.com` / `12345` (Protected System Account)

---

## What's Been Implemented

### P0 Product Rules (Feb 27, 2026) ✅

#### Block 1 — Bar/Tap: Guest Confirmation Modal
- Large modal appears when selecting any tab on Bar/Tap
- Shows: Guest photo (if available), Name + Surname, Tab #
- Buttons: "Confirm this guest" / "Cancel"
- No ID verification in Bar/Tap — NEVER
- Confirmation doesn't reappear during active flow (tracked in state per session)
- Cancel deselects the tab

#### Block 2 — Table: ID Verification (Alcohol Only)
- Table + alcoholic item → shows ID Verification modal (text-only, no photo/name)
- Checkbox required: "I have verified this guest's ID (21+)"
- After verification: `id_verified=true` cached on session (meta)
- "ID verified" green badge shown on subsequent items
- Cache valid until tab closed
- Audit event `id_verification_event` stored
- Non-alcoholic items → no modal
- Bar/Tap → never triggers ID verification

#### Block 3 — Event vs Guest Memory (Pulse)
- New events start with empty guest list (✅ correct behavior)
- Guest is global entity in Pulse (`venue_guests`) — NEVER deleted
- `event_guests` collection = temporal presence
- Enriched with full Pulse data (name, photo, visits, spend_total, tags)
- `POST .../end` clears all `event_guests` but guests remain in Pulse
- Guest history always visible: events attended, spend per event, total spend

#### Block 4 — Staff per Event
- Manager selects staff per event with role + hourly_rate snapshot
- `event_staff` collection captures assignment at time of creation
- Enriched with staff name from `venue_barmen`
- Base for: Shift vs Operations, costs, AI, auditoria

### Conversational AI Assistant (Feb 27, 2026) ✅
- Owner Dashboard: conversational AI with empty state, input field, deletable cards, clickable next steps
- Manager Dashboard: same pattern in Shift vs Ops section
- Staff Breakdown: Wages, Tips, Total columns (Tips placeholder $0)
- AI Response Structure: Summary, What We See, Recommended Actions, Next Steps (mandatory)

### Earlier Implementations ✅
- Manager Dashboard (8 sections), Owner Dashboard (7 sections)
- Pulse tab#, Table server assign, Funnel drill-down, Tables by Server
- KDS Dismiss fix, System Account Protection
- Core Modules: Pulse, Tap, Bar, Table, KDS

---

## Key API Endpoints

### Bar/Tap
- `GET /api/tap/session/{id}` — Returns `guest_photo`, `id_verified`, `tab_number`
- `POST /api/tap/session/{id}/verify-id` — Marks session ID-verified + audit event

### Events
- `GET /api/venue/{vid}/events/{eid}/guests` — List event guests (enriched)
- `POST /api/venue/{vid}/events/{eid}/guests` — Add Pulse guest to event
- `DELETE /api/venue/{vid}/events/{eid}/guests/{gid}` — Remove guest (temporal)
- `POST /api/venue/{vid}/events/{eid}/end` — End event, clear guests
- `GET /api/venue/{vid}/events/{eid}/staff` — List event staff
- `POST /api/venue/{vid}/events/{eid}/staff` — Assign staff (role+rate snapshot)
- `DELETE /api/venue/{vid}/events/{eid}/staff/{sid}` — Remove staff

---

## Data Models

### MongoDB Collections
- `venue_guests` — Global guest entity (Pulse) — NEVER deleted
- `event_guests` — Temporal event presence (cleared on event end)
- `event_staff` — Per-event staff assignment with role + hourly_rate snapshot
- `events` — Event metadata (name, date, is_active)
- `staff_roles` — Customizable job roles with default hourly rates

### PostgreSQL
- `tap_sessions.meta` — JSON with `id_verified`, `id_verified_at`, `id_verified_by`
- `audit_events` — Stores `id_verification_event` for compliance

---

## Backlog
- P2: KDS/Bar Order Routing, Tip-Splitting Logic, Push Notifications
- P3: Stripe Webhooks, Offline-First, Event Wallet Module
