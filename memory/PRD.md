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
### 8. Owner Command Center (24+ pages) — PHASES 1+2 COMPLETE (mock data)

## Recent Pixel-Perfect Page Rewrites (this session)
- **LoyaltyPerformance.js** — 4 KPIs, Tier Distribution chart, Revenue by Tier bars, Tier Detail panel, Growth Opportunity
  - Tested: iteration_76.json — 100% pass
- **AudienceIntelligence.js** — 4 KPIs, Event & Genre Performance horizontal chart with toggles, Genre Breakdown, Age/Gender Distribution, Consumption by Segment, Radar Chart, Insights, Actions
  - Tested: iteration_77.json — 100% pass
- **CustomerProfile.js** — Complete standalone rewrite (replaces GuestFullHistory wrapper): Header with badges/CTAs, AI Behavior Summary, 6 KPIs, Retention Risk Alert (low/medium/high variants), Venue/Category Breakdowns, Events Attended, Event/Visit Timelines, Loyalty Activity, Purchase History
  - Tested: iteration_78.json — 100% pass
- **AudienceGenreDetail.js** — Dynamic genre template: 6 KPIs, Consumption Breakdown with toggles, Categories list, Brand Drill-down (expandable), Audience Behavior + age bars, Audience Composition donut + retention split, Top Products (context-aware), Smart Insights, Recommended Actions. Supports 6 genres: techno, house, hiphop, latin, rnb-soul, pop-commercial
  - Tested: iteration_79.json — 100% pass
- **OwnerLayout.js** — Dynamic genre title: "{GenreName} — Genre Intelligence" with "Customers › Audience" subtitle

## Design System
- `/app/design-system.md` — Full spacing rules, tokens, typography
- **CRITICAL**: Use `flex flex-col gap-*` instead of `space-y-*`

## Key Routes
- `/owner` — Owner Command Center
- `/owner/customers/audience/:genreSlug` — Genre Detail (dynamic)
- `/owner/customers/:guestId` — Customer Profile

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Owner: teste@teste.com / 12345

## Prioritized Backlog

### P0 — Next (user mentioned specs)
- Spec for Segments page
- Spec for Churn & Retention page
- Spec for Customer Intelligence page

### P1
- Phase 5: System-wide Guest Profile integration (Manager Loyalty → Guests)
- Content implementation for remaining placeholder pages
- API Integration: Connect all modules to real backend APIs

### P2
- CEO Dashboard endpoints
- Subscription and team invite management APIs

### P3
- Refactor LandingPage.js
- Remove ManagerPage.legacy.js
- Pricing card alignment
