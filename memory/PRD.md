# SPET CEO Operating System — PRD

## Original Problem Statement
Build a premium, multi-dashboard "CEO Operating System" with pixel-perfect UI implementation following detailed design specifications. The app includes a landing page, auth flow, venue dashboard, CEO dashboard, the Pulse operational module, and independent TAP/TABLE order modules.

## Core Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT-based authentication with protected test accounts
- **Theme**: CSS custom properties (HSL tokens) with data-theme light/dark toggle

## User Personas
- **CEO**: Platform admin with access to all dashboards (`garcia.rapha2@gmail.com` / `12345`)
- **Standard User**: Venue operator with module access (`teste@teste.com` / `12345`)
- **Onboarding User**: New user in setup flow (`teste1@teste.com` / `123456`)

## Implemented Features

### Landing Page
- Full marketing landing page with pricing cards
- File: `frontend/src/pages/landing/LandingPage.js` (750+ lines, refactor planned)

### Auth Flow
- Login, Signup, Onboarding pages
- Protected routes with role-based access

### Venue Home (Dashboard)
- Pixel-perfect implementation from design spec

### CEO Dashboard
- Sidebar navigation with 12 dashboard pages (mostly placeholders with mock data)

### Pulse Module — All 5 Pages Complete (2026-03-20)
All pages use `PulseLayout` with consistent navbar, tab navigation, design system.

| Page | Route | Component | Status |
|------|-------|-----------|--------|
| Check-in | `/pulse/guest` | PulseGuest.js | Done (pixel-perfect spec) |
| Inside (Live Floor) | `/pulse/inside` | PulseInsidePage.js | Done |
| Orders (TAP-only) | `/pulse/bar` | PulseBarPage.js | Done (embedded TapTableView) |
| Exit (Check Out) | `/pulse/exit` | PulseExitPage.js | Done |
| Membership | `/pulse/rewards` | PulseRewardsPage.js | Done |

### TAP & TABLE — Independent Modules (2026-03-20)
**Architecture**: TAP and TABLE are NOT part of Pulse. They are standalone modules.

| Module | Route | Mode | Mode Switcher |
|--------|-------|------|---------------|
| TAP | `/tap` | tap (default) | Bidirectional TAP/TABLE toggle |
| TABLE | `/table` | table (default) | Bidirectional TAP/TABLE toggle |

**Shared component**: `components/orders/TapTableView.js` supports both standalone and embedded modes.

**Business Rules**:
- TAP mode: No age verification. Identity verification (photo + name) required before confirming order (anti-fraud)
- TABLE mode: Age verification for alcoholic items, once per table session. No identity verification.

## Design System
- CSS custom properties with HSL tokens
- **Pulse scope** (`.pulse-scope`): `--radius: 0.875rem`, `text-xs: 12px`
- Font families: Inter (UI), Space Grotesk (brand)
- Primary: `258 75% 58%` (#7C3AED purple)

## Prioritized Backlog

### P1 (Next)
- Connect TAP/TABLE and Pulse to real backend APIs (replace mock data)
- Implement /api/ceo/conversion-rates endpoint
- Pixel-perfect Signup Page

### P2
- CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)
- Subscription management APIs
- Team invite system
- Manager-configurable identity verification rule

### P3
- Refactor LandingPage.js into smaller components
- Pricing card alignment (user verification pending)

## Known Issues
- All Pulse pages and TAP/TABLE use MOCK data
- CEO dashboard pages mostly placeholders
- LandingPage.js is monolithic (750+ lines)
