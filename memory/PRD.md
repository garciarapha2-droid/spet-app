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

## Infrastructure
| Service | Provider | Status |
|---------|----------|--------|
| PostgreSQL | AWS RDS (spetapp-db.cpk282msm3ar.us-east-2.rds.amazonaws.com) | Production |
| MongoDB | Local | Active |
| Email | Resend (spetapp.com domain verified) | Production |
| Payments | Stripe (test mode) | Active |

## Completed Features

### AWS RDS Migration (March 2026)
- Migrated from local PostgreSQL to AWS RDS
- All 18 tables created and verified
- Protected users + demo data seeded
- Data persistence is now guaranteed (no more restart data loss)

### Lead Capture & Email Routing (March 2026)
- `POST /api/leads/capture` — unified endpoint
- Email routing: signup→leads@, contact→contact@, support→support@spetapp.com
- All emails to r.collasos@spetapp.com
- Signup auto-captures lead
- PostgreSQL `leads` table on AWS RDS

### Architecture: Standalone + Lovable Compatible
- Internal /login (preview only)
- ProtectedRoute: Lovable redirect in prod, Navigate in preview
- Auth handoff for cross-domain transfer

### UI/UX Color System Upgrade
### Kitchen KDS + Menu Grid
### Item Modifiers + Priced Extras
### ID Verification
### Table Mode Server Consistency
### Manager Panel
### Protected Users System

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345

## Upcoming Tasks
- P1: Manager Panel refinement
- P2: Server History View
- PWA, Live Activity Feed, Analytics
