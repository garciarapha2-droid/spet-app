# SPET - CEO OS Platform

## Original Problem Statement
Build a "CEO OS" module for a web app, expanded into a full-build mission: transform the React Native/Expo mobile app into a true 1:1 operational version of the web platform. The app is intended for **App Store publication** and must be **production-ready for real users**.

**Latest P0 Directive**: Implement production-grade access control, billing (Stripe), transactional email (Resend), password reset, and team invite system.

## User Personas
- **CEO**: Full platform visibility (revenue, pipeline, users, security)
- **Owner**: Business intelligence (finance, customers, growth, insights, venues)
- **Manager**: Operational control (staff, menu, shifts, tips, reports, guests)
- **Staff/Bartender**: Operational tasks (entry, tabs, tables, kitchen)

## Core Requirements
1. Full-stack web application (React/FastAPI/PostgreSQL)
2. Mobile app (React Native/Expo SDK 54) — 1:1 parity with web
3. Production-quality: error states, empty states, skeleton loading, pull-to-refresh, safe areas
4. Real-time operations via WebSocket
5. NFC integration for guest wristbands
6. Multi-role dashboards (CEO, Owner, Manager)
7. **Production access control system** (authentication + authorization separated)
8. **Stripe billing with webhook processing**
9. **Transactional email system** (Resend) with branded templates
10. **Secure password reset flow** (user + manager initiated)
11. **Team invite system** with email invitations

## Architecture
```
/app
├── backend/
│   ├── middleware/
│   │   └── auth_middleware.py   # Granular access control (5 levels)
│   ├── routes/
│   │   ├── auth.py              # Login, signup, forgot/reset password, manager reset
│   │   ├── billing.py           # Stripe checkout, status, webhook, entitlements
│   │   ├── team.py              # Team invites (send, accept, list, cancel)
│   │   └── ... (15 other route modules)
│   ├── services/
│   │   ├── email_service.py     # Unified transactional email (7 templates)
│   │   └── activation_email.py  # Legacy activation email
│   └── server.py                # Enhanced Stripe webhook with email triggers
├── frontend/
│   ├── src/pages/
│   │   ├── ForgotPasswordPage.js
│   │   ├── ResetPasswordPage.js
│   │   ├── AcceptInvitePage.js
│   │   └── ... (all other pages)
│   └── src/services/api.js      # authAPI + teamAPI
└── mobile/
    ├── assets/                   # Updated icons (App Store ready)
    └── ... (29 screens across 9 modules)
```

## Access Control Rules
| Email | Role | Access |
|---|---|---|
| garcia.rapha2@gmail.com | CEO/Admin | Full access, bypasses all checks |
| teste@teste.com | Demo | Active, bypasses payment check |
| teste1@teste.com | Onboarding | Forces onboarding flow |
| Other users | Based on status | Payment required → subscription → onboarding |

## Middleware Hierarchy
1. `require_auth` - Valid JWT token
2. `require_active` - Active account + demo bypass
3. `require_subscription` - Active subscription + plan
4. `require_onboarded` - Onboarding completed
5. `require_role(*roles)` - Specific role check

## Transactional Emails (Resend)
All emails use SPET branding (icon + wordmark):
1. **Welcome** — Post-signup
2. **Payment Confirmed** — Stripe webhook
3. **Access Granted** — Account activated
4. **Payment Failed** — Stripe webhook
5. **Team Invite** — Owner/Manager sends invite
6. **Password Reset (User)** — User-initiated forgot password
7. **Password Reset (Manager)** — Manager-initiated, invalidates old password

## API Endpoints
### New Endpoints (P0 - Feb 2026)
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Reset with valid token
- `POST /api/auth/manager-reset-password` — Manager-initiated reset
- `POST /api/team/invite` — Send team invite
- `POST /api/team/accept-invite` — Accept invite
- `GET /api/team/invites` — List company invites
- `POST /api/team/cancel-invite` — Cancel pending invite
- `POST /api/webhook/stripe` — Enhanced Stripe webhook

### Existing Endpoints (Verified 24/24)
All operational endpoints tested and passing.

## MongoDB Collections (New)
- `password_reset_tokens` — Secure, single-use, expiring tokens
- `team_invites` — Invite records with status tracking
- `audit_log` — Security event logging
- `webhook_events` — Stripe webhook idempotency

## Test Reports
- iteration_92.json: Access Control + Password Reset + Team Invite (26/27 pass, 96%)
- iteration_91.json: Comprehensive Mobile APIs (24/24 pass)
- iteration_90.json: Mobile Dashboard APIs (17/17 pass)

## Prioritized Backlog

### P0 (Complete)
- [x] Wave 1: Full operational + dashboard parity foundation
- [x] Production hardening: error/empty/skeleton states, safe areas, accessibility
- [x] **Access control system** (5-level middleware, granular rules)
- [x] **Stripe webhook** (payment confirmation + failure handling + emails)
- [x] **Transactional email system** (7 branded templates via Resend)
- [x] **Password reset** (user + manager initiated, secure tokens, session invalidation)
- [x] **Team invite system** (send, accept, cancel, list)
- [x] **App icons** (iOS + Android, updated from brand assets)

### P1 (Next)
- [ ] Web: Migrate CeoOverview & CeoRevenue to real backend API
- [ ] Web: Drag-and-drop Pipeline Kanban
- [ ] Mobile: Tap/Orders dedicated catalog/cart flow
- [ ] Wave 2: UX Polish — animations, transitions, haptic feedback

### P2
- [ ] Push Notifications
- [ ] Offline synchronization
- [ ] Biometric authentication

### P3
- [ ] Web: Fix recurring Pricing Cards landing page bug
- [ ] Production error tracking (Sentry)
- [ ] Analytics integration
- [ ] Dark/light mode toggle (mobile)

## Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Demo: teste@teste.com / 12345
- Onboarding: teste1@teste.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543
