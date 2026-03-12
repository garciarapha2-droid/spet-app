# SPET — Venue Operations Platform

## Original Problem Statement
Multi-tenant SaaS platform for real-time venue operations. Modules: Pulse (guest entry), Tap (bar orders), Table (restaurant), KDS (kitchen display), Manager (analytics), CEO (company-level metrics).

## Core Requirements
- Real-time synchronization across all modules
- Tips attributed ONLY to the specific staff member who handled the order
- Consistent payment flow (Pay Here / Pay at Register) in Tap and Table
- Inside Now panel showing ALL active guests
- Interactive KPIs with drill-down modals
- User & Module management from CEO dashboard

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, PostgreSQL, MongoDB
- **Real-time**: WebSockets
- **Auth**: JWT
- **AI**: OpenAI via Emergent LLM Key

## What's Been Implemented

### Phase 1: Foundation (Complete)
- Full UI rebrand from SPETAP to SPET (dark theme, blue accents)
- Authentication system (JWT)
- Demo data seeding (seed_demo.py)
- All core modules: Pulse, Tap, Table, KDS, Manager, CEO

### Phase 2: Real-time & Sync (Complete)
- WebSocket integration for Manager Dashboard
- Data sync across all modules
- Bar order persistence
- Guest spend calculation

### Phase 3: Operational Rules (Complete - Mar 12, 2026)
- **P0-1**: Tip distribution fix — tips go ONLY to specific bartender (removed pool distribution)
- **P0-2**: Payment flow consistency — both Tap and Table force Pay Here / Pay at Register
- **P0-3**: Inside Now panel — shows ALL active guests with name, time, status, tab ID

### Phase 4: Interactive Dashboards (Complete - Mar 12, 2026)
- **P1-1**: Revenue Today KPI clickable with detailed modal (revenue, tips, payments, sessions, top items)
- **P1-2**: CEO KPIs (MRR, Gross Revenue, Net Profit) clickable with venue breakdown
- **P1-3**: Company Management with user status toggle and module management per venue

### Phase 5: Regression Fixes (Complete - Mar 12, 2026)
- **FIX 1**: Staff Earnings tip attribution — tips now match bartender_id as both UUID and name
- **FIX 1**: Seed script fixed to use venue_barmen ID instead of user ID for tip attribution
- **FIX 2**: Bar Inside Tabs now shows ALL inside guests (merges open sessions + pulse/inside data)
- **FIX 2**: pulse/inside endpoint now queries most recent session regardless of status (open or closed)

### Phase 6: Operational Rules Restoration (Complete - Mar 12, 2026)
- **Rule 1**: Alcohol ID verification confirmed as Table-only (Tap/Bar bypasses verification)
- **Rule 2**: Demo data now shows profitable operation ($566 revenue, $324 staff cost, +$242 result)
- Deactivated TEST_ barmen artifacts, set realistic hourly rates ($12-15/h)
- Seed now closes 4 sessions with proper tip attribution and bartender IDs
- Shift hour cap reduced from 12h to 6h (realistic nightclub shift)

### Phase 7: Table Alcohol ID Bug Fix (Complete - Mar 12, 2026)
- **Root cause**: `handleIdVerified` lost references to sessionId and pendingAlcoholItem due to async state updates and stale closures
- **Fix**: Captured sessionId and itemToAdd in local variables BEFORE async operations, then executes verify-id → close modal → add item → refresh sequentially

## Prioritized Backlog

### P1 (Next)
- Per-Event Dashboard (Manager View)
- Final Demo & Operational Checklist

### P2
- KDS / Bar Order Routing enhancements
- Push notifications for real-time alerts

### P3
- Stripe Webhooks for subscriptions
- Offline-First Capabilities
- Event Wallet Module

## Key Credentials
- **Tester**: teste@teste.com / 12345 (platform_admin) — PROTECTED
- **CEO**: garcia.rapha2@gmail.com / 1234 (ceo) — PROTECTED
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Protected Accounts Policy
- Both accounts are auto-created on startup via `ensure_system_account()`
- Both are in PROTECTED_SYSTEM_ACCOUNTS set — cannot be deleted
- Future updates must NEVER remove existing users or test data

## Architecture Notes
- PostgreSQL: Transactional data (sessions, items, users)
- MongoDB: Config, barmen, targets, venue configs
- `bartender_id` stored in session meta (JSONB)
- `tab_number` stored in session meta (not a column)
- Protected emails: teste@teste.com (do not delete)
