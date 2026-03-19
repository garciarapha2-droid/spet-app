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

## Demo Accounts
| Email | Password | Role | Behavior |
|---|---|---|---|
| garcia.rapha2@gmail.com | 12345 | CEO | Admin, protected, not deletable |
| teste@teste.com | 12345 | USER | Demo full (persistent) |
| teste1@teste.com | 12345 | USER | Demo onboarding (resets on restart) |

## Key Endpoints
- Auth: signup, login, logout, /me, /permissions, /payment-status, handoff
- Onboarding: plans, create-checkout, checkout/status, account-setup, password-reset, modules-setup, team-setup, complete
- Webhook: /api/webhook/stripe (user activation)
- Venue ops: pulse, tap, table, kds, manager, owner, ceo

## Tech Stack
- FastAPI, PostgreSQL (AWS RDS), MongoDB, Stripe, emergentintegrations
- JWT auth, RBAC middleware, paywall enforcement
- CORS: *.lovable.app, *.lovable.dev, localhost

## Completed (Phase 1)
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
- [x] 27/27 tests passed (iteration 61)

## Backlog
- [ ] Phase 2: Premium Design System (from Lovable)
- [ ] Phase 3: Full role-specific dashboards
- [ ] Team invite system (currently placeholder)
- [ ] Subscription management (upgrade/downgrade)
- [ ] Push notifications / PWA
