# SPET CEO Operating System — PRD

## Original Problem Statement
Build a premium, multi-dashboard "CEO Operating System" with pixel-perfect UI implementation following detailed design specifications. The app includes a landing page, auth flow, venue dashboard, CEO dashboard, the Pulse operational module, independent TAP/TABLE order modules, and a comprehensive onboarding wizard that serves as a system configuration engine.

## Core Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: FastAPI + MongoDB + PostgreSQL
- **Auth**: JWT-based authentication with protected test accounts
- **Theme**: CSS custom properties (HSL tokens) with data-theme light/dark toggle

## User Personas
- **CEO**: Platform admin with access to all dashboards (`garcia.rapha2@gmail.com` / `12345`)
- **Standard User**: Venue operator with module access (`teste@teste.com` / `12345`)
- **Onboarding User**: New user in setup flow (`teste1@teste.com` / `12345`)

## Implemented Features

### Onboarding Wizard — COMPLETE (2026-03-21)
Full 10-step onboarding wizard that serves as the system configuration engine.

**Architecture:**
- `OnboardingWizard.js` — Main shell with navbar, progress bar, animated transitions, step indicator dots
- Steps in `/pages/onboarding/steps/` — 10 step components
- Dynamic step insertion based on enabled modules
- Backend persistence via `/api/onboarding/save-config`, `/api/onboarding/complete`, `/api/onboarding/skip`

**Base Steps (always present):**
| Step | Component | Description |
|------|-----------|-------------|
| 1 - Welcome | WelcomeStep.js | Branding, ambient glow, "Get Started" CTA |
| 2 - Confirm Account | ConfirmAccountStep.js | Venue name + type (multi-select) |
| 3 - Role Decision | RoleDecisionStep.js | Owner/Manager role with conditional manager form |
| 4 - Initial Setup | InitialSetupStep.js | 3 internal tabs: Payments → Team → Modules |
| 10 - Finish | FinishSetupStep.js | Completion checklist + "Enter System" |

**Conditional Steps:**
| Step | Component | Condition |
|------|-----------|-----------|
| 5 - Menu Setup | PulseMenuSetup.js | pulse OR tap OR table enabled |
| 6 - Rewards Setup | PulseRewardsSetup.js | pulse enabled |
| 7 - Table Setup | TableSetup.js | table enabled |
| 8 - Floor Plan | FloorPlanBuilder.js | table enabled |
| 9 - Reservations | ReservationSetup.js | reservations enabled |

**Business Rules:**
- `teste1@teste.com` always lands on onboarding (reset on startup)
- New users see onboarding on first login
- After completion: redirect to system, don't show again
- After skip: mark as skipped, allow completing later
- All config persists to MongoDB and controls system behavior

**Onboarding State:** not_started | in_progress | completed | skipped

### Landing Page
- Full marketing landing page with pricing cards

### Auth Flow
- Login, Signup, Onboarding pages
- Protected routes with role-based access

### Venue Home (Dashboard)
- Pixel-perfect implementation from design spec

### CEO Dashboard
- Sidebar navigation with 12 dashboard pages

### Pulse Module — All 5 Pages Complete
| Page | Route | Status |
|------|-------|--------|
| Check-in | `/pulse/guest` | Done |
| Inside | `/pulse/inside` | Done |
| Orders | `/pulse/bar` | Done |
| Exit | `/pulse/exit` | Done |
| Membership | `/pulse/rewards` | Done |

### TAP & TABLE — Independent Modules
| Module | Route | Features |
|--------|-------|----------|
| TAP | `/tap` | Identity verification (anti-fraud) |
| TABLE | `/table` | Age verification for alcohol |

### Branding
- Browser tab title: "SPET"
- "Made with Emergent" badge removed

## Design System
- CSS custom properties with HSL tokens
- Font: Inter (body), Space Grotesk (headings/brand)
- Primary: `258 75% 58%` (#7C3AED purple)

## Prioritized Backlog

### P1 (Next)
- Connect TAP/TABLE and Pulse to real backend APIs (replace mock data)
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

## Key API Endpoints
- `POST /api/onboarding/save-config` — Save onboarding config to MongoDB
- `POST /api/onboarding/complete` — Mark complete + persist all config
- `POST /api/onboarding/skip` — Skip onboarding

## Testing
- Onboarding wizard: 100% pass (backend 15/15, frontend all 10 steps)
- Test report: `/app/test_reports/iteration_72.json`
