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
**Implementation + Visual Audit completed.**

#### Files Created:
- `frontend/src/components/pulse/PulseLayout.js` — Navbar with animated tabs, brand logo, venue selector, theme toggle, logout
- `frontend/src/components/pulse/GuestRegistration.js` — Slide-in panel with avatar camera/upload, form fields, NFC prefill
- `frontend/src/pages/pulse/PulseGuest.js` — Main page with KPI cards, NFC scan, manual entry, guest list
- `frontend/src/assets/spet-icon.png` — Brand icon asset

#### Files Modified:
- `frontend/src/App.js` — Added /pulse/guest route, updated /pulse redirect
- `frontend/src/index.css`:
  - Google Fonts: Inter weight 900 added
  - `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'` on body
  - Added tokens: --success, --success-foreground, --warning, --warning-foreground, --danger, --danger-foreground, --shadow-card, --shadow-card-hover (both light and dark)
  - **Pulse scope CSS**: `.pulse-scope` with `--radius: 0.875rem` and `text-xs` reset to 12px
- `frontend/tailwind.config.js` — Added success color, 2xl border radius (16px)

#### Visual Audit — Issues Found & Fixed:
| # | Issue | Root Cause | Fix Applied |
|---|-------|-----------|-------------|
| 1 | Tab pills too squared (8px vs 14px) | Global --radius: 0.5rem | `.pulse-scope { --radius: 0.875rem }` |
| 2 | Small text 13px instead of 12px | Global `.text-xs` override | `.pulse-scope .text-xs { font-size: 0.75rem }` |
| 3 | Headings with tight letter-spacing | Global `h2 { letter-spacing: -0.03em }` | Added `tracking-normal` to h2 elements |
| 4 | Global element-level letter-spacing | `p,span,div { letter-spacing: -0.011em }` | Minimal impact (~0.15px), accepted |

## Design System
- CSS custom properties with HSL tokens in `:root` / `[data-theme]`
- **Pulse scope** (`.pulse-scope`): `--radius: 0.875rem`, `text-xs: 12px`
- Font families: Inter (UI), Space Grotesk (brand)
- Primary: `258 75% 58%` (#7C3AED purple)
- Success: `160 84% 39%` (#10B981 green)
- Destructive: `0 62% 50%` (#CE2D2D red)

## Prioritized Backlog

### P1 (Next)
- Implement remaining Pulse module pages (/pulse/inside, /pulse/bar, /pulse/exit, /pulse/rewards)
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
- Pulse Guest Check-in uses MOCK guest data (hardcoded in component)
