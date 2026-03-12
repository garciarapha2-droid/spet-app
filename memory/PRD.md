# SPET — Product Requirements Document

## Original Problem Statement
Build "SPET" (formerly SPETAP), a multi-tenant SaaS platform for venue operations (nightclubs, bars, restaurants). The platform includes modules for guest entry (Pulse), bar/tap operations (Tap), table management (Table), kitchen display (KDS), manager dashboards, owner dashboards, and CEO overview.

## Tech Stack
- **Frontend**: React (CRA), Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (documents)
- **AI**: OpenAI GPT-5.2 via emergentintegrations
- **Auth**: JWT stored in localStorage
- **Real-time**: WebSocket (native FastAPI + browser WebSocket API)

## Core Modules
1. **Pulse** — Guest entry management (NFC scan, manual entry, guest tracking)
2. **Tap** — Bar POS (tab management, menu categories, item ordering)
3. **Table** — Table management (8 tables, status tracking, orders)
4. **KDS** — Kitchen Display System (ticket kanban, destination routing)
5. **Manager Dashboard** — Real-time KPIs, staff management, reports (WebSocket-enabled)
6. **Owner Dashboard** — Multi-venue analytics, AI insights, finance
7. **CEO Dashboard** — Company-level overview

## What's Been Implemented

### Phase 1: Core Platform (Complete)
- Full authentication flow with JWT
- Multi-module routing and navigation
- PostgreSQL schema for transactional data
- MongoDB for venue/staff/guest documents

### Phase 2: Critical Bug Fixes (Complete)
- Staff Sync, "Pay Here" flow, Tip Sync

### Phase 3: System Integration (Complete)
- `ensure_demo_ecosystem` script for interconnected demo data
- End-to-end data flow from Pulse → Tap → KDS → Manager
- Staff earnings logic (Base Pay + Tips)

### Phase 4: Rebrand & UI Polish (Complete — March 12, 2026)
- Rebranded all visible references from "SPETAP" to "SPET"
- Premium dark-first design system with electric blue accent (#3B82F6)
- Backdrop-blur glass headers, custom scrollbar, focus rings

### Phase 5: Operational Sync Restoration (Complete — March 12, 2026)
- Upgraded seed system to STATE-AWARE: checks open session count, auto-heals if degraded
- Cross-module sync verified: Tap↔Manager, Pulse↔Manager, Table↔Sessions

### Phase 6: WebSocket Real-time Updates (Complete — March 12, 2026)
- Backend: `ws_manager.py` singleton manages connections per venue_id
- WS endpoint: `/api/ws/manager/{venue_id}` with auto-reconnect
- Events broadcast: `item_added`, `tab_closed`, `tip_recorded`, `guest_entered`, `kds_update`
- Frontend: Manager OverviewSection connects via WebSocket, auto-refreshes KPIs on any event
- 15/15 backend tests + full frontend verification passed

## Prioritized Backlog

### P0 (Next)
- Final Demo & Operational Checklist
- Further UX/Wireframe Polish (if requested)

### P1
- Per-Event Dashboard (Manager View)
- KDS / Bar Order Routing enhancements

### P2
- Push notifications
- Stripe Webhooks for subscriptions

### P3
- Offline-First Capabilities
- Event Wallet Module

## Test Credentials
- Email: teste@teste.com
- Password: 12345
