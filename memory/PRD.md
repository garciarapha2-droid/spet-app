# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards.

## Architecture
- **Lovable** = public experience (landing, signup, login, checkout)
- **Emergent** = protected SaaS app (no public access)
- Unauthenticated users → redirect to Lovable (REACT_APP_LOVABLE_LOGIN_URL)

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- Backend: FastAPI (Python)
- Databases: PostgreSQL (transactional), MongoDB (config/catalog)
- Payments: Stripe via emergentintegrations
- Real-time: WebSocket for manager updates

## Completed Features

### Architecture: Lovable/Emergent Separation
- Removed login/signup/landing pages from Emergent
- ProtectedRoute redirects to Lovable login
- Auth backend intact (JWT + RBAC)

### Phase 1-2: Kitchen KDS + Menu Grid
- Toast-style KDS cards, touch-friendly menu grid

### Phase 3: Item Modifiers & Notes + Priced Extras
- ItemCustomizeModal with remove/add ingredients, extras, notes
- **Extras support pricing**: {name: "cheese", price: 2.00}
- Line total recalculated: (base_price + extras_total) * qty
- Session total updated automatically
- Backward compatible with string-only extras
- Prices shown in order summary, kitchen tickets, and bill

### ID Verification (Fixed)
- TABLE: Click alcohol item → modal appears → check checkbox → confirm → item added
- TAP: Age verification modal (ShieldCheck "Confirm 21+") for alcohol items
- After first verification, subsequent alcohol items add directly
- Full error handling with explicit toast messages

### UI/UX Refinement
- Global z-index (active screen always on top)
- Full-color category blocks (amber, pink, orange, etc.)
- Table cards: green=free, dark gray=busy
- Bartender/Server selectors: neutral gray
- Tab cards with green/yellow/red status dots + manual control
- Item details buttons always visible

### Manager Panel
- Tips view with server detail table
- Menu list/kanban toggle
- Settings with venue creation
- Tables by Server with WebSocket + polling

### Protected Users System
- Auto-recovery on every backend startup
- garcia.rapha2@gmail.com (CEO) + teste@teste.com always exist

## Table Mode Server Consistency (Fixed)
- Top-level server selector is the single source of truth
- Per-table server assignment dropdown REMOVED
- Server name shown as read-only info on table cards
- All table operations (open, add item, tip) use the top-level selected server
- Architecture direction: APPROVED
- General design direction: APPROVED
- ID Verification: FIXED (iteration_55 confirmed)
- Priced Extras: IMPLEMENTED (iteration_55 confirmed)
- Final approval: PENDING USER REVIEW

## Upcoming Tasks (After Approval)
- Manager Panel refinement
- Server History View
- PWA support
- Live Activity Feed, Per-Event Dashboard
- KDS/Bar routing, Push notifications
- Stripe Webhooks, Offline-First

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Key API Endpoints
- POST /api/auth/login
- PUT /api/tap/session/{sid}/item/{iid} — update modifiers with priced extras
- POST /api/tap/session/{sid}/verify-id — age/ID verification
- GET /api/manager/tips-detail
- POST /api/venue/create-venue
