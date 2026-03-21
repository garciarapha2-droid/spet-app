# SPET CEO Operational Intelligence Platform — PRD

## Original Problem Statement
Build a comprehensive CEO/Owner operational intelligence platform for venue management with modules for Pulse (real-time ops), TAP (point-of-sale), TABLE (reservations), KDS (kitchen), Manager Dashboard, and Owner Command Center. Strict spec-driven development with mock-data-first approach.

## Core Architecture
- **Frontend**: React 18 + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT-based with role-based access (CEO, Owner, Manager, Staff)
- **CRITICAL**: Use `flex flex-col gap-*` instead of `space-y-*` for vertical lists

## Modules Implemented
1. Onboarding Wizard (10 steps) — COMPLETE
2. Pulse Module — COMPLETE (mock data)
3. TAP Module — COMPLETE (mock data)
4. TABLE Module — COMPLETE (mock data)
5. KDS Module — COMPLETE (mock data, rewritten twice to spec)
6. CEO Dashboard — COMPLETE (mock data)
7. Manager Dashboard (16 pages) — COMPLETE (mock data)
8. Owner Command Center (24+ pages) — PHASES 1+2 COMPLETE (mock data)

## Pixel-Perfect Page Rewrites (Current Session)
- **LoyaltyPerformance.js** — 4 KPIs, Tier Distribution chart, Revenue by Tier, Tier Detail panel, Growth Opportunity (iteration_76: 11/11 pass)
- **AudienceIntelligence.js** — KPIs, horizontal chart with toggles, Genre Breakdown, Age/Gender, Segments, Radar, Insights (iteration_77: 13/13 pass)
- **CustomerProfile.js** — Standalone: Header/badges, AI Behavior Summary, 6 KPIs, Risk Alert variants, Venue/Category Breakdowns, Timelines, Loyalty, Purchase History (iteration_78: 19/19 pass)
- **AudienceGenreDetail.js** — Dynamic template for 6 genres: Consumption/Brand Drill-down, Audience Behavior/Composition, Products, Insights, Actions (iteration_79: 17/17 pass)
- **OwnerLayout.js** — Dynamic genre title: "{GenreName} — Genre Intelligence"
- **TimeAnalysis.js** — Period filter pills, 4 KPIs, Revenue by Hour (blue)/Day (amber) charts, Peak vs Dead Hours (iteration_80: 15/15 pass)
- **VenueComparison.js** — Venue/Night mode toggle, Period filter, Revenue+Profit grouped chart, Venue cards with badges, Night cards list (iteration_81: 17/17 pass)

## Key Routes
- `/owner` — Owner Command Center
- `/owner/performance/revenue|profit|venues|time`
- `/owner/customers/intelligence|audience|segments|churn`
- `/owner/customers/:guestId` — Customer Profile
- `/owner/customers/audience/:genreSlug` — Genre Detail (6 genres)
- `/owner/growth/loyalty|campaigns`
- `/owner/finance/overview|costs|risk`
- `/owner/insights/smart|actions`
- `/owner/system/venues|settings`

## Test Credentials
- Owner: teste@teste.com / 12345

## Prioritized Backlog

### P0 — Next (user mentioned specs incoming)
- Revenue Analytics spec
- Profit Analysis spec
- Financial Overview spec
- Segments spec
- Churn & Retention spec
- Customer Intelligence spec

### P1
- Phase 5: GuestFullHistory integration in Manager module
- Content for remaining placeholder pages
- API Integration: Connect to real backend

### P2
- CEO Dashboard endpoints
- Subscription/team invite APIs

### P3
- Refactor LandingPage.js
- Remove ManagerPage.legacy.js
