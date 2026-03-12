# SPET — Product Requirements Document

## Original Problem Statement
Build "SPET" (formerly SPETAP), a multi-tenant SaaS platform for venue operations. Modules: Pulse (entry), Tap (bar POS), Table, KDS (kitchen), Manager (dashboards), Owner, CEO.

## Tech Stack
- Frontend: React (CRA), Tailwind CSS, Shadcn/UI
- Backend: FastAPI (Python)
- Databases: PostgreSQL (transactional), MongoDB (documents)
- Real-time: WebSocket (FastAPI + browser native)
- AI: OpenAI GPT-5.2 via emergentintegrations
- Auth: JWT stored in localStorage

## What's Been Implemented

### Phase 1-3: Core Platform + Bug Fixes + Integration (Complete)
### Phase 4: Rebrand & UI Polish (Complete — March 12, 2026)
### Phase 5: WebSocket Real-time (Complete — March 12, 2026)

### Phase 6: Operational Sync Fixes (Complete — March 12, 2026)
- Bar orders save to backend via submitOrder()
- Guest spend_total updates in MongoDB on tab close
- Session detail returns tip info (tip_amount, tip_percent, tip_recorded)

### Phase 7: Bar Module Behavior Corrections (Complete — March 12, 2026)
- Inside Tabs shows ALL 7 inside guests (guest-centric from Pulse + Tap merge)
- Auto-create tab for guests without sessions
- Confirm requires payment method (Pay Here | Pay at Register)
- Chips payment removed

### Phase 8: Tip Propagation Fix (Complete — March 12, 2026)
- **Root cause fixed**: bartender_id (barmen collection) now stored in session meta, used for tip distribution instead of user_id (auth)
- **Flow**: Bar selects bartender → addItem stores bartender_id in meta → closeTab preserves it → recordTip uses it for tip_distribution → _calc_staff_cost matches via barmen_id
- **Tips appear in BOTH**: Shift vs Ops ($157) AND Staff Earnings (Carlos Silva $93.82)
- **WebSocket added to ShiftOpsSection** for real-time updates
- 18/18 backend tests + full frontend verified

## Prioritized Backlog
### P0: Final Demo & Operational Checklist
### P1: Per-Event Dashboard (Manager), KDS routing
### P2: Push notifications, Stripe Webhooks
### P3: Offline-first, Event Wallet

## Test Credentials
- Email: teste@teste.com | Password: 12345
