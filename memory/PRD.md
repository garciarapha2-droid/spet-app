# SPET — Product Requirements Document

## Original Problem Statement
SPET is a multi-tenant SaaS platform for real-time venue operations integrating with an external Lovable frontend.

## Design System — EXACT Lovable Tokens
### Dark Mode
| Token | HSL | HEX |
|-------|-----|-----|
| --background | 222 47% 2% | #020617 |
| --foreground | 0 0% 100% | #FFFFFF |
| --primary | 258 75% 58% | #7C3AED |
| --primary-glow | 263 80% 66% | #9461FB |
| --secondary | 222 30% 10% | #121929 |
| --card | 220 30% 6% | #0B1120 |
| --border | 226 20% 14% | #1E2433 |
| --muted | 222 20% 11% | #181D27 |
| --muted-foreground | 226 30% 65% | #8494BD |
| --accent | 263 80% 62% | #8B5CF6 |
| --destructive | 0 62% 50% | #CF2D2D |
| --text-secondary | 226 30% 72% | #9DABC9 |
| --text-tertiary | 226 20% 48% | #626E8A |

## System Accounts (PERMANENT — Cannot be deleted)
| Account | Email | Password | Role |
|---------|-------|----------|------|
| Test User | teste@teste.com | 12345 | USER |
| CEO | garcia.rapha2@gmail.com | 12345 | CEO |

## Role System
- `CEO`: Access to ALL modules including CEO Dashboard
- `USER`: Access to all modules EXCEPT CEO. CEO module is completely invisible.
- Enforced on both backend (require_ceo dependency, 403 for non-CEO) and frontend (CEORoute, isCEO filter)

## Completed Work
- Production-Ready Auth System + Seamless Auth Handoff
- Design System — EXACT Lovable Tokens (2026-03-18)
- Logo (HD icon + wordmark)
- Typography overhaul (Inter, 15px body, 1.75 line-height)
- UI/UX Refinement — Toast POS Patterns (menu grid, order cards, KDS tickets)
- Workflow Consistency (Tap/Table follow Pulse flow)
- **User Accounts + Role System** (2026-03-18):
  - role field in users table (CEO / USER)
  - is_system_account flag (prevents deletion)
  - require_ceo backend dependency on all 15 CEO endpoints
  - CEORoute frontend component
  - isCEO flag in AuthContext
  - CEO module hidden from non-CEO users
- CEO Permissions & User Management
- Alcohol ID Verification fix

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI
- Backend: FastAPI, Python
- Databases: PostgreSQL (users, roles), MongoDB (venue data)
- Auth: JWT with role claim

## Prioritized Backlog
### P1 (Next)
- Final Demo & Operational Checklist
- PWA support for mobile
- Live Activity Feed (Manager Dashboard)
- Per-Event Dashboard (Manager View)

### P2 (Future)
- Module access control per company (SaaS)
- KDS / Bar Order Routing
- Push notifications
- Stripe Webhooks
- Offline-First
- Event Wallet / Native app
