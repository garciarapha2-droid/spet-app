# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards.

## Architecture
- **Lovable** = public experience (landing, signup, login, checkout)
- **Emergent** = protected SaaS app + backend API
- **Production**: `REACT_APP_LOVABLE_LOGIN_URL` set → unauthenticated users redirect to Lovable
- **Preview/Dev**: env var unset → fallback to internal `/login` page
- Auth handoff at `/auth/handoff?code=XXX` for cross-domain session transfer

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- Backend: FastAPI (Python)
- Databases: PostgreSQL (transactional), MongoDB (config/catalog)
- Payments: Stripe via emergentintegrations
- Real-time: WebSocket for manager updates

## Integration Contract (FROZEN — v1.0, March 19, 2026)
Full contract documented in `/app/INTEGRATION_CONTRACT.md`

### Endpoints for Lovable:
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/auth/signup` | None | Create account (user + company + venue) |
| `POST /api/auth/login` | None | Authenticate, get JWT |
| `POST /api/auth/handoff/create` | Bearer | Create one-time handoff code |
| `POST /api/auth/handoff/exchange` | None | Exchange code for JWT |
| `GET /api/auth/me` | Bearer | Get user profile + venues |
| `POST /api/auth/logout` | Bearer | Invalidate token |
| `GET /api/onboarding/plans` | None | List pricing plans |
| `POST /api/onboarding/lead` | None | Capture lead info |
| `POST /api/onboarding/checkout` | None | Create Stripe checkout |
| `GET /api/onboarding/checkout/status/{id}` | None | Check payment status |

All endpoints tested and confirmed working (March 19, 2026).

## Completed Features

### Architecture: Standalone + Lovable Compatible
- Internal login at /login (preview fallback, env-controlled)
- ProtectedRoute: Lovable redirect in prod, Navigate in preview
- Auth handoff endpoint for cross-domain transfer
- CORS configured for Lovable domain

### UI/UX Color System Upgrade (March 2026)
- Soft tinted backgrounds, colored icons, neutral bases
- Purple selection border, CSS variables for light/dark
- Tested iteration_56: 100% pass

### Phase 1-2: Kitchen KDS + Menu Grid
### Phase 3: Item Modifiers + Priced Extras
### ID Verification (Fixed)
### Table Mode Server Consistency (Fixed)
### Manager Panel
### Protected Users System

## Upcoming Tasks
- P1: Manager Panel refinement
- P2: Server History View
- PWA, Live Activity Feed, Analytics

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543
