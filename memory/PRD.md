# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (clubs, bars, restaurants). Named **SPETAP**.

## Core Surfaces
- CEO Dashboard, Owner Dashboard, Manager Dashboard
- Staff Apps: Host (Pulse), Tap (Bar), Table, KDS (Kitchen)

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configurations, guest PII, catalog)
- **Auth**: JWT-based (localStorage: `spetap_token`)
- **LLM**: GPT-5.2 via emergentintegrations (Emergent LLM Key)
- **Currency**: USD ($)

## Key Credentials
- Email: `teste@teste.com` / Password: `12345` (PROTECTED SYSTEM ACCOUNT)
- Venue ID: `40a24e04-75b6-435d-bfff-ab0d469ce543`

---

## What's Been Implemented

### P0: System Account Protection ✅
- DELETE returns 403 for `teste@teste.com`, ensure_system_account on startup

### PHASE 2: Manager Dashboard ✅
8 sections: Overview, Staff & Roles, Menu/Products, Shifts & Ops, NFC & Guests, Reports & Finance, Loyalty & Rewards, Settings

### PHASE 3: Owner Dashboard ✅
7 sections: Overview, Performance by Venue, AI Insights (GPT-5.2), Finance & Risk, Growth & Loyalty, People & Ops, System & Expansion

### Feature Sprint (Feb 27, 2026) ✅
1. **Pulse Guest Today — Tab # visible**: Every guest entry shows `#tab_number` next to name, matching Inside/Bar/Exit pattern
2. **Tables — Server Assignment**: Each occupied table shows server name as interactive button. Add/change server via dropdown. Auditable via audit_events.
3. **Manager Guest Funnel — Drill-down**: Entry/Allowed/Tabs Open/Tabs Closed are clickable. Modal shows guest list with details (name, tab#, server, total).
4. **Tables by Server (Manager)**: New Manager sidebar section showing occupied tables grouped by server with revenue totals. Highlights unassigned tables.
5. **AI Insights (GPT-5.2)**: Real LLM-powered insights in Owner Dashboard. Uses venue context data (revenue, funnel, staff, tables, voids). Format: Summary → What We See → Recommended Actions → Reference. Disclaimer always visible.

### Bug Fix: KDS Dismiss ✅
- Popup stays dismissed using `dismissedIds` Set tracking

### Earlier Implementation ✅
- JWT auth, Venue Home, Pulse entry/inside/exit, barman CRUD, KDS 5-column Kanban, Demo data seeding, Catalog CRUD with photo upload, Horizontal Kanban menu across TAP/Bar/Table

---

## Backlog (Prioritized)

### P2 — Future
- KDS/Bar Order Routing (auto-split food→KDS, drinks→Bar)
- Tip-Splitting Logic
- Event Wallet Module (cashless)
- Stripe Webhooks
- Offline-First
- CEO Dashboard
- Real-time notifications
