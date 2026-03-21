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

### 8. Owner Command Center (24+ pages) — PHASES 1+2 COMPLETE (mock data)
  - **Layout**: Collapsible sidebar with grouped navigation, breadcrumbs, theme toggle
  - **Sidebar**: Uses CSS variables (--sidebar-background, etc.) — LIGHT in light mode, DARK in dark mode
  - **Overview**: KPIs, Venue Performance, Retention & Loyalty, AI Business Overview, Top Customers, Smart Insights, Attention Points, Action Center
  - **Performance** (4 pages): Revenue Analytics, Profit Analysis, Venue Comparison, Time Analysis
  - **Customers** (6 pages): Customer Intelligence, Audience Intelligence, Segments, Churn & Retention, Customer Profile (GuestFullHistory), Audience Genre Detail
  - **Growth** (2 pages): Loyalty Performance, Campaign Performance
  - **Finance** (4 pages): Financial Overview, Cost Analysis, Venue Cost Detail, Risk Alerts
  - **Insights** (2 pages): Smart Insights, Action Center
  - **System** (4 pages): Venue Management (list + nights toggle), Venue Detail, Event Detail, Owner Settings
  - Tested: iteration_74.json — 100% pass (29/29 features)

### Spec Alignment Fixes Applied (Phase 1+2 Polishing)
  - **Venues page**: Rewrote to LIST layout (stacked horizontal rows), added top controls (Venues / Nights toggle + Period selector), building icon in purple circle, ACTIVE badge, proper metric labels
  - **Nights/Events view**: Events grouped by venue header, ordered by date, calendar icon per event
  - **Guest Full History (canonical)**: Rewrote with exact spec structure: Header (avatar, name, badges, Send Reward black btn, Message outline btn), Behavior Summary (4 stat boxes, insight bar), KPI cards (icon top, value large, label BOTTOM), HEALTHY banner, Venue Breakdown (colored pills ON bars), Category Breakdown (colored pills ON bars), Events Attended (click subtitle), Visit Timeline (STACKED BAR CHART with venue colors), Loyalty Activity (table rows with date right, balance far right), Purchase History (full width, generous spacing)
  - **Sidebar light theme**: Fixed CSS variables so sidebar is LIGHT when content is LIGHT (both Owner and Manager)
  - **Pulse integration**: Added "View Full History" button in Pulse GuestProfilePage linking to canonical GuestFullHistory

## Canonical Guest Full History Component
**Location**: `/app/frontend/src/components/shared/GuestFullHistory.js`
**Exports**: `default` (full page), `CustomerProfileModal` (modal preview)
**Used in**: Owner customers, Pulse guest profile (via "View Full History" link)
**Sections**: Header, Behavior Summary, KPI Cards, Health Banner, Venue Breakdown, Category Breakdown, Events Attended, Visit Timeline (chart), Loyalty Activity, Purchase History

## Key Routes
- `/owner` — Owner Command Center
- `/owner/performance/revenue|profit|venues|time`
- `/owner/customers/intelligence|audience|segments|churn`
- `/owner/customers/:guestId` — Guest Full History
- `/owner/customers/audience/:genreSlug`
- `/owner/growth/loyalty|campaigns`
- `/owner/finance/overview|costs|risk`
- `/owner/finance/costs/:venueName`
- `/owner/insights/smart|actions`
- `/owner/system/venues|settings`
- `/owner/system/venues/:venueId`
- `/owner/system/venues/:venueId/events/:eventId`

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Owner: teste@teste.com / 12345
- Onboarding: teste1@teste.com / 12345

## Prioritized Backlog

### P0 — Next
- Phase 5: System-wide Guest Profile integration (Manager Loyalty → Guests uses GuestFullHistory)

### P1
- API Integration: Connect all modules to real backend APIs
- CEO Dashboard endpoint: `/api/ceo/conversion-rates`
- Pixel-perfect Signup Page

### P2
- Additional CEO Dashboard endpoints
- Subscription and team invite management APIs

### P3
- Refactor LandingPage.js
- Remove ManagerPage.legacy.js
- Pricing card alignment
