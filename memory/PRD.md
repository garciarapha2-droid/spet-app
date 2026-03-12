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
- Bar orders save to backend via `submitOrder()`
- Guest `spend_total` updates in MongoDB on tab close
- Session detail returns tip info

### Phase 7: Bar Module Behavior Corrections (Complete — March 12, 2026)
- **Inside Tabs shows ALL 7 inside guests** (guest-centric list from Pulse + Tap merge)
- **Auto-create tab** for guests without sessions (POST /api/tap/session/open)
- **Confirm requires payment method** — Cart → Confirm → Payment Selector (Pay Here | Pay at Register)
- **Chips payment removed** from Bar flow
- **Pay Here** → submits items → closes tab → tip recording flow
- **Pay at Register** → submits items → tab stays open
- All 11 features verified: 100% pass rate

## Bar Operational Flow
Guest enters → Pulse  
Guest appears in Inside Tabs (all inside guests visible)  
Bartender selects guest (click from list OR scan tag)  
Auto-creates tab if guest has no session  
Bartender adds items  
Bartender clicks Confirm → Payment selector appears  
Pay Here → items saved → tab closed → tip → Manager updates  
Pay at Register → items saved → tab open → Manager updates  

## Prioritized Backlog

### P0 (Next)
- Final Demo & Operational Checklist

### P1
- Per-Event Dashboard (Manager View)
- KDS / Bar Order Routing enhancements

### P2
- Push notifications
- Stripe Webhooks

### P3
- Offline-First Capabilities
- Event Wallet Module

## Test Credentials
- Email: teste@teste.com
- Password: 12345
