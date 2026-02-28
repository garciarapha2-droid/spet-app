# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (nightclubs, restaurants, bars). Core modules: Pulse (entry/identity), TAP (bar tabs), Table (restaurant), KDS (kitchen display), Owner/Manager Dashboards with AI insights.

## User Personas
- **Owner**: Multi-venue operator, needs aggregated business insights
- **Manager**: Venue-level operations, staff management, guest analytics
- **Staff**: Bartenders, servers, kitchen crew
- **CEO**: Strategic business oversight (upcoming)

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configs, guests, events, staff)
- **Auth**: JWT (email/password)
- **AI**: OpenAI GPT-5.2 via emergentintegrations + Emergent LLM Key
- **Credentials**: teste@teste.com / 12345

## Core Requirements
1. Home page shows active events only (single-click = preview, double-click = enter)
2. Pulse: Entry management with guest identity
3. TAP: Bar tab management with NFC cards, guest confirmation, unified close flow
4. Table: Restaurant table management, mandatory server selection, ID verification for alcohol
5. KDS: Kitchen display system
6. Manager Dashboard: Staff management, analytics, AI insights, guest profiles
7. Owner Dashboard: Multi-venue KPIs, financial analytics, AI insights, view switcher, people drill-down
8. Unified Close Flow: Pay here / Pay at register
9. Semi-automatic tip recording: Manual input → automatic distribution

## Completed Features (as of Feb 2026)
- [x] Auth + JWT
- [x] Home page with active event filtering + preview/enter
- [x] Pulse, TAP, Table, KDS modules
- [x] Guest confirmation modal (TAP)
- [x] ID verification for alcohol (Table)
- [x] Mandatory server selection (Table)
- [x] Unified Close Flow + Tip Recording
- [x] Conversational AI Assistant (Owner + Manager)
- [x] Tab search without "#" prefix
- [x] AI input: Enter = new line, button = submit
- [x] **Manager Dashboard > Guests: Sorted by highest spender + profile modal (total spend, event history, tabs)**
- [x] **Owner Dashboard > Overview: View switcher (Business Overview / By Venue / By Event)**
- [x] **Owner Dashboard > People & Ops: Clickable cards with staff drill-down modal**

## Backlog
### P0 (Next)
- CEO Dashboard (Founder View) with KPIs, revenue vs profit, targets, growth pipeline

### P1
- Per-Event Dashboard (Manager) — single event analysis

### P2
- KDS/Bar Order Routing
- Push notifications

### P3
- Stripe Webhooks for subscriptions
- Offline-First capabilities
- Event Wallet Module
