# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards.

## Architecture
- **Lovable** = public experience (landing, signup, login, checkout)
- **Emergent** = protected SaaS app + backend API
- **Database**: AWS RDS PostgreSQL (us-east-2) — persistent, production-grade
- **MongoDB**: Local (config/catalog)
- **Email**: Resend (spetapp.com verified domain)
- Integration contract FROZEN v1.0 — see `/app/INTEGRATION_CONTRACT.md`

## Completed Features

### CEO Dashboard Premium UX Refinement (March 2026)
- **Deep UX refinement** of the entire CEO Dashboard — from "working template" to "investor-ready product"
- **CRM Section**: Kanban + Table + Reports views with search, source filters, and side panel detail views
  - Kanban: 7 status columns with drag-and-drop, rich cards (company, tags, dates, payment status)
  - Table: Sortable lead table with inline badges
  - Reports: Sales funnel (trapezoid), donut chart (status distribution), bar chart (leads over time), source performance
- **Business Health**: 8 SaaS KPI cards (MRR, Customers, Churn Rate, Activation Rate, ARPC, Revenue Today/YTD)
  - Growth banner with MoM comparison
  - KPI drill-down side panel with venue-level breakdown
- **Revenue & Profit**: Area chart with gradient fill, period selector (Week/Month/Year), 4 financial KPI cards
- **Companies**: Company list with MRR, status badges, module indicators. Side panel for status/module management
- **Module Adoption**: 4 module cards with adoption %, horizontal bar chart (recharts)
- **Users**: User list with avatar, status/role badges, last login. Create user form. Side panel for edit/delete
- **Risk & Alerts**: Alert cards with severity indicators (critical/warning)
- **Pipeline**: Funnel visualization (trapezoid shape) + 3 KPI summary cards
- **Side Panel**: Animated slide-in/out (250ms), consistent across all sections
- **Sidebar**: Revenue targets with progress bars, dark-active nav tabs
- **Charts**: Powered by recharts (AreaChart, BarChart, PieChart, LineChart)
- **Tested**: iteration_58 — 100% backend (18/18), 100% frontend

### P1: CEO CRM / Leads Management (March 2026)
- **`GET /api/ceo/leads`** — fetches all leads with company/venue join
- **`PUT /api/ceo/leads/{id}/status`** — update status, payment_status, notes
- CEO-only access (403 for non-CEO users)
- Tested iteration_57: 100% backend (13/13), 100% frontend

### P2: Account Activation Email (March 2026)
- `services/activation_email.py` — sends from `access@spetapp.com`
- HTML template with welcome, email, company, plan, CTA button

### Lead Capture & Email Routing
- `POST /api/leads/capture` — unified endpoint
- Email routing: signup→leads@, contact→contact@, support→support@spetapp.com
- PostgreSQL `leads` table with 12 columns

### AWS RDS Migration
- 18 tables on AWS RDS
- Protected users + demo data seeded on startup

### Integration Contract (FROZEN v1.0)
- See `/app/INTEGRATION_CONTRACT.md`

### Other Completed
- UI/UX Color System Upgrade
- Kitchen KDS + Menu Grid
- Item Modifiers + Priced Extras
- ID Verification
- Table Mode Server Consistency
- Manager Panel
- Protected Users System
- Z-index Dropdown Bug Fix

## In Progress / Next
- **P3**: Paid access enforcement (block unpaid users, bypass for protected accounts)
- **P4**: Lovable ↔ Emergent final integration validation

## Future/Backlog
- Manager Panel refinement
- Server History View
- PWA, Live Activity Feed, Analytics
- KDS/Bar routing, Push notifications
- Stripe Webhooks, Offline-First

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
