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
│   │   │   ├── ceo/          # CEO-specific reusable components
│   │   │   ├── shared/       # GlobalNavbar (Owner/Manager/Pulse)
│   │   │   └── ui/           # Shadcn UI components
│   │   ├── data/             # Mock data files
│   │   ├── pages/
│   │   │   ├── ceo/          # CEO OS module (isolated layout)
│   │   │   ├── owner/        # Owner Command Center
│   │   │   ├── manager/      # Manager Dashboard
│   │   │   ├── pulse/        # Pulse Guest Management
│   │   │   └── landing/      # Landing page
│   │   └── App.js            # Routes
│   └── package.json
├── backend/          FastAPI + MongoDB
│   └── server.py
└── memory/
    └── PRD.md
```

## User Accounts
- **CEO**: garcia.rapha2@gmail.com / 12345 (role: CEO, redirects to /ceo)
- **Regular**: teste@teste.com / 12345 (Owner/Manager/Pulse access)

## What's Been Implemented

### CEO OS Module (Phase 1 — COMPLETE)
- **CeoLayout.js** — Dedicated isolated layout with fixed sidebar (200px) + navbar (64px). NOT using GlobalNavbar from other modules
- **CeoOverview.js** — Executive Overview: 6 KPI cards, growth banner, MRR Growth chart, Customer Growth chart, Revenue Breakdown pie, Quick Stats list, drill-down modals
- **CeoRevenue.js** — Revenue: 8 KPI cards (2 rows), Revenue Last 30 Days area chart, MRR Breakdown 12-month bar chart, drill-down modals
- **CeoUsers.js** — Users & Subscribers: 4 KPI cards, Users by Plan pie, MRR by Plan bar, Status Distribution pie, full customer table with search/filter/sort, customer detail drill-down
- **Reusable components**: KpiCard, PeriodFilter, ChartCard, ListCard, DrillDownSheet, CompanyListDrillDown, BreakdownDrillDown
- **Mock data**: ceoData.js with 39 customers, revenue targets, KPIs, chart data, customer events
- **Routing**: /ceo → /ceo/overview (redirect), /ceo/revenue, /ceo/users — all behind CEORoute
- **Testing**: 14/14 tests passed (iteration_84)

### Owner Command Center (COMPLETE)
- Overview, Revenue Analytics, Profit Analysis, Venue Comparison, Time Analysis
- Shift Operations, Staff (rebuilt from spec)
- Customer Intelligence, Audience Intelligence, Segments, Churn/Retention
- Loyalty Performance, Campaign Performance
- Financial Overview, Cost Analysis, Risk Alerts
- Smart Insights, Action Center
- Venue Management, Settings

### Manager Dashboard (COMPLETE)
- Overview, Staff/Roles, Tables by Server, Menu/Products
- Shift Operations, Tips, NFC Guests, Reports/Finance, Settings
- Full Loyalty module (Rewards, Guests, Profiles, Tiers, Campaigns, Insights)

### Pulse Module (COMPLETE)
- Guest Management, Inside, Bar, Exit, Rewards, Guest Profiles

### Landing Page (COMPLETE)
- Known recurring issue: Pricing Cards (3x recurrence, not addressed)

## Prioritized Backlog

### P0 — CEO Module Phase 2
- CustomerLifecycle page
- LeadBreakdown page
- SalesKPIs page
- CashFlowMRR page

### P1
- Add CEO link in global navigation (role-gated)
- Implement all drill-down interactivity across CEO pages
- Global period filter synchronization
- Remaining CEO pages: MRR Retention, CAC, Conversion Rate, Executive, Security, Startup KPIs, Pipeline, Reports

### P2
- Backend API integration (replace all mock data with live APIs)
- Refactor ownerData.js into domain-specific files
- Integrate GuestFullHistory.js into Manager and Pulse modules

### P3
- Landing page Pricing Cards fix (recurring issue)
- Performance optimization
- Mobile responsiveness audit

## Tech Stack
- React (CRA) + Tailwind CSS + Shadcn UI
- FastAPI + MongoDB
- Recharts, Framer Motion, Lucide React, Sonner
- react-router-dom v6 (nested routes)

## Key Design Rules
- Currency: USD ($)
- Visual: Premium, clean, executive aesthetic
- CEO layout is COMPLETELY isolated from Owner/Manager/Pulse
- Mock data architecture prepared for backend swap
- All data-testid attributes on interactive elements
