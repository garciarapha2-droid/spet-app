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

### Conversational AI Assistant (Feb 27, 2026) ✅
Evolved AI from passive analysis to an active conversational partner in both dashboards:

**Owner Dashboard — AI Business Partner:**
- Empty state UI with invite message and suggestion chips
- Always-visible input field at bottom for asking questions
- Each AI response rendered as deletable card
- Mandatory "Next Steps" block with 3-5 clickable follow-up suggestions
- Auto-populates input when clicking a next step
- Accepts optional `question` form param on `POST /api/owner/ai-insights`
- Strategic, high-level tone (CFO/COO advisor)

**Manager Dashboard — AI Operations Partner:**
- Same conversational UI pattern within Shift vs Ops section
- Empty state with "Analyze This Shift" + clickable suggestions
- Always-visible input, deletable cards, clickable next steps
- Mandatory "Next Steps" in response JSON
- Operational, direct tone (operations consultant)

**Staff Breakdown Enhancement:**
- Updated columns: Name, Role, $/Hour, Hours, **Wages**, **Tips**, **Total**
- Tips placeholder ($0) — forward-compatible for future tip-splitting
- Backend `_calc_staff_cost` returns `wages`, `tips`, `total` per staff

### Manager Dashboard — Shift vs Operations ✅
Complete implementation with 6 sub-sections:
1. **Shift Overview**: KPIs — Revenue, Tables Closed, Staff Cost, Avg Ticket, Net Result
2. **Staff Earnings / Cost Breakdown**: Table with Wages/Tips/Total + inline edit
3. **Customize Staff**: Custom roles CRUD (versioned). Shift snapshots preserve historical rates.
4. **Shift History / Day Performance**: Per-day table with status badges
5. **Revenue vs Cost Chart**: Paired bar chart with period filters
6. **AI Operations Partner**: Conversational AI with next steps

### Earlier Implementations ✅
- P0: System Account Protection (403 on delete, auto-recreate on startup)
- Phase 2: Manager Dashboard (8 sections: Overview, Staff, Menu, Shifts, Guests, Reports, Loyalty, Settings)
- Phase 3: Owner Dashboard (7 sections: Overview, Performance, AI Business Partner, Finance, Growth, People, System)
- Feature Sprint: Pulse tab#, Table server assign, Funnel drill-down, Tables by Server
- Bug Fix: KDS Dismiss
- Core Modules: Pulse, Tap, Bar, Table, KDS with horizontal Kanban menus

---

## AI Response Structure (Mandatory)

### Owner AI (`POST /api/owner/ai-insights`)
```json
{
  "summary": "headline",
  "what_we_see": "detailed analysis",
  "recommended_actions": ["action1", "action2"],
  "next_steps": ["follow-up question 1?", "follow-up question 2?"],
  "reference": "or null",
  "priority": "critical | warning | info"
}
```

### Manager AI (`POST /api/manager/shift-ai`)
```json
{
  "summary": "headline",
  "what_we_see": "detailed analysis",
  "recommended_actions": ["action1", "action2"],
  "next_steps": ["follow-up question 1?", "follow-up question 2?"],
  "reference": "or null",
  "classification": "healthy | tight | underperforming"
}
```

---

## Backlog
- P2: KDS/Bar Order Routing, Tip-Splitting Logic, Push Notifications
- P3: Stripe Webhooks, Offline-First, Event Wallet Module
