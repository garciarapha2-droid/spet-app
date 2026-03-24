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
│   │   │   ├── ceo/          # CEO components (new + legacy dashboards)
│   │   │   ├── shared/       # GlobalNavbar (Owner/Manager/Pulse)
│   │   │   └── ui/           # Shadcn UI components
│   │   ├── data/             # Mock data files
│   │   ├── pages/
│   │   │   ├── ceo/          # CEO OS module (isolated layout + new pages)
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

## CEO OS Module — Complete Route Map
All routes use the new isolated CeoLayout with fixed sidebar + navbar:
| Route | Component | Type |
|---|---|---|
| /ceo | redirect → /ceo/overview | - |
| /ceo/overview | CeoOverview (new) | New page |
| /ceo/revenue | CeoRevenue (new) | New page |
| /ceo/users | CeoUsers (new) | New page |
| /ceo/customer-lifecycle | CustomerLifecycleDashboard | Legacy |
| /ceo/mrr-retention | MrrRetentionDashboard | Legacy |
| /ceo/cac | CacDashboard | Legacy |
| /ceo/lead-breakdown | LeadBreakdownDashboard | Legacy |
| /ceo/sales-kpis | SalesKpisDashboard | Legacy |
| /ceo/cash-flow | CashFlowMrrDashboard | Legacy |
| /ceo/conversion | ConversionRateDashboard | Legacy |
| /ceo/executive | ExecutiveDashboard | Legacy |
| /ceo/security | RiskDashboard | Legacy |
| /ceo/startup | StartupKpisDashboard | Legacy |
| /ceo/pipeline | CrmPipelineDashboard | Legacy |
| /ceo/reports | CrmReportsDashboard | Legacy |

## What's Been Implemented

### CEO OS Module
- **CeoLayout.js** — Dedicated isolated layout with fixed sidebar (200px) + navbar (64px)
- **3 New pages**: CeoOverview, CeoRevenue, CeoUsers — spec-driven, premium design
- **13 Legacy pages**: All original dashboard components integrated into new layout
- **Reusable components**: KpiCard, PeriodFilter, ChartCard, ListCard, DrillDownSheet
- **Mock data**: ceoData.js (39 customers, revenue targets, KPIs, chart data, events)
- **Testing**: 14/14 tests passed (iteration_84)

### Owner Command Center (COMPLETE)
- All pages: Overview, Revenue, Profit, Venue Comparison, Time, Shift Ops, Staff
- Customers, Audience, Segments, Churn, Loyalty, Campaigns
- Finance, Costs, Risk, Insights, Actions, Venues, Settings

### Manager Dashboard (COMPLETE)
- All pages including full Loyalty module

### Pulse Module (COMPLETE)
- Guest Management full flow

## Prioritized Backlog

### P0 — CEO Module Enhancement
- Progressively rebuild legacy dashboard pages to match new spec quality (CeoOverview/Revenue/Users style)

### P1
- Add CEO link in global navigation (role-gated)
- Global period filter synchronization across all CEO pages

### P2
- Backend API integration (replace all mock data with live APIs)
- Refactor ownerData.js into domain-specific files

### P3
- Landing page Pricing Cards fix (recurring issue, 3x)
- GuestFullHistory integration

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
