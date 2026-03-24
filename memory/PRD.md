# SPET — Product Requirements Document

## Original Problem Statement
Build a nightlife management SaaS application with multiple modules:
- **Owner Command Center**: Multi-venue analytics, performance, customers, finance, insights
- **Manager Dashboard**: Staff, tables, menu, shift operations, tips, loyalty program
- **Pulse Module**: Guest management (entry, inside, bar, exit, rewards, profiles)
- **CEO OS Module**: Executive-level SaaS metrics dashboard with MRR, revenue, customers, lifecycle, pipeline, etc.

## Core Architecture
```
/app
├── frontend/         React (CRA) + Tailwind + Shadcn UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── ceo/               # CEO reusable components
│   │   │   │   ├── ChartCard.js
│   │   │   │   ├── CustomerDetailDialog.js  # Editable plan/status/modules
│   │   │   │   ├── DrillDownSheet.js
│   │   │   │   ├── KpiCard.js
│   │   │   │   └── PeriodFilter.js
│   │   │   ├── shared/            # GlobalNavbar (Owner/Manager/Pulse)
│   │   │   └── ui/                # Shadcn UI components
│   │   ├── data/                  # Legacy mock data
│   │   ├── services/
│   │   │   └── ceoService.js      # Centralized CEO data layer (mock → API ready)
│   │   ├── pages/
│   │   │   ├── ceo/               # CEO OS module (isolated layout)
│   │   │   │   ├── CeoLayout.js   # Dedicated layout with theme toggle
│   │   │   │   ├── CeoOverview.js
│   │   │   │   ├── CeoRevenue.js
│   │   │   │   ├── CeoUsers.js       # v2 rebuild: table + dialog
│   │   │   │   ├── CeoSecurity.js    # v2 rebuild: computed alerts + charts
│   │   │   │   ├── CeoPipeline.js    # v2 rebuild: kanban + deal details
│   │   │   │   └── CeoReports.js     # v2 rebuild: funnel + charts
│   │   │   ├── owner/
│   │   │   ├── manager/
│   │   │   ├── pulse/
│   │   │   └── landing/
│   │   └── App.js
│   └── package.json
├── backend/          FastAPI + MongoDB
│   └── server.py
└── memory/
    └── PRD.md
```

## User Accounts
- **CEO**: garcia.rapha2@gmail.com / 12345 (role: CEO, redirects to /ceo)
- **Regular**: teste@teste.com / 12345 (Owner/Manager/Pulse access)

## CEO OS Module — Complete Route Map (v2)
| Route | Component | Status |
|---|---|---|
| /ceo | redirect → /ceo/overview | Done |
| /ceo/overview | CeoOverview | Done |
| /ceo/revenue | CeoRevenue | Done |
| /ceo/users | CeoUsers (v2 rebuild) | Done ✅ |
| /ceo/security | CeoSecurity (v2 rebuild) | Done ✅ |
| /ceo/pipeline | CeoPipeline (v2 rebuild) | Done ✅ |
| /ceo/reports | CeoReports (v2 rebuild) | Done ✅ |
| /ceo/customer-lifecycle | CustomerLifecycleDashboard | Legacy |
| /ceo/mrr-retention | MrrRetentionDashboard | Legacy |
| /ceo/cac | CacDashboard | Legacy |
| /ceo/lead-breakdown | LeadBreakdownDashboard | Legacy |
| /ceo/sales-kpis | SalesKpisDashboard | Legacy |
| /ceo/cash-flow | CashFlowMrrDashboard | Legacy |
| /ceo/conversion | ConversionRateDashboard | Legacy |
| /ceo/executive | ExecutiveDashboard | Legacy |
| /ceo/startup | StartupKpisDashboard | Legacy |

## v2 Rebuild Features (Completed)
### Users & Subscribers
- Table: 8 customers, sortable columns, search, export button
- CustomerDetailDialog: editable plan dropdown (Core/Flow/Sync/OS), editable status dropdown, 8 module toggles, toast feedback

### Security & Monitoring
- 4 KPI cards (Risk Score, Total Alerts, Critical, Venues At Risk) — all clickable with drill-downs
- Risk Assessment gauge (RadialBarChart), Alert Breakdown donut, Module Usage horizontal bar
- Computed alerts from real customer data (low usage, past due, underutilized plan, churn risk, no revenue)
- Alert cards with severity styling + "View Venue" opens customer dialog

### Pipeline (CRM)
- Kanban board: 6 columns (New, Qualification, Presentation, Negotiation, Evaluation, Won)
- 10 seed deals with full contact details (name, email, phone, company, location)
- Deal detail dialog: contact info, deal details, notes, activity log
- Actions: "Move to Next Stage", "Mark as Lost" with reason selection
- Search by deal title, company, or contact

### CRM Reports
- 3 KPI cards: Active Opportunities → navigates to pipeline, Won → pipeline, Conv Rate → drill-down
- Pipeline Funnel: clickable rows showing stage, count, value → navigate to pipeline
- Loss Reasons: horizontal percentage bars (Price 34%, Competitor 22%, Budget 18%, Timing 14%, Other 12%)
- Pipeline Value Over Time: AreaChart with 6 months of data

### Theme Toggle Fix
- Uses ThemeContext with localStorage persistence (key: 'spetap-theme')
- Correctly toggles data-theme attribute for Tailwind dark mode
- Works globally across CEO layout and all pages

## Data Architecture
- **ceoService.js**: Centralized service layer with async functions (getCustomers, updateCustomerPlan, getDeals, moveDealToStage, etc.)
- Currently uses in-memory mock store that simulates API behavior
- To connect to real backend: replace function bodies with fetch/axios calls — no component changes needed

## Testing Status
- iteration_84: 14/14 passed (initial CEO pages)
- iteration_85: 100% frontend pass (v2 rebuild — Users, Security, Pipeline, Reports + theme toggle + legacy pages + access control)

## Prioritized Backlog

### P0 — Remaining Legacy Pages Rebuild
- Rebuild remaining legacy dashboard pages to v2 spec quality

### P1
- Add CEO link in global navigation (role-gated)
- Global period filter synchronization across all CEO pages

### P2
- Backend API integration (replace ceoService.js mock store with real API calls)
- Refactor ownerData.js into domain-specific files

### P3
- Landing page Pricing Cards fix (recurring issue, 3x)
- GuestFullHistory integration
- Performance optimization, mobile audit

## Tech Stack
- React (CRA) + Tailwind CSS + Shadcn UI
- FastAPI + MongoDB
- Recharts, Framer Motion, Lucide React, Sonner
- react-router-dom v6 (nested routes)

## Key Design Rules
- Currency: USD ($)
- Visual: Premium, clean, executive aesthetic
- CEO layout COMPLETELY isolated from Owner/Manager/Pulse
- Data service layer prepared for backend swap
- All data-testid attributes on interactive elements
- Theme: dark by default, toggle persists to localStorage
