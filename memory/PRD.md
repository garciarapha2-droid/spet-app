# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access and operational screens. The CEO area must function as a **CEO Operating System** — a multi-dashboard analytics platform with premium SaaS quality (Stripe/Linear level).

## Architecture
- **Lovable** = public experience (landing, signup, login, checkout)
- **Emergent** = protected SaaS app + backend API
- **Database**: AWS RDS PostgreSQL (us-east-2) — persistent, production-grade
- **MongoDB**: Local (config/catalog)
- **Email**: Resend (spetapp.com verified domain)
- Integration contract FROZEN v1.0 — see `/app/INTEGRATION_CONTRACT.md`

## Completed Features

### CEO Operating System v2.0 (March 2026) — LATEST
Complete multi-dashboard CEO system with 8 distinct analytics dashboards:

**Structure:**
- Sidebar (200px): SPET branding, Revenue Targets, 8 navigation sections
- Main content: Each section is a full dashboard

**8 Dashboards Implemented:**
1. **Overview (Executive)**: 6 hero KPIs (MRR, Net New MRR, Active Customers, Churn, ARPU, LTV/CAC), Growth banner (MoM%), MRR trend chart, Customer growth chart, Revenue breakdown stacked bar, Quick Stats panel
2. **Revenue**: 8 metric cards (MRR, ARR, Expansion, Contraction, Churned), Daily revenue 30d area chart, MRR breakdown 12m stacked bar, Cash flow trend
3. **Growth**: LTV, CAC, LTV/CAC ratio, Payback period, LTV vs CAC line chart, New customers bar chart, Churn rate trend
4. **Marketing**: 6 conversion KPIs, Acquisition funnel (trapezoid), Traffic sources donut, Monthly lead capture & conversion
5. **Sales (CRM)**: Kanban pipeline (7 columns) + Table view, Performance sub-tab, Lead side panel with status/payment/notes updates, Search & source filter
6. **Customers**: Paying/new/lost/retention metrics, Customer growth area chart, New vs Lost bar chart, Revenue per customer line chart
7. **Product (Modules)**: Module adoption cards, Venues per module bar chart, Module distribution donut chart
8. **Risk/Security**: SVG gauge risk score, Severity donut, Incident types, Active alerts list

**7 New Backend Endpoints:**
- `GET /api/ceo/overview-metrics`
- `GET /api/ceo/revenue-detailed`
- `GET /api/ceo/growth-metrics`
- `GET /api/ceo/marketing-funnel`
- `GET /api/ceo/sales-performance`
- `GET /api/ceo/customer-lifecycle`
- `GET /api/ceo/risk-dashboard`

**Tech:** React + recharts (AreaChart, BarChart, LineChart, PieChart), 8 modular component files
**Tested:** iteration_59 — 100% backend (42/42), 100% frontend

### Previous Completed Work
- CEO CRM Leads System (P1)
- Account Activation Email (P2)
- Lead Capture & Email Routing (Resend)
- AWS RDS Migration (permanent fix for data loss)
- Integration Contract FROZEN v1.0
- Z-index Dropdown Bug Fix
- UI/UX Color System Upgrade
- Kitchen KDS, Menu Grid, Item Modifiers
- Table Mode, Manager Panel, Protected Users

## In Progress / Next
- **P3**: Paid access enforcement (block unpaid users)
- **P4**: Lovable ↔ Emergent final integration validation

## Future/Backlog
- Manager Panel refinement
- Server History View
- PWA, Live Activity Feed
- KDS/Bar routing, Push notifications
- Stripe Webhooks, Offline-First

## File Architecture
```
frontend/src/
├── pages/CeoPage.js              # Main shell with sidebar
├── components/ceo/
│   ├── shared.js                  # MetricCard, ChartCard, PageHeader, etc.
│   ├── OverviewDashboard.js       # Executive overview
│   ├── RevenueDashboard.js        # Revenue analytics
│   ├── GrowthDashboard.js         # Growth metrics
│   ├── MarketingDashboard.js      # Marketing funnel
│   ├── SalesDashboard.js          # CRM Kanban + Performance
│   ├── CustomersDashboard.js      # Customer lifecycle
│   ├── ProductDashboard.js        # Module adoption
│   └── RiskDashboard.js           # Risk/Security
backend/routes/ceo.py              # All CEO endpoints (15+)
```

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
