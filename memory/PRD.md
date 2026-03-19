# SPET — Product Requirements Document

## Architecture
- **Emergent** = API backend (FastAPI + PostgreSQL + MongoDB + Stripe)
- **Lovable** = Frontend (all UI, screens, dashboards)
- **Integration**: Lovable consumes Emergent APIs via REST + JWT

## Core User Journey
1. User signs up → `POST /api/auth/signup` → status: `pending_payment`
2. Redirect to Stripe Checkout → payment
3. Stripe webhook activates user → status: `active`
4. Multi-step onboarding (5 steps): welcome → account setup → password → modules → complete
5. Role-based dashboard access

## API Response Format
All `/api/*` endpoints return:
```json
{ "success": true|false, "data": {...}|null, "error": null|{"code":"...", "message":"..."} }
```

## Product Plans (Approved)
| ID | Name | Official Price | Early Price | Modules | Limits |
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
| garcia.rapha2@gmail.com | 12345 | CEO | Admin, protected, not deletable |
| teste@teste.com | 12345 | USER | Demo full (persistent) |
| teste1@teste.com | 12345 | USER | Demo onboarding (resets on restart) |

## Key Endpoints
- Auth: signup, login, logout, refresh-token, /me, /permissions, /payment-status, handoff
- Onboarding: plans, create-checkout, checkout/status, account-setup, password-reset, modules-setup, team-setup, complete
- Webhook: /api/webhook/stripe (user activation)
- Venue ops: pulse, tap, table, kds, manager, owner, ceo

## Tech Stack
- FastAPI, PostgreSQL (AWS RDS), MongoDB, Stripe, emergentintegrations
- JWT auth (access + refresh tokens), RBAC middleware, paywall enforcement
- CORS: *.lovable.app, *.lovable.dev, localhost

## Completed
- [x] Signup → pending_payment → Stripe checkout
- [x] Stripe webhook → user activation
- [x] Multi-step onboarding (5 steps)
- [x] RBAC: require_auth, require_active, require_role
- [x] Paywall middleware (demo accounts bypass)
- [x] Standardized response format {success, data, error}
- [x] CORS for Lovable integration
- [x] /permissions endpoint with flags for frontend routing
- [x] /payment-status endpoint
- [x] API documentation (/app/API_DOCS.md)
- [x] Plan naming & pricing: Spet Core/Flow/Sync/OS (approved)
- [x] Refresh token system (single-use rotation, 30-day lifetime)
- [x] POST /api/auth/verify-payment — official post-payment activation
- [x] 15/15 verify-payment tests passed (iteration 63)
- [x] 15/15 refresh token tests passed (iteration 62)
- [x] 27/27 API tests passed (iteration 61)

## Current Phase: Integration & Stability
Focus: supporting Lovable integration, endpoint stability, real usage

## Backlog
- [ ] Subscription management (upgrade/downgrade)
- [ ] Team invite system (currently placeholder)
- [ ] Role-specific dashboard APIs
- [ ] Push notifications / PWA
- [ ] Frontend directory cleanup (deprecated)
- [ ] DB consolidation (MongoDB → PostgreSQL)
