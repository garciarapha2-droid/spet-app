# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards.

## Architecture
- **Lovable** = public experience (landing, signup, login, checkout)
- **Emergent** = protected SaaS app + backend API
- **Production**: `REACT_APP_LOVABLE_LOGIN_URL` set → redirect to Lovable
- **Preview/Dev**: env var unset → fallback to internal `/login`
- Integration contract FROZEN v1.0 (March 19, 2026) — see `/app/INTEGRATION_CONTRACT.md`

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- Backend: FastAPI (Python)
- Databases: PostgreSQL (transactional), MongoDB (config/catalog)
- Payments: Stripe via emergentintegrations
- Email: Resend (transactional emails, lead notifications)
- Real-time: WebSocket for manager updates

## Integration Contract (FROZEN v1.0)
See `/app/INTEGRATION_CONTRACT.md` for full details.

## Completed Features

### Lead Capture & Email Routing (March 2026)
- `POST /api/leads/capture` — unified endpoint for all sources
- Fields: full_name, email, phone, product_interest, source, timestamp
- Sources: "signup", "contact", "support"
- Email routing: signup→leads@spetapp.com, contact→contact@spetapp.com, support→support@spetapp.com
- All emails delivered to: r.collasos@spetapp.com
- Email format: [NEW LEAD] - {source} - {product_interest}
- PostgreSQL `leads` table stores all captured leads
- Signup auto-captures lead (source="signup", non-blocking)
- Resend integration via env vars (RESEND_API_KEY, RESEND_FROM_*, LEAD_NOTIFICATION_TO)
- Graceful degradation: if RESEND_API_KEY not set, lead is stored but email skipped

### Architecture: Standalone + Lovable Compatible
- Internal login at /login (preview fallback, env-controlled)
- ProtectedRoute: Lovable redirect in prod, Navigate in preview
- Auth handoff endpoint for cross-domain transfer

### UI/UX Color System Upgrade (March 2026)
- Soft tinted backgrounds, colored icons, neutral bases
- Tested iteration_56: 100% pass

### Phase 1-2: Kitchen KDS + Menu Grid
### Phase 3: Item Modifiers + Priced Extras
### ID Verification (Fixed)
### Table Mode Server Consistency (Fixed)
### Manager Panel
### Protected Users System

## Environment Variables (Backend)
| Variable | Purpose |
|----------|---------|
| MONGO_URL | MongoDB connection |
| DB_NAME | MongoDB database name |
| POSTGRES_URL | PostgreSQL connection |
| JWT_SECRET | JWT signing key |
| STRIPE_API_KEY | Stripe payments |
| EMERGENT_LLM_KEY | LLM integration |
| RESEND_API_KEY | Resend email service |
| RESEND_FROM_LEADS | From address for signup leads |
| RESEND_FROM_CONTACT | From address for contact leads |
| RESEND_FROM_SUPPORT | From address for support leads |
| LEAD_NOTIFICATION_TO | Destination email for all lead notifications |

## Upcoming Tasks
- P1: Manager Panel refinement
- P2: Server History View
- PWA, Live Activity Feed, Analytics

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
