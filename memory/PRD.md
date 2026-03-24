# SPET — Product Requirements Document

## Original Problem Statement
Nightlife management SaaS with modules: Owner, Manager, Pulse, CEO OS.
The CEO OS module includes a full CRM with Pipeline, Customer Base, and executive dashboards.

## Architecture
```
/app
├── frontend/         React (CRA) + Tailwind + Shadcn UI
│   ├── src/
│   │   ├── components/ceo/
│   │   │   ├── CrmDetailDialog.js    # Reutilizable: deal + customer mode
│   │   │   ├── CustomerDetailDialog.js # Legacy (migrated to crmService)
│   │   │   ├── ChartCard.js / KpiCard.js / PeriodFilter.js / DrillDownSheet.js
│   │   ├── hooks/
│   │   │   └── useCrmData.js         # useDeals, useDeal, useCustomers
│   │   ├── services/
│   │   │   ├── crmService.js         # REAL API — deals, customers, analytics, targets
│   │   │   └── ceoService.js         # Legacy mock (only used by CeoOverview/Revenue)
│   │   ├── pages/ceo/
│   │   │   ├── CeoLayout.js          # Sidebar + revenue targets (REAL API)
│   │   │   ├── CeoOverview.js        # Active Customers KPI real, rest mock
│   │   │   ├── CeoRevenue.js         # Still uses ceoData.js mock
│   │   │   ├── CeoUsers.js           # ✅ REAL API — useCustomers hook
│   │   │   ├── CeoSecurity.js        # ✅ REAL API — security analytics
│   │   │   ├── CeoPipeline.js        # ✅ REAL API — kanban + deal dialog
│   │   │   ├── CeoReports.js         # ✅ REAL API — reports analytics
│   │   │   └── CustomerBase.js       # ✅ REAL API — customer table + dialog
│   │   └── App.js
├── backend/          FastAPI + PostgreSQL + MongoDB
│   ├── routes/
│   │   ├── crm.py                    # CRUD: deals, customers, activities
│   │   ├── ceo_analytics.py          # ✅ NEW: security, reports, revenue-targets
│   │   └── ceo.py                    # Legacy CEO routes
│   └── migrations/
│       └── crm_migration.py          # Creates tables + seed data
```

## Database (PostgreSQL)
### Tables
- `deals`: id, contact_name, contact_email, contact_phone, company_name, address, plan_id, stage, deal_value, notes, created_at, updated_at, closed_at
- `deal_activities`: id, deal_id, type, description, created_at, updated_at
- `customers`: id, company_name, contact_name, contact_email, contact_phone, address, plan_id, status, mrr, modules_enabled, payment_method, signup_date, deal_id, notes, created_at, updated_at

### Stages: lead, qualified, proposal, negotiation, closed_won, closed_lost
### Plans: core ($149), flow ($299), sync ($499), os ($724)

## Real API Endpoints
### CRM CRUD (/api/crm/*)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /deals | List all deals (filter by stage) |
| GET | /deals/:id | Get deal with activities |
| POST | /deals | Create deal |
| PUT | /deals/:id | Update deal fields |
| POST | /deals/:id/won | Close as won + create customer |
| POST | /deals/:id/lost | Close as lost |
| POST | /deals/:id/activities | Add activity |
| PUT | /activities/:id | Update activity |
| DELETE | /activities/:id | Delete activity |
| GET | /customers | List customers (filter by status, plan, search) |
| GET | /customers/:id | Get single customer |
| PUT | /customers/:id | Update customer |

### Analytics (/api/crm/analytics/*)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /analytics/security | Alerts, risk score, module usage from customers |
| GET | /analytics/reports | Pipeline funnel, loss reasons, history, metrics |
| GET | /analytics/revenue-targets | Weekly/monthly/annual targets from real MRR |

## Testing
- iteration_84: 14/14 (initial CEO pages)
- iteration_85: 100% (v2 rebuild — Users, Security, Pipeline, Reports + theme)
- iteration_86: 24/24 backend + 100% frontend (CRM real persistence)
- iteration_87: 28/28 backend + 100% frontend (CEO analytics migration)

## User Accounts
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345

## What's Complete
- [x] Pipeline kanban with real Postgres data
- [x] Deal detail dialog — all fields editable, persisted
- [x] Mark as Won → creates customer automatically
- [x] Activity log CRUD (add, edit, delete)
- [x] Customer Base page with real data, search, filters
- [x] Customer detail dialog — status, modules, plan editable
- [x] Overview Active Customers KPI → navigates to /ceo/customers
- [x] Theme toggle (dark/light) with localStorage
- [x] All legacy pages preserved (zero regression)
- [x] CEO Users page → real PostgreSQL data via useCustomers hook
- [x] CEO Security page → real analytics from /api/crm/analytics/security
- [x] CEO Reports page → real funnel/loss/history from /api/crm/analytics/reports
- [x] CeoLayout sidebar → real revenue targets from /api/crm/analytics/revenue-targets
- [x] CustomerDetailDialog migrated from ceoService to crmService
- [x] ZERO imports of ceoService.js in Security, Reports, Users, Layout

## Prioritized Backlog
### P0 — DONE
- ~~Migrate Security, Reports, Users pages from mock to real API~~
- ~~Connect CeoReports to real deals data for funnel/pipeline charts~~

### P1
- Migrate CeoOverview from ceoData.js mock to real API
- Migrate CeoRevenue from ceoData.js mock to real API
- Add CEO link in global navigation
- Drag-and-drop deal cards between pipeline columns

### P2
- Owner/Manager/Pulse backend API integration
- Mobile responsiveness audit

### P3
- Landing page Pricing Cards fix (3x recurrence)
