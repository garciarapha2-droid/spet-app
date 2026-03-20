# SPET CEO Operating System — PRD

## Original Problem Statement
Build a premium, multi-dashboard "CEO Operating System" with pixel-perfect UI implementation following detailed design specifications. The app includes a landing page, auth flow, venue dashboard, CEO dashboard, and the Pulse operational module.

## Core Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + PostgreSQL
- **Auth**: JWT-based authentication with protected test accounts
- **Theme**: CSS custom properties (HSL tokens) with data-theme light/dark toggle

## User Personas
- **CEO**: Platform admin with access to all dashboards (`garcia.rapha2@gmail.com` / `12345`)
- **Standard User**: Venue operator with module access (`teste@teste.com` / `12345`)
- **Onboarding User**: New user in setup flow (`teste1@teste.com` / `12345`)

## Implemented Features

### Landing Page ✅
- Full marketing landing page with pricing cards
- File: `frontend/src/pages/landing/LandingPage.js` (750+ lines, refactor planned)

### Auth Flow ✅
- Login, Signup, Onboarding pages
- Protected routes with role-based access
- Axios interceptor for API response envelope unwrapping

### Venue Home (Dashboard) ✅
- Pixel-perfect implementation from design spec
- File: `frontend/src/pages/venue/VenueHomePage.js`

### CEO Dashboard ✅
- Sidebar navigation with 12 dashboard pages (mostly placeholders with mock data)
- Revenue Targets component
- File: `frontend/src/pages/CeoPage.js` + `frontend/src/components/ceo/`

### Pulse Guest Check-in ✅ (2026-03-20)
- New page at `/pulse/guest` with dedicated PulseLayout
- KPI cards (Inside, Entries, Denied) with gradient backgrounds and stagger animations
- NFC scan/search input with focus glow effect
- Manual entry button with hover/tap animations
- Guest list with avatar initials, tier badges, tab numbers, spent amounts
- Slide-in registration panel with avatar camera/upload, form fields, NFC prefill
- Full theme support (light + dark mode)
- Framer Motion animated tab pill in navbar (layoutId spring animation)
- Files created:
  - `frontend/src/components/pulse/PulseLayout.js`
  - `frontend/src/components/pulse/GuestRegistration.js`
  - `frontend/src/pages/pulse/PulseGuest.js`
- Files modified:
  - `frontend/src/index.css` (added success/warning/danger tokens, shadow-card, font-feature-settings, Inter weight 900)
  - `frontend/tailwind.config.js` (added success color, 2xl border radius)
  - `frontend/src/App.js` (added /pulse/guest route, updated /pulse redirect)

## Design System
- CSS custom properties with HSL tokens in `:root` / `[data-theme]`
- Font families: Inter (UI), Space Grotesk (brand)
- Primary: `258 75% 58%` (#7C3AED purple)
- Success: `160 84% 39%` (#10B981 green)
- Destructive: `0 62% 50%` (#CE2D2D red)
- Radius: 0.5rem (global), explicit 2xl=16px for Pulse cards

## Prioritized Backlog

### P0 (Done)
- ✅ Pulse Guest Check-in page

### P1 (Next)
- Implement remaining Pulse module pages (/pulse/inside, /pulse/bar, /pulse/exit, /pulse/rewards) with new PulseLayout
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
- Most CEO dashboard pages use placeholder/mock data
- LandingPage.js is monolithic (750+ lines)
- Pricing card alignment (low priority, user moved on)
