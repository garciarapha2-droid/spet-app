# SPET — Product Requirements Document

## Original Problem Statement
Build "SPET" (formerly SPETAP), a multi-tenant SaaS platform for venue operations (nightclubs, bars, restaurants). The platform includes modules for guest entry (Pulse), bar/tap operations (Tap), table management (Table), kitchen display (KDS), manager dashboards, owner dashboards, and CEO overview.

## Tech Stack
- **Frontend**: React (CRA), Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (documents)
- **AI**: OpenAI GPT-5.2 via emergentintegrations
- **Auth**: JWT stored in localStorage

## Core Modules
1. **Pulse** — Guest entry management (NFC scan, manual entry, guest tracking)
2. **Tap** — Bar POS (tab management, menu categories, item ordering)
3. **Table** — Table management (8 tables, status tracking, orders)
4. **KDS** — Kitchen Display System (ticket kanban, destination routing)
5. **Manager Dashboard** — Real-time KPIs, staff management, reports
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
- Zero functional regressions (14/14 tests passed)

### Phase 5: Operational Sync Restoration (Complete — March 12, 2026)
- Upgraded seed system to STATE-AWARE: checks open session count, auto-heals if degraded
- Full clean + reseed when state is incorrect (< 5 open sessions)
- Verified E2E flow: Guest enters → Tab opens → Order → KDS ticket → Close tab → Tip → Manager update
- 19/19 backend tests + all 6 modules verified
- Cross-module sync: Tap↔Manager, Pulse↔Manager, Table↔Sessions all consistent

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
