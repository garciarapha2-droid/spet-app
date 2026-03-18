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

### UI/UX Color System Upgrade (Completed - March 2026)
- **Soft tinted backgrounds**: Category colors use opacity-based Tailwind classes (e.g., bg-amber-500/[0.06])
- **Colored icons**: Category icons use vibrant colors (amber, pink, orange, emerald, etc.)
- **Neutral bases**: Card backgrounds, borders use neutral foreground/muted colors
- **Purple selection border**: Active tab uses border-[#6D5DFC]
- **CSS Variables**: .cat-beers, .cat-cocktails, etc. defined in index.css with light/dark mode variants
- **Consistent across TapPage and TablePage**
- **Table status colors**: Free=emerald borders/text, Busy=neutral foreground
- Tested and validated (iteration_56 - 100% pass rate)

### Protected Users System
- Auto-recovery on every backend startup
- garcia.rapha2@gmail.com (CEO) + teste@teste.com always exist

### Table Mode Server Consistency (Fixed)
- Top-level server selector is the single source of truth
- Per-table server assignment dropdown REMOVED
- Server name shown as read-only info on table cards
- All table operations use the top-level selected server

### Manager Panel
- Tips view with server detail table
- Menu list/kanban toggle
- Settings with venue creation
- Tables by Server with WebSocket + polling

## Upcoming Tasks (After Approval)
- Manager Panel refinement (P1)
- Server History View (P2)
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

## Known Environment Constraints
- PostgreSQL is non-persistent in preview environment
- protected_users.py runs on startup to ensure schema + users exist
- Demo data is re-seeded on startup when sessions are low
