# SPET — Product Requirements Document

## Architecture
- **Emergent** = Full-stack app (FastAPI + PostgreSQL + MongoDB + React frontend)
- **Lovable** = Landing/marketing site only (spetapp.com)
- **No shared auth** — Emergent owns the complete authenticated experience
- **Lovable CTAs** point to Emergent app (e.g., Login → spetapp.com/login, Sign Up → spetapp.com/signup)

## Final Route Map
| Route | Access | Description |
|---|---|---|
| `/login` | Public | Login page |
| `/signup` | Public | Signup + plan selection |
| `/payment/pending` | Auth | Stripe checkout redirect |
| `/payment/success` | Auth | Payment confirmation |
| `/onboarding` | Auth+Active | Multi-step onboarding |
| `/venue/home` | Protected | Main operational dashboard |
| `/pulse/entry` | Protected | Guest entry module |
| `/tap` | Protected | Bar/tabs module |
| `/table` | Protected | Table management module |
| `/kitchen` | Protected | Kitchen Display System |
| `/manager` | Protected | Venue operations |
| `/owner` | Protected | Multi-venue analytics |
| `/ceo` | CEO only | Platform-wide metrics |
| `/app` | Protected | Auto-redirect by role |
| `/` | Any | → /login (unauth) or role-based (auth) |

## Post-Login Routing
- CEO → `/ceo`
- Onboarding incomplete → `/onboarding`
- Pending payment → `/payment/pending`
- Operational user → `/venue/home`

## Logout Flow
POST /api/auth/logout → clear tokens → redirect to `/login` (same domain)

## API Response Format
All `/api/*` endpoints return:
```json
{ "success": true|false, "data": {...}|null, "error": null|{"code":"...", "message":"..."} }
```

## Product Plans
| ID | Name | Price | Early Price | Modules | Limits |
|---|---|---|---|---|---|
| `core` | Spet Core | $79/mo | $39/mo | Pulse | 1 venue, 5 staff |
| `flow` | Spet Flow | $149/mo | $59/mo | Pulse, Tap, Table | 3 venues, 20 staff |
| `sync` | Spet Sync | $299/mo | $99/mo | Pulse, Tap, Table, KDS | 10 venues, 50 staff |
| `os` | Spet OS | $499/mo | $149/mo | All modules | Unlimited |

## Token Configuration
| Token | Lifetime |
|---|---|
| `access_token` | 1 hour |
| `refresh_token` | 30 days (single-use rotation) |

## Demo Accounts
| Email | Password | Role | Behavior |
|---|---|---|---|
| garcia.rapha2@gmail.com | 12345 | CEO | Admin, protected |
| teste@teste.com | 12345 | USER | Demo full (persistent) |
| teste1@teste.com | 12345 | USER | Demo onboarding (resets on restart) |

## Tech Stack
- FastAPI, PostgreSQL, MongoDB, Stripe
- React frontend with react-router-dom, Shadcn/UI, Tailwind
- JWT auth (access + refresh tokens), RBAC middleware

## Completed
- [x] Full auth system: signup, login, logout, refresh tokens
- [x] Stripe payment integration (checkout + webhook)
- [x] Multi-step onboarding (5 steps)
- [x] RBAC: require_auth, require_active, require_role
- [x] Paywall middleware (demo accounts bypass)
- [x] Standardized response format {success, data, error}
- [x] Module filtering by user.modules_enabled
- [x] CEO Dashboard: 14 dashboards, 90+ widgets, all P1 endpoints
- [x] Protected test users (3 accounts, auto-reset on startup)
- [x] Centralized logout to /login (same domain)
- [x] All route guards using React Router <Navigate>
- [x] Response envelope unwrapping fixed across all pages
- [x] **Architecture migration (2026-03-20): Emergent-only auth, removed Lovable integration**
- [x] Removed: handoff route, Lovable redirects, REACT_APP_LOVABLE_LOGIN_URL
- [x] All 12 auth migration scenarios passed (iteration 69)
- [x] All 9 module/logout scenarios passed (iteration 68)
- [x] FEATURE (2026-03-20): Pixel-perfect login page from Lovable design spec — 11/11 passed (iteration 70)
  - Space Grotesk + Inter fonts, spet-icon-hd.png, .btn-premium, .gradient-text, dark/light mode, error states
  - Fixed api.js 401 interceptor to skip auth endpoints for proper error display
- [x] FEATURE (2026-03-20): Landing Page pixel-perfect — 12 sections (Navbar, Hero typewriter, Problem, Solution Core, How It Works, AI, Benefits, Modules, Pricing, FAQ, Final CTA, Contact Form, Footer)
- [x] FEATURE (2026-03-20): Shared AuthHeader component (back arrow + spet. logo + theme toggle) used in Login, Signup, Onboarding
- [x] FEATURE (2026-03-20): Signup page premium redesign with plan selection (4 plans: Core/Flow/Sync/OS)
- [x] FEATURE (2026-03-20): Landing → Login → Signup flow with consistent navigation
- [x] CSS: Added .premium-card, .section-glow, scroll reveal animations
- [x] Route / = Landing page (public), /login, /signup, /onboarding = auth pages with AuthHeader
- [x] 15/15 landing + auth scenarios passed (iteration 71)
- [x] UI FIX (2026-03-21): Added centered section divider lines between Problem/SolutionCore, HowItWorks/AI, Benefits/Modules, FinalCTA/Contact
- [x] UI FIX (2026-03-21): Increased pricing section spacing (mt-10 → mt-16) between heading and cards
- [x] AUTH FIX (2026-03-21): Added logout button to AuthHeader (auto-detected via isAuthenticated)
- [x] AUTH FIX (2026-03-21): OnboardingPage now shows logout in header (uses AuthHeader with auto-detection)
- [x] ACCESS FIX (2026-03-21): Updated teste1@teste.com from plan "flow" to "sync" with full module permissions
- [x] GLOBAL: All logout buttons use centralized handleFullLogout (clear tokens → redirect /login)

## Current Phase: Integration & Stability
Focus: Emergent as standalone full-stack app, endpoint stability

## Backlog
- [ ] CEO Dashboard P2 endpoints: /api/ceo/conversion-rates
- [ ] CEO Dashboard P3 endpoints: /api/ceo/crm-reports, /api/ceo/startup-kpis, /api/ceo/mrr-retention
- [ ] Subscription management (upgrade/downgrade)
- [ ] Team invite system
- [ ] Push notifications / PWA
- [ ] DB consolidation (MongoDB → PostgreSQL)
