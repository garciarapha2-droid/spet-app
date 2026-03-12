# SPET — Product Requirements Document

## Original Problem Statement
Build "SPET" (formerly SPETAP), a multi-tenant SaaS platform for venue operations (nightclubs, bars, restaurants). Modules: Pulse (entry), Tap (bar POS), Table (management), KDS (kitchen), Manager (dashboards), Owner, CEO.

## Tech Stack
- **Frontend**: React (CRA), Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (documents)
- **Real-time**: WebSocket (FastAPI + browser native)
- **AI**: OpenAI GPT-5.2 via emergentintegrations
- **Auth**: JWT stored in localStorage

## What's Been Implemented

### Phase 1-3: Core Platform + Bug Fixes + Integration (Complete)
- Full auth, routing, PostgreSQL/MongoDB schemas
- Demo data seeding (state-aware, auto-heals)
- Staff earnings logic (Base Pay + Tips)

### Phase 4: Rebrand & UI Polish (Complete — March 12, 2026)
- "SPETAP" → "SPET" across all visible UI
- Premium dark-first design system, electric blue accent

### Phase 5: WebSocket Real-time (Complete — March 12, 2026)
- `/api/ws/manager/{venue_id}` with auto-reconnect
- Events: item_added, tab_closed, tip_recorded, guest_entered, kds_update

### Phase 6: Operational Sync Fixes (Complete — March 12, 2026)
- **Fix 1**: Bar orders now save to backend via `submitOrder()` — items are POSTed individually then cart clears
- **Fix 2**: Guest `spend_total` updates in MongoDB when tab is closed
- **Fix 3**: Inside Tabs in Bar shows all active sessions, click-to-select works
- **Fix 4**: Chips payment method added — separate tracking from card/cash
- **Fix 5**: Manager dashboard separates chips from regular revenue (revenue excludes chips, chips shown as separate KPI)
- **Fix 6**: Session detail returns tip_amount, tip_percent, tip_recorded + full items list
- All 6 fixes verified: 11/11 backend + full frontend UI tests passed

## Prioritized Backlog

### P0 (Next)
- Final Demo & Operational Checklist

### P1
- Per-Event Dashboard (Manager View)
- KDS / Bar Order Routing enhancements
- Further UX/Wireframe Polish

### P2
- Push notifications
- Stripe Webhooks

### P3
- Offline-First Capabilities
- Event Wallet Module

## Test Credentials
- Email: teste@teste.com
- Password: 12345
