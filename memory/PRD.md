# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (clubs, bars, restaurants). Named **SPETAP**.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configs, guests, catalog, roles, snapshots)
- **Auth**: JWT (localStorage: `spetap_token`)
- **LLM**: GPT-5.2 via emergentintegrations (Emergent LLM Key)
- **Key Credential**: `teste@teste.com` / `12345` (Protected System Account)

---

## What's Been Implemented

### Manager Dashboard — Shift vs Operations (Feb 27, 2026) ✅
Complete implementation with 6 sub-sections:
1. **Shift Overview**: KPIs — Revenue, Tables Closed, Staff Cost, Avg Ticket, Net Result with status (Positive/Tight/Negative)
2. **Staff Earnings / Cost Breakdown**: Table with Name, Role, $/Hour, Hours, Earned + inline edit
3. **Customize Staff**: Custom roles CRUD (versioned — old rates archived to `staff_roles_history`). Each venue defines its own roles. Shift snapshots preserve historical rates.
4. **Shift History / Day Performance**: Per-day table — Revenue, Cost, Tabs, Result, Status badge. Answers "Did this day pay off?"
5. **Revenue vs Cost Chart**: Paired bar chart (green=revenue, orange=cost) with period filters (Today, 7d, 30d, Year, Custom date range)
6. **AI Shift Analysis (GPT-5.2)**: Manager can ask questions about shifts. AI responds with: Summary → What We See → Recommended Actions → Reference. Classification: Healthy/Tight/Underperforming. Disclaimer always visible.

### Earlier Implementations ✅
- P0: System Account Protection (403 on delete, auto-recreate on startup)
- Phase 2: Manager Dashboard (8 sections: Overview, Staff, Menu, Shifts, Guests, Reports, Loyalty, Settings)
- Phase 3: Owner Dashboard (7 sections: Overview, Performance, AI Insights GPT-5.2, Finance, Growth, People, System)
- Feature Sprint: Pulse tab#, Table server assign, Funnel drill-down, Tables by Server, AI Insights
- Bug Fix: KDS Dismiss
- Core Modules: Pulse, Tap, Bar, Table, KDS with horizontal Kanban menus

---

## Backlog
- P2: KDS/Bar Order Routing, Tip-Splitting, Event Wallet, Stripe Webhooks, Offline-First, CEO Dashboard
