# SPET CEO Operating System — PRD

## Original Problem Statement
Build a premium, multi-dashboard "CEO Operating System" with pixel-perfect UI implementation following detailed design specifications. The app includes a landing page, auth flow, venue dashboard, CEO dashboard, the Pulse operational module, independent TAP/TABLE order modules, a comprehensive onboarding wizard, and a complete Manager Dashboard module.

## Core Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion + Recharts
- **Backend**: FastAPI + MongoDB + PostgreSQL
- **Auth**: JWT-based authentication with protected test accounts
- **Theme**: CSS custom properties (HSL tokens) with data-theme light/dark toggle

## User Personas
- **CEO**: Platform admin with access to all dashboards (`garcia.rapha2@gmail.com` / `12345`)
- **Standard User**: Venue operator with module access (`teste@teste.com` / `12345`)
- **Onboarding User**: New user in setup flow (`teste1@teste.com` / `12345`)

## Implemented Features

### Manager Dashboard Module — COMPLETE (2026-03-21)
Full 16-page manager dashboard module with collapsible sidebar, theme toggle, and mock data.

**Architecture:**
- `ManagerLayout.js` — Shell with collapsible sidebar (w-240 ↔ w-60), theme toggle, back button
- 9 top-level pages + expandable Loyalty sub-module (7 pages)
- All routes under `/manager/*`, completely isolated from other modules
- Mock data from `managerData.js` and `managerModuleData.js`

**Routes:**
| Route | Component | Description |
|-------|-----------|-------------|
| /manager | ManagerOverview | Smart Insights, KPIs, charts, alerts |
| /manager/staff | StaffRoles | System users + operational staff |
| /manager/tables | TablesByServer | Kanban board by server |
| /manager/menu | MenuProducts | Search, filter, list/grid views |
| /manager/shift | ShiftOperations | KPIs, earnings, charts, AI partner |
| /manager/tips | Tips | Staff tip cards + details table |
| /manager/guests | NfcGuests | Guest list + profile modal |
| /manager/reports | ReportsFinance | Period filters, charts, sales table |
| /manager/settings | ManagerSettings | Venue config + integrations |
| /manager/loyalty | LoyaltyRewards | Hero, KPIs, distribution chart |
| /manager/loyalty/guests | LoyaltyGuests | Filterable guest directory |
| /manager/loyalty/guests/:id | LoyaltyGuestProfile | Full profile page |
| /manager/loyalty/tiers | LoyaltyTiers | Tier cards + automation rules |
| /manager/loyalty/campaigns | LoyaltyCampaigns | Campaign list + create modal |
| /manager/loyalty/rewards | LoyaltyRewardsPage | Reward grid with toggles |
| /manager/loyalty/insights | LoyaltyInsights | Insights + actionable guests |

**Testing:** 100% pass (22/22 features tested, iteration_73.json)

### Onboarding Wizard — COMPLETE (2026-03-21)
Full 10-step onboarding wizard. Testing: 100% pass (iteration_72.json)

### Landing Page
Full marketing landing page with pricing cards

### Auth Flow
Login, Signup, Onboarding pages. Protected routes with role-based access.

### Venue Home (Dashboard)
Pixel-perfect implementation from design spec

### CEO Dashboard
Sidebar navigation with 12 dashboard pages

### Pulse Module — All 5 Pages Complete
Check-in, Inside, Orders, Exit, Membership

### TAP & TABLE — Independent Modules
TAP (identity verification), TABLE (age verification)

### Branding
Browser tab title: "SPET", "Made with Emergent" badge removed

## Design System
- CSS custom properties with HSL tokens
- Font: Inter (body), Space Grotesk (headings/brand)
- Primary: `258 75% 58%` (#7C3AED purple)

## Prioritized Backlog

### P1 (Next)
- Connect TAP/TABLE and Pulse to real backend APIs (replace mock data)
- Connect Manager Dashboard to real backend APIs
- Implement /api/ceo/conversion-rates endpoint
- Pixel-perfect Signup Page
- Manager-configurable identity verification rule

### P2
- CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)
- Subscription management APIs
- Team invite system

### P3
- Refactor LandingPage.js into smaller components
- Pricing card alignment
- Clean up ManagerPage.legacy.js (old file preserved)

## Key API Endpoints
- `POST /api/onboarding/save-config` — Save onboarding config
- `POST /api/onboarding/complete` — Mark complete
- `POST /api/onboarding/skip` — Skip onboarding

## Testing
- Manager Dashboard: 100% pass (22/22 features, iteration_73.json)
- Onboarding wizard: 100% pass (15/15 backend + all frontend, iteration_72.json)
