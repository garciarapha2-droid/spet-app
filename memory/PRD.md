# Spet - Nightlife Management Platform

## Original Problem Statement
Build a multi-page "Owner Command Center" and "Pulse" module for a nightlife management application. The user provides highly detailed, pixel-perfect design specifications for each page. The workflow: receive spec -> implement -> verify visually -> await next spec.

## User Personas
- **Owner**: Accesses the Owner Command Center for business analytics, staff management, financial overview
- **Manager**: Accesses the Manager Dashboard for operational management, staff, tables, shift operations
- **Pulse Operator**: Accesses Pulse module for real-time guest check-in, bar POS, rewards

## Core Requirements
- Spec-driven, pixel-perfect UI implementation
- Mock data-driven frontend (no backend APIs yet)
- Brazilian locale (R$ currency, pt-BR formatting)
- Dark/light theme support via CSS variables
- Unified GlobalNavbar across all modules

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion + Recharts
- **Backend**: FastAPI (minimal, auth only currently)
- **Database**: MongoDB (auth only)
- **Data**: Mock data files (`ownerData.js`, `pulseData.js`, `managerModuleData.js`, `ownerShiftStaffData.js`)

## What's Been Implemented

### Global
- [x] GlobalNavbar.js - unified navbar for Owner, Manager, Pulse modules
- [x] Favicon and browser tab title ("Spet - Demo Club")
- [x] Auth flow (login/signup)

### Owner Module
- [x] OwnerLayout.js with collapsible sidebar
- [x] Overview dashboard
- [x] Revenue Analytics (complex multi-level scope selector)
- [x] Profit Analysis, Comparison, Time Analysis pages
- [x] **Shift vs Operations** — REBUILT from spec (2026-03-24): Period filter (Today/Yesterday/This Week/Custom+Calendar), 5 KPI cards with tooltips & drill-down modals, Staff Earnings table with footer totals & clickable rows, Day Performance table, Staff Detail modal, R$ currency, reconciliation-guaranteed data
- [x] **Staff & Roles** — REBUILT from spec (2026-03-24): Search + venue filter, System Users section, Operational Staff with role badges & hover actions, Add/Edit/Delete Staff dialog, avatar colors, R$ hourly rates
- [x] Customer Intelligence, Audience Intelligence, Segments, Churn & Retention
- [x] Customer Profile page
- [x] Loyalty Performance, Campaign Performance
- [x] Financial Overview, Cost Analysis, Venue Cost Detail, Risk & Alerts
- [x] Smart Insights, Action Center
- [x] Venue Management, Venue Detail, Event Detail
- [x] Settings

### Manager Module
- [x] ManagerLayout.js with sidebar
- [x] All Manager sub-pages (Overview, Staff, Tables, Menu, Shift, Tips, NFC, Reports, Loyalty)

### Pulse Module
- [x] PulseLayout with GlobalNavbar
- [x] PulseGuest (guest check-in/entry page, v2 redesign)
- [x] PulseBarPage (3-column POS)
- [x] PulseInsidePage, PulseExitPage, PulseRewardsPage
- [x] GuestRegistrationPanel (slide-in form)

## Prioritized Backlog

### P0 - Awaiting Next User Spec
- Pulse Inside (managing guests currently inside)
- Profit Analysis enhancements
- Venue Cost Detail enhancements
- Manager module sidebar refinements

### P1
- CEO Module (navbar link, role-gated)
- GuestFullHistory.js integration into Manager and Pulse

### P2
- Backend API integration (replace all mock data)
- CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)

### P3
- Refactor ownerData.js into smaller domain-specific files

## Test Credentials
- Owner/Manager/Pulse: `teste@teste.com` / `12345`

## Key Technical Notes
- For animated lists, always use `flex flex-col gap-*` (NOT `space-y-*`)
- All page headers handled by GlobalNavbar.js
- User responds in Portuguese; agent must also respond in Portuguese
- Financial reconciliation rules MUST hold: sum(staffRows.wages)=staffCost KPI, sum(dayRows.revenue)=revenue KPI, etc.
- Currency format: R$ with pt-BR locale (dot as thousands separator)

## Files of Reference
- `/app/frontend/src/pages/owner/performance/OwnerShiftOperations.js` — New Shift page
- `/app/frontend/src/pages/owner/performance/OwnerStaff.js` — New Staff page
- `/app/frontend/src/data/ownerShiftStaffData.js` — Mock data (reconciliation-guaranteed)
- `/app/frontend/src/App.js` — Routes
- `/app/frontend/src/pages/owner/OwnerLayout.js` — Sidebar
- `/app/frontend/src/components/shared/GlobalNavbar.js` — Breadcrumbs

## Test Reports
- `/app/test_reports/iteration_83.json` — 15/15 tests passed (100%)
