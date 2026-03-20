# SPET CEO Operating System — PRD

## Original Problem Statement
Build a premium, multi-dashboard "CEO Operating System" with pixel-perfect UI implementation following detailed design specifications. The app includes a landing page, auth flow, venue dashboard, CEO dashboard, and the Pulse operational module.

## Core Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB
- **Auth**: JWT-based authentication with protected test accounts
- **Theme**: CSS custom properties (HSL tokens) with data-theme light/dark toggle

## User Personas
- **CEO**: Platform admin with access to all dashboards (`garcia.rapha2@gmail.com` / `12345`)
- **Standard User**: Venue operator with module access (`teste@teste.com` / `12345`)
- **Onboarding User**: New user in setup flow (`teste1@teste.com` / `12345`)

## Implemented Features

### Landing Page
- Full marketing landing page with pricing cards
- File: `frontend/src/pages/landing/LandingPage.js` (750+ lines, refactor planned)

### Auth Flow
- Login, Signup, Onboarding pages
- Protected routes with role-based access
- Axios interceptor for API response envelope unwrapping

### Venue Home (Dashboard)
- Pixel-perfect implementation from design spec
- File: `frontend/src/pages/venue/VenueHomePage.js`

### CEO Dashboard
- Sidebar navigation with 12 dashboard pages (mostly placeholders with mock data)
- Revenue Targets component
- File: `frontend/src/pages/CeoPage.js` + `frontend/src/components/ceo/`

### Pulse Guest Check-in (2026-03-20)
- Implementation + Visual Audit completed
- Files: `PulseLayout.js`, `GuestRegistration.js`, `PulseGuest.js`
- CSS scope `.pulse-scope` for isolated styling

### TAP & TABLE Modules — Architecture Correction (2026-03-20)
**TAP and TABLE are independent modules, NOT part of Pulse.**

#### What was done:
- Created shared component `src/components/orders/TapTableView.js` with all visual/spec from the TAP & TABLE redesign
- TAP lives at `/tap` as its own module
- TABLE lives at `/table` as its own module
- Both use bidirectional toggle (TAP ↔ TABLE) with animated mode switcher and URL sync
- Removed "Orders" tab from Pulse module (`PulseLayout.js`)
- `/pulse/bar` now redirects to `/tap`
- Standalone navbar (brand, venue, theme toggle, home, logout)

#### Files:
- `src/components/orders/TapTableView.js` — Shared visual component (standalone, no PulseLayout)
- `src/pages/TapPage.js` — Thin wrapper: `<TapTableView defaultMode="tap" />`
- `src/pages/TablePage.js` — Thin wrapper: `<TapTableView defaultMode="table" />`
- `src/data/pulseData.js` — Mock data for TAP/TABLE

#### Routes:
| Module | Route | Default Mode |
|--------|-------|-------------|
| TAP | `/tap` | tap |
| TABLE | `/table` | table |
| Legacy | `/pulse/bar` | Redirects to `/tap` |

#### Note: Currently using MOCK data from `pulseData.js`. Real API integration is a future task.

## Design System
- CSS custom properties with HSL tokens in `:root` / `[data-theme]`
- **Pulse scope** (`.pulse-scope`): `--radius: 0.875rem`, `text-xs: 12px`
- Font families: Inter (UI), Space Grotesk (brand)
- Primary: `258 75% 58%` (#7C3AED purple)
- Success: `160 84% 39%` (#10B981 green)
- Destructive: `0 62% 50%` (#CE2D2D red)

## Prioritized Backlog

### P1 (Next)
- Connect TAP/TABLE to real backend APIs (replace mock data)
- Implement remaining Pulse module pages (/pulse/inside, /pulse/exit, /pulse/rewards)
- Connect CEO dashboards to real backend APIs
- Implement /api/ceo/conversion-rates endpoint
- Apply pixel-perfect UI to Signup Page

### P2
- Implement P3 CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)
- Subscription management APIs
- Team invite system

### P3
- Refactor LandingPage.js into smaller components
- Pricing card alignment (user verification pending, recurrence count: 3)

## Known Issues
- TAP/TABLE modules use MOCK data (hardcoded in pulseData.js)
- Most CEO dashboard pages use placeholder/mock data
- LandingPage.js is monolithic (750+ lines)
- Pulse Guest Check-in uses MOCK guest data
