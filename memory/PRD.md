# SPET — Product Requirements Document

## Original Problem Statement
SPET is a multi-tenant SaaS platform for real-time venue operations. The platform integrates with an external landing/login page built in Lovable, requiring production-ready auth, seamless auth handoff, and design system alignment across the entire application.

## User Personas
- **CEO/Founder**: High-level company metrics, targets, user management
- **Owner**: Venue-level financial overview
- **Manager**: Day-to-day operations, staff, menu, reports
- **Host (Pulse)**: Guest entry, NFC scanning, inside tracking
- **Bartender (Tap)**: Tab management, drink orders, tips
- **Server (Table)**: Table management, food/drink orders, ID verification
- **Kitchen (KDS)**: Order tickets, preparation tracking

## Core Requirements (Completed)
1. **Production-Ready Auth** (DONE): Signup, login, logout, JWT, password hashing
2. **Seamless Auth Handoff** (DONE): One-time code exchange from Lovable
3. **Design System Alignment** (DONE - 2026-03-18): Exact Lovable tokens applied
4. **Workflow Consistency** (DONE): Tap/Table follow Pulse flow
5. **CEO Permissions & User Management** (DONE)
6. **Alcohol ID Verification** (DONE): Fixed recurring bug
7. **Backward Compatibility** (DONE): All existing data preserved

## Design System Tokens (Source of Truth)
### Dark Mode (Primary Experience)
- Background: `#020617` → HSL `229 84% 5%`
- Card: `#0B1120` → HSL `223 49% 8%`
- Borders: `#1E2433` → HSL `223 26% 16%`
- Primary: `#7C3AED` → HSL `262 83% 58%`
- Foreground: HSL `210 40% 96%`

### Button Styling
- Background: `#7C3AED`
- Hover: `brightness(0.92)` (slightly darker)
- Shadow: Soft purple glow `0 0 12px hsl(262 83% 58% / 0.15)`
- Border radius: `rounded-lg` (0.5rem)
- Font weight: 500 (medium)

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- **Backend**: FastAPI, Python
- **Databases**: PostgreSQL (users, billing, sessions), MongoDB (venue data, catalog)
- **Auth**: JWT, Cross-domain handoff
- **Real-time**: WebSockets

## Key Architecture
```
/app/
├── backend/          FastAPI server on port 8001
│   ├── routes/       API endpoints (auth, pulse, tap, table, etc.)
│   ├── models/       Pydantic models
│   ├── middleware/    Auth middleware
│   ├── utils/        Hashing, auth utilities
│   └── server.py     Main server entry
├── frontend/         React app on port 3000
│   ├── src/
│   │   ├── components/ui/   Shadcn UI components
│   │   ├── contexts/        Auth, Theme contexts
│   │   ├── pages/           All page components
│   │   ├── services/api.js  API client
│   │   └── index.css        Design system CSS variables
│   └── tailwind.config.js
```

## Credentials
- Admin: `teste@teste.com` / `12345`
- CEO: `garcia.rapha2@gmail.com` / `12345`

## Known Environment Issues
- PostgreSQL is non-persistent in preview (needs re-seeding after pod restart)
- MongoDB managed by supervisor

## Prioritized Backlog

### P0 (Critical)
- None remaining

### P1 (Next)
- Final Demo & Operational Checklist
- PWA support for mobile usage
- Live Activity Feed on Manager Dashboard
- Per-Event Dashboard (Manager View)

### P2 (Future)
- Module access control per company (SaaS feature)
- KDS / Bar Order Routing enhancements
- Push notifications for real-time alerts
- Stripe Webhooks for subscriptions
- Offline-First Capabilities
- Event Wallet Module
- Native app conversion (React Native/Expo)
