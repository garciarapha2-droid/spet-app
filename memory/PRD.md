# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (nightclubs, bars, restaurants). Modules: Pulse (entrance), Tap (bar), Table (restaurant), KDS (kitchen display), Manager, Owner, and CEO dashboards.

## Core Requirements
- Real-time venue operations management
- Multi-module architecture (Pulse, Tap, Table, KDS)
- Role-based dashboards (Manager, Owner, CEO)
- Demo-first approach: always presentable with seeded data
- All modules MUST communicate: Pulse <-> Tap <-> Table <-> KDS <-> Manager <-> Owner
- Single source of truth for all data (PostgreSQL for transactions, MongoDB for documents)

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (documents/guests/events)
- **Auth**: JWT in localStorage
- **LLM**: OpenAI GPT-5.2 via emergentintegrations

## What's Been Implemented

### Core Modules (Complete)
- Pulse (Entrance) + Bar with bartender selector + tips + Inside guest filtering
- Tap (Bar) with full order lifecycle + camera + cancel/confirm + pay flow
- Table (Restaurant) with server + seats + auto KDS routing + cancel/confirm
- KDS (Kitchen Display) with Kitchen/Bar tabs + ETA modal + delayed handling

### Dashboards (Complete)
- Manager Dashboard: All tabs + Tables by Server drill-down + Shift KPI drill-down
- Owner Dashboard: Multi-venue selector + Growth & Loyalty + Modules display + automatic real data
- CEO Dashboard: KPIs, revenue charts, target tracking

### Block 1 — 12 Refinements (DONE)
1-12: All completed (Table mandatory fields, Tap persistence, KDS fix, Manager drill-down, Owner features, etc.)

### Block 2 — 12 P0 Corrections (DONE)
1-12: All completed (KDS routing, camera getUserMedia, Pulse/Bar integration, ETA modal, Manager drilldown, Tap flow, data persistence)

### Block 3 — 6 P0 Consistency Patch (DONE — Feb 28, 2026)
1. Flow order: Pay → Tip → Confirm (Confirm blocked until payment chosen) ✅
2. Table total = items sum (seed fix: $45 matches) ✅
3. Owner Dashboard automatic real data (4 guests, 3 tabs, $22 revenue) ✅
4. Guest sync: 4 Inside guests across all modules (Pulse/Bar/Tap) ✅
5. State sync: Single source of truth, no isolated module logic ✅
6. Tips → Manager automatic (shift-drilldown reads tip_amount from meta) ✅

## Key Non-Negotiable Rules
- **Non-regression**: Nothing existing can be removed/simplified without approval
- **Flow order**: Pay → Tip → Confirm (never confirm before paying)
- **Data consistency**: Same numbers everywhere, single source of truth
- **Demo-first**: All screens must be populated with realistic demo data

## Prioritized Backlog
- (P0) Checklist final de demo e operação + UX polish
- (P1) Per-Event Dashboard (Manager View)
- (P2) KDS / Bar Order Routing refinement
- (P2) Push notifications
- (P3) Stripe Webhooks
- (P3) Offline-First
- (P3) Event Wallet Module

## Credentials
- Email: teste@teste.com
- Password: 12345
