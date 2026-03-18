# SPET - Multi-Tenant SaaS Platform for Real-Time Venue Operations

## Original Problem Statement
Build "SPET," a multi-tenant SaaS platform for real-time venue operations with modules for Entry (Pulse), Bar (Tap), Table Management, Kitchen (KDS), Manager Dashboard, Owner Dashboard, and CEO Dashboard. Now extending with production-ready auth for external Lovable frontend integration.

## Tech Stack
- **Frontend**: React (CRA) + Tailwind CSS + Shadcn/UI
- **External Frontend**: Lovable (landing page + login/signup UI)
- **Backend**: FastAPI + PostgreSQL + MongoDB
- **Real-time**: WebSockets
- **Auth**: JWT (bcrypt, 7-day expiry, token blacklist)
- **AI**: OpenAI via emergentintegrations

## Core Architecture
```
/app/
├── backend/
│   ├── routes/ (auth.py, ceo.py, manager.py, pulse.py, table.py, tap.py, venue.py)
│   ├── middleware/auth_middleware.py (token blacklist support)
│   ├── models/ (requests.py, responses.py)
│   ├── database.py, config.py, server.py
│   ├── seed_demo.py
│   └── ws_manager.py
└── frontend/
    ├── src/pages/ (TablePage.js, TapPage.js, CeoPage.js, etc.)
    ├── src/services/api.js
    └── src/contexts/AuthContext.js
```

## Completed Features
- Full module ecosystem: Pulse, Tap, Table, KDS, Manager, Owner, CEO
- Real-time updates via WebSockets
- Premium dark-themed UI
- Demo data seeding with positive financials
- Staff tip recording and real-time propagation
- Alcohol ID verification in Table module
- Step-by-step workflow for Tap and Table (Add items -> Confirm -> Payment)
- CEO module permissions enforcement (venue_configs.modules)
- CEO user management (CRUD)
- **Production Auth System for Lovable Integration (NEW)**:
  - POST /api/auth/signup (name, email, password, venue_type -> auto-creates venue + returns JWT)
  - POST /api/auth/login (returns JWT + user with name)
  - POST /api/auth/logout (token blacklist in MongoDB)
  - GET /api/auth/me (full user profile + roles + venues)
  - CORS restricted to spetapp.com, www.spetapp.com
  - `name` column added to users table
  - Backward-compatible with all existing users/data

## Key Credentials
- **Test Account**: teste@teste.com / 12345 (platform_admin)
- **CEO Account**: garcia.rapha2@gmail.com / 12345 (ceo)
- **Venue ID**: 40a24e04-75b6-435d-bfff-ab0d469ce543
- **DB_NAME**: spetap_db (MongoDB)

## CORS Origins
- https://spetapp.com
- https://www.spetapp.com
- https://table-verify-fix.preview.emergentagent.com

## Key API Endpoints
### Auth (for Lovable integration)
- POST /api/auth/signup — Create user + venue, return JWT
- POST /api/auth/login — Validate credentials, return JWT
- POST /api/auth/logout — Blacklist token
- GET /api/auth/me — Current user profile + venues

### Operations
- POST /api/tap/session/{id}/verify-id — ID verification
- POST /api/tap/session/{id}/add — Add item to session
- GET /api/venue/check-module/{key} — Check module access
- GET/POST/PUT/DELETE /api/ceo/users — User management

## API Documentation
See /app/API_AUTH_DOCS.md for full Lovable integration payloads

## Environment Notes
- PostgreSQL managed by supervisor (must be reinstalled on env reset)
- MongoDB DB name is `spetap_db`

## Upcoming Tasks (P1)
- Live Activity Feed on Manager Dashboard
- Per-Event Dashboard (Manager View)
- Stripe Webhooks for subscriptions
- PWA support for mobile

## Future/Backlog (P2)
- KDS / Bar Order Routing enhancements
- Push notifications for real-time alerts
- Offline-First Capabilities
- Event Wallet Module
- Module access control per company (SaaS-level granularity)
