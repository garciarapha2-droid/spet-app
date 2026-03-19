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

## Design System
- **Theme**: Light/Dark mode via CSS tokens in `index.css` (:root, .light, .dark)
- **Toggle**: `ThemeContext.js` + `ThemeToggle.js` → persists in localStorage
- **Tokens**: `--background`, `--foreground`, `--card`, `--border`, `--text-secondary`, `--text-tertiary`
- **Font**: Space Grotesk (brand) + Inter (body)
- **Brand**: `BrandLogo.js` — reusable component (navbar/footer/icon variants, uses `spet-icon-hd.png`)
- **Tailwind**: Extended with `text-secondary`, `text-tertiary` color tokens
- **Rule**: Never use hardcoded colors — always semantic tokens

## Completed Features

### Theme & Brand System (March 2026) — LATEST
- Created `BrandLogo` component with navbar/footer/icon variants + size system (sm/default/lg)
- Added `text-secondary` and `text-tertiary` to Tailwind config
- Added Space Grotesk font import
- Updated `SpetLogo` as backwards-compatible wrapper around `BrandLogo`
- Integrated ThemeToggle in CEO Dashboard header
- Migrated all 8 CEO dashboard components + shared to use semantic tokens
- Full dark/light mode support across CEO Operating System

### CEO Operating System v2.0 (March 2026)
Complete multi-dashboard CEO system with 8 distinct analytics dashboards:

**Structure:**
- Sidebar (200px): BrandLogo, Revenue Targets, 8 navigation sections, ThemeToggle
- Main content: Each section is a full dashboard

**8 Dashboards:**
1. **Overview**: MRR, Net New MRR, Customers, Churn, ARPU, LTV/CAC, Growth banner, MRR trend, Customer growth, Revenue breakdown, Quick Stats
2. **Revenue**: MRR, ARR, Expansion/Contraction/Churned MRR, Daily 30d chart, MRR breakdown 12m, Cash flow
3. **Growth**: LTV, CAC, LTV/CAC, Payback, LTV vs CAC line chart, New customers, Churn trend
4. **Marketing**: Conversion KPIs, Acquisition funnel, Traffic sources donut, Monthly lead capture
5. **Sales (CRM)**: Kanban pipeline 7 columns + Table view, Performance sub-tab, Lead side panel
6. **Customers**: Paying/new/lost/retention metrics, Growth chart, New vs Lost, ARPU trend
7. **Product**: Module adoption cards, Venues per module bar, Module donut
8. **Risk/Security**: SVG gauge, Severity donut, Incident types, Alert list

**7 Backend Endpoints:** overview-metrics, revenue-detailed, growth-metrics, marketing-funnel, sales-performance, customer-lifecycle, risk-dashboard
**Tested:** iteration_59 — 100% backend (42/42), 100% frontend

### Previous Completed Work
- CEO CRM Leads System (P1), Account Activation Email (P2)
- Lead Capture & Email Routing (Resend), AWS RDS Migration
- Integration Contract FROZEN v1.0, Z-index Fix, UI/UX Upgrade
- Kitchen KDS, Menu Grid, Item Modifiers, Table Mode, Manager Panel

## In Progress / Next
- **P3**: Paid access enforcement (block unpaid users)
- **P4**: Lovable ↔ Emergent final integration validation

## Future/Backlog
- Manager Panel refinement, Server History View
- PWA, Live Activity Feed, Analytics
- KDS/Bar routing, Push notifications
- Stripe Webhooks, Offline-First

## File Architecture
```
frontend/src/
├── pages/CeoPage.js              # Main shell with sidebar + ThemeToggle
├── components/
│   ├── BrandLogo.js              # Reusable brand component (navbar/footer/icon)
│   ├── SpetLogo.js               # Wrapper for backwards compatibility
│   ├── ThemeToggle.js             # Dark/Light toggle
│   └── ceo/
│       ├── shared.js              # MetricCard, ChartCard, PageHeader (semantic tokens)
│       ├── OverviewDashboard.js
│       ├── RevenueDashboard.js
│       ├── GrowthDashboard.js
│       ├── MarketingDashboard.js
│       ├── SalesDashboard.js      # CRM Kanban + Performance
│       ├── CustomersDashboard.js
│       ├── ProductDashboard.js
│       └── RiskDashboard.js
├── contexts/ThemeContext.js        # Theme state + useTheme hook
├── index.css                      # CSS tokens (:root/.light/.dark)
backend/routes/ceo.py              # All CEO endpoints (22+)
```

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
