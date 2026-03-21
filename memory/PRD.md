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
### 5. KDS Module — COMPLETE (mock data, rewritten twice to spec)
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

### 9. Global Design System & Spacing Standard — COMPLETE
  - Created `/app/design-system.md` with full spacing rules
  - Applied across Owner (24 pages), Manager (17 pages), Pulse (7 pages), shared components
  - Standard: Card→Card 16px (gap-4), Sections 24px (mb-6), Card padding 20px (p-5), Internal items 8px (gap-2), Columns 24px (gap-6), Page padding 24px (p-6)
  - **CRITICAL**: Use `flex flex-col gap-*` instead of `space-y-*` for vertical lists
  - Tested: iteration_75.json — 100% pass (18/18 features)

### 10. Pixel-Perfect Page Rewrites — COMPLETE
  - **CampaignPerformance.js** — Rewritten to detailed spec (2025-03-21)
  - **CostAnalysis.js** — Rewritten to detailed spec (2025-03-21)
  - **LoyaltyPerformance.js** — Rewritten to detailed spec (2025-03-21)
    - Tested: iteration_76.json — 100% pass (11/11 features)
    - Features: 4 KPIs, Tier Distribution chart, Revenue by Tier bars, expandable Tier Detail Panel, guest navigation, Growth Opportunity insight

## Canonical Guest Full History Component
**Location**: `/app/frontend/src/components/shared/GuestFullHistory.js`
**Exports**: `default` (full page), `CustomerProfileModal` (modal preview)
**Used in**: Owner customers, Pulse guest profile (via "View Full History" link)

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

## Design System Reference
- `/app/design-system.md` — Full spacing rules, tokens, typography, components

## Prioritized Backlog

### P0 — Next
- Specs for Campaign Performance rewrite (user mentioned, pending details)
- Specs for Financial Overview rewrite (user mentioned, pending details)
- Phase 5: System-wide Guest Profile integration (Manager Loyalty → Guests uses GuestFullHistory)

### P1
- Content implementation for placeholder pages (Phases 3 & 4)
- API Integration: Connect all modules to real backend APIs
- CEO Dashboard endpoint: `/api/ceo/conversion-rates`
- Pixel-perfect Signup Page

### P2
- Additional CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)
- Subscription and team invite management APIs

### P3
- Refactor LandingPage.js
- Remove ManagerPage.legacy.js
- Pricing card alignment
