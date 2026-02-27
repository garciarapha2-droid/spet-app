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

## Implemented Features

### Table: Server Mandatory (Feb 27, 2026) ✅
- Server selection required before opening table (red border + error if missing)
- Open button disabled until both guest name + server selected
- Context bar shows: Table #, Guest name, Tab #, Server name, ID badge
- Server selector in header pulses red when unset
- `handleAddItem` also checks for server

### Manager AI Redesign (Feb 27, 2026) ✅
- Card redesign: header with classification badge + copy + delete buttons
- Clear typography: SUMMARY → WHAT WE SEE → RECOMMENDED ACTIONS → NEXT STEPS
- Numbered actions with circle indicators
- Copy button copies full insight text to clipboard
- Next Steps: numbered, full-width clickable cards with category labels (Revenue/Ops/Staff)
- Same improvements applied to Owner Dashboard AI (labels: Revenue/Staff/Growth/Strategy)

### P0 Product Rules (Feb 27, 2026) ✅
- Bar/Tap Guest Confirmation Modal (photo, name, tab#)
- Table ID Verification (alcohol only, checkbox 21+, cached, badge, audit)
- Event vs Guest Memory (event_guests temporal, Pulse global)
- Staff per Event (role + hourly_rate snapshot)
- Tap search accepts tab number with/without `#`

### Conversational AI Assistant (Feb 27, 2026) ✅
- Owner/Manager: conversational AI with empty state, input, deletable cards, next steps
- Staff Breakdown: Wages, Tips, Total columns

### Earlier ✅
- Manager Dashboard (8 sections), Owner Dashboard (7 sections)
- Shift vs Operations (6 sub-sections), Event creation wizard
- Pulse, Tap, Bar, Table, KDS core modules
- System Account Protection, KDS Dismiss fix

---

## Key Endpoints
- `POST /api/tap/session/{id}/verify-id` — ID verification + audit
- `GET /api/pulse/guests/search?venue_id=X&q=Y` — Guest search
- Event Guests/Staff CRUD: `/api/venue/{vid}/events/{eid}/guests|staff`
- `POST /api/venue/{vid}/events/{eid}/end` — End event

---

## Backlog
- **P1**: Per Event Dashboard (Overview, Top Spenders, Consumo, Staff Performance, Timeline, AI, Next Steps)
- **P2**: KDS/Bar Order Routing, Tip-Splitting, Push Notifications
- **P3**: Stripe Webhooks, Offline-First, Event Wallet
