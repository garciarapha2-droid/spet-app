# SPET - Multi-Tenant SaaS Platform for Real-Time Venue Operations

## Original Problem Statement
Build "SPET," a multi-tenant SaaS platform for real-time venue operations with modules for Entry (Pulse), Bar (Tap), Table Management, Kitchen (KDS), Manager Dashboard, Owner Dashboard, and CEO Dashboard.

## Tech Stack
- **Frontend**: React (CRA) + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + PostgreSQL + MongoDB
- **Real-time**: WebSockets
- **Auth**: JWT
- **AI**: OpenAI via emergentintegrations

## Core Architecture
```
/app/
├── backend/
│   ├── routes/ (auth.py, ceo.py, manager.py, pulse.py, table.py, tap.py, venue.py)
│   ├── middleware/auth_middleware.py
│   ├── database.py, config.py, server.py
│   ├── seed_demo.py
│   └── ws_manager.py
└── frontend/
    ├── src/pages/ (TablePage.js, TapPage.js, CeoPage.js, etc.)
    ├── src/services/api.js
    └── src/contexts/AuthContext.js
```

## Completed Features (All Tested)
- Full module ecosystem: Pulse, Tap, Table, KDS, Manager, Owner, CEO
- Real-time updates via WebSockets
- Premium dark-themed UI
- Demo data seeding with positive financials
- Staff tip recording and real-time propagation
- Alcohol ID verification in Table module (P0 bug FIXED)
- Step-by-step workflow for Tap and Table (Add items → Confirm → Payment)
- CEO module permissions enforcement (venue_configs.modules)
- CEO user management (CRUD)
- Module access blocking on frontend when disabled

## Key Credentials
- **Test Account**: teste@teste.com / 12345 (platform_admin)
- **CEO Account**: garcia.rapha2@gmail.com / 12345 (ceo)
- **Venue ID**: 40a24e04-75b6-435d-bfff-ab0d469ce543
- **DB_NAME**: spetap_db (MongoDB)

## Key API Endpoints
- POST /api/tap/session/{id}/verify-id — ID verification
- POST /api/tap/session/{id}/add — Add item to session
- GET /api/venue/check-module/{key} — Check module access
- GET /api/ceo/users — List all users
- POST /api/ceo/users — Create user
- PUT /api/ceo/users/{id} — Update user
- DELETE /api/ceo/users/{id} — Delete user

## Environment Notes
- PostgreSQL managed by supervisor (was missing in forked env)
- MongoDB DB name is `spetap_db` (not `spetap`)

## Upcoming Tasks (P1)
- Live Activity Feed on Manager Dashboard
- Per-Event Dashboard (Manager View)
- Module access control per company (SaaS-level granularity)

## Future/Backlog (P2)
- KDS / Bar Order Routing enhancements
- Push notifications for real-time alerts
- Stripe Webhooks for subscriptions
- Offline-First Capabilities
- Event Wallet Module
