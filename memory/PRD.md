# SPET — Product Requirements Document

## Original Problem Statement
Build a high-performance POS platform (SPET) inspired by Toast, with role-based access, operational screens for Kitchen, Tap, Table, and Manager dashboards.

## Architecture
- **Lovable** = public experience (landing, signup, login, checkout) — optional external integration
- **Emergent** = self-contained SaaS app with internal login
- ProtectedRoute redirects unauthenticated users to internal /login page
- Auth handoff endpoint at /auth/handoff still available for Lovable integration

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, Lucide Icons
- Backend: FastAPI (Python)
- Databases: PostgreSQL (transactional), MongoDB (config/catalog)
- Payments: Stripe via emergentintegrations
- Real-time: WebSocket for manager updates

## Completed Features

### Architecture: Standalone + Lovable Compatible
- Internal login page at /login (works standalone)
- ProtectedRoute uses React Router Navigate (no external redirects)
- Auth handoff endpoint preserved for Lovable integration
- Auth backend intact (JWT + RBAC)

### Phase 1-2: Kitchen KDS + Menu Grid
- Toast-style KDS cards, touch-friendly menu grid

### Phase 3: Item Modifiers & Notes + Priced Extras
- ItemCustomizeModal with remove/add ingredients, extras, notes
- Extras support pricing: {name: "cheese", price: 2.00}
- Line total recalculated: (base_price + extras_total) * qty

### ID Verification (Fixed)
- TABLE: Click alcohol item → modal → checkbox → confirm → item added
- TAP: Age verification modal for alcohol items

### UI/UX Color System Upgrade (Completed - March 2026)
- Soft tinted backgrounds with opacity-based Tailwind classes
- Colored icons per category
- Neutral base colors, purple selection border
- CSS Variables for light/dark mode
- Tested iteration_56: 100% pass

### Critical 404 Fix (March 2026)
- Restored internal login page (was redirecting to broken Lovable URL)
- ProtectedRoute now uses React Router Navigate to /login
- CEORoute also uses Navigate (no window.location.href)
- App loads correctly from preview URL

### Protected Users System
- Auto-recovery on every backend startup
- garcia.rapha2@gmail.com (CEO) + teste@teste.com always exist

### Table Mode Server Consistency
- Top-level server selector is single source of truth

### Manager Panel
- Tips view, Menu toggle, Settings, Tables by Server

## Upcoming Tasks
- P1: Manager Panel refinement
- P2: Server History View
- PWA support, Live Activity Feed, Per-Event Dashboard
- KDS/Bar routing, Push notifications, Stripe Webhooks, Offline-First

## Test Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Key API Endpoints
- POST /api/auth/login
- PUT /api/tap/session/{sid}/item/{iid}
- POST /api/tap/session/{sid}/verify-id
- GET /api/manager/tips-detail
- POST /api/venue/create-venue
