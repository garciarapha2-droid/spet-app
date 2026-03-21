# SPET CEO Operational Intelligence Platform — PRD

## Original Problem Statement
Build a comprehensive CEO/Owner operational intelligence platform for venue management with modules for Pulse (real-time ops), TAP (point-of-sale), TABLE (reservations), KDS (kitchen), Manager Dashboard, and Owner Command Center. Strict spec-driven development with mock-data-first approach.

## Core Architecture
- **Frontend**: React 18 + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT-based with role-based access (CEO, Owner, Manager, Staff)

## Modules Implemented

### 1. Onboarding Wizard (10 steps) — COMPLETE
### 2. Pulse Module — COMPLETE (mock data)
### 3. TAP Module — COMPLETE (mock data)
### 4. TABLE Module — COMPLETE (mock data)
### 5. KDS Module — COMPLETE (mock data)
### 6. CEO Dashboard — COMPLETE (mock data)
### 7. Manager Dashboard (16 pages) — COMPLETE (mock data)
  - Tested: iteration_73.json — 100% pass

### 8. Owner Command Center (24+ pages) — PHASE 1+2 COMPLETE (mock data)
  - **Layout**: Collapsible sidebar with grouped navigation, breadcrumbs, theme toggle
  - **Overview**: KPIs, Venue Performance, Retention & Loyalty, AI Business Overview, Top Customers, Smart Insights, Attention Points, Action Center
  - **Performance** (4 pages): Revenue Analytics, Profit Analysis, Venue Comparison, Time Analysis — FULLY IMPLEMENTED
  - **Customers** (6 pages): Customer Intelligence, Audience Intelligence, Segments, Churn & Retention, Customer Profile (GuestFullHistory), Audience Genre Detail — FULLY IMPLEMENTED
  - **Growth** (2 pages): Loyalty Performance, Campaign Performance — FULLY IMPLEMENTED
  - **Finance** (4 pages): Financial Overview, Cost Analysis, Venue Cost Detail, Risk Alerts — FULLY IMPLEMENTED
  - **Insights** (2 pages): Smart Insights, Action Center — FULLY IMPLEMENTED
  - **System** (4 pages): Venue Management, Venue Detail, Event Detail, Owner Settings — FULLY IMPLEMENTED
  - **Canonical GuestFullHistory**: Shared component at `/app/frontend/src/components/shared/GuestFullHistory.js`
  - Tested: iteration_74.json — 100% pass (29/29 features)

## Bug Fixes Completed
- Module access for teste@teste.com corrected (TAP, KDS enabled; CEO hidden)
- "Modules" dropdown removed from main header
- "CEO (Locked)" card hidden from non-CEO users in PulseHeader

## Key Routes
- `/owner` — Owner Command Center (new module, replaces legacy)
- `/owner/performance/revenue|profit|venues|time`
- `/owner/customers/intelligence|audience|segments|churn`
- `/owner/customers/:guestId` — Guest Full History
- `/owner/customers/audience/:genreSlug` — Genre Detail
- `/owner/growth/loyalty|campaigns`
- `/owner/finance/overview|costs|risk`
- `/owner/finance/costs/:venueName` — Venue Cost Detail
- `/owner/insights/smart|actions`
- `/owner/system/venues|settings`
- `/owner/system/venues/:venueId` — Venue Detail
- `/owner/system/venues/:venueId/events/:eventId` — Event Detail

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Owner: teste@teste.com / 12345
- Onboarding: teste1@teste.com / 12345

## Prioritized Backlog

### P0 — In Progress
- Phase 5: System-wide Guest Profile integration (Manager + Pulse modules)

### P1
- API Integration: Connect all modules to real backend APIs
- CEO Dashboard endpoint: `/api/ceo/conversion-rates`
- Pixel-perfect Signup Page

### P2
- Additional CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)
- Subscription and team invite management APIs

### P3
- Refactor LandingPage.js
- Remove ManagerPage.legacy.js
- Rename OwnerPage.js → OwnerPage.legacy.js (already done)
- Pricing card alignment (user verification pending)
