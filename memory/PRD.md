# SPET — Product Requirements Document

## Original Problem Statement
SPET is a multi-tenant SaaS platform for real-time venue operations. The platform integrates with an external landing/login page built in Lovable, requiring production-ready auth, seamless auth handoff, and design system alignment across the entire application.

## Design System — EXACT Lovable Tokens (Source of Truth)

### Dark Mode (Default)
| Token | HSL | HEX |
|-------|-----|-----|
| --background | 222 47% 2% | #020617 |
| --foreground | 0 0% 100% | #FFFFFF |
| --primary | 258 75% 58% | #7C3AED |
| --primary-glow | 263 80% 66% | #9461FB |
| --secondary | 222 30% 10% | #121929 |
| --secondary-foreground | 226 50% 88% | #CBD5F5 |
| --muted | 222 20% 11% | #181D27 |
| --muted-foreground | 226 30% 65% | #8494BD |
| --accent | 263 80% 62% | #8B5CF6 |
| --card | 220 30% 6% | #0B1120 |
| --border | 226 20% 14% | #1E2433 |
| --input | 226 20% 14% | #1E2433 |
| --destructive | 0 62% 50% | #CF2D2D |
| --text-secondary | 226 30% 72% | #9DABC9 |
| --text-tertiary | 226 20% 48% | #626E8A |

### Typography
- Font: Inter (400/500/600/700/800)
- Body: 15px, line-height 1.75
- Small labels: 13px
- Headings: tight tracking, bold

### Logo
- CSS-rendered icon (dark rounded rect #2A2D35, white S, purple dot)
- Wordmark: "spet." lowercase, font-bold, purple dot using --primary

## Completed Work
- Production-Ready Auth System
- Seamless Auth Handoff (one-time code)
- **Design System Alignment — EXACT Lovable Tokens** (2026-03-18)
- Logo replacement (HD icon + wordmark)
- Typography overhaul (body 15px, line-height 1.75)
- Workflow Consistency (Tap/Table follow Pulse flow)
- CEO Permissions & User Management
- Alcohol ID Verification fix

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, Python
- **Databases**: PostgreSQL (users), MongoDB (venue data)
- **Auth**: JWT, Cross-domain handoff

## Credentials
- Admin: `teste@teste.com` / `12345`
- CEO: `garcia.rapha2@gmail.com` / `12345`

## Prioritized Backlog

### P1 (Next)
- Final Demo & Operational Checklist
- PWA support for mobile usage
- Live Activity Feed on Manager Dashboard
- Per-Event Dashboard (Manager View)

### P2 (Future)
- Module access control per company (SaaS)
- KDS / Bar Order Routing enhancements
- Push notifications
- Stripe Webhooks for subscriptions
- Offline-First Capabilities
- Event Wallet Module
- Native app (React Native/Expo)
