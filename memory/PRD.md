# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards.

## Architecture
- **Lovable** = public experience (landing, signup, login, checkout)
- **Emergent** = protected SaaS app + backend API
- **Database**: AWS RDS PostgreSQL (us-east-2) — persistent, production-grade
- **MongoDB**: Local (config/catalog)
- **Email**: Resend (spetapp.com verified domain)
- Integration contract FROZEN v1.0 — see `/app/INTEGRATION_CONTRACT.md`

## Completed Features

### P1: CEO CRM / Leads Management (March 2026)
- **`GET /api/ceo/leads`** — fetches all leads with company/venue join
- **`PUT /api/ceo/leads/{id}/status`** — update status, payment_status, notes
- CRM tab (first tab) in CEO Dashboard with:
  - Stats row (Total, New, Paid, Active)
  - Filterable table (source, status)
  - Detail panel with contact info, source, interest, company, account status
  - Status management (new/contacted/qualified/paid/onboarding/active/lost)
  - Payment status (N/A/pending/paid)
  - Quick actions (Mark Paid, Onboarding, Mark Active)
  - Internal notes with save
- CEO-only access (403 for non-CEO users)
- Tested iteration_57: 100% backend (13/13), 100% frontend

### P2: Account Activation Email (March 2026)
- `services/activation_email.py` — sends from `access@spetapp.com`
- HTML template with welcome, email, company, plan, CTA button
- Env var: `RESEND_FROM_ACCESS=access@spetapp.com`
- Tested manually: email_id returned successfully

### Lead Capture & Email Routing
- `POST /api/leads/capture` — unified endpoint
- Email routing: signup→leads@, contact→contact@, support→support@spetapp.com
- Signup auto-captures lead (source="signup", non-blocking)
- PostgreSQL `leads` table with 12 columns

### AWS RDS Migration
- 18 tables on AWS RDS
- Protected users + demo data seeded on startup

### Integration Contract (FROZEN v1.0)
- See `/app/INTEGRATION_CONTRACT.md`

### Other Completed
- UI/UX Color System Upgrade
- Kitchen KDS + Menu Grid
- Item Modifiers + Priced Extras
- ID Verification
- Table Mode Server Consistency
- Manager Panel
- Protected Users System

## In Progress / Next
- **P3**: Paid access enforcement (block unpaid users, bypass for protected accounts)
- **P4**: Lovable ↔ Emergent final integration validation

## Future/Backlog
- Manager Panel refinement
- Server History View
- PWA, Live Activity Feed, Analytics
- KDS/Bar routing, Push notifications
- Stripe Webhooks, Offline-First

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
