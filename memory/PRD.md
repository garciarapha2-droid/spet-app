# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (nightclubs, restaurants, bars). Core modules: Pulse (entry/identity), TAP (bar tabs), Table (restaurant), KDS (kitchen display), Owner/Manager/CEO Dashboards with AI insights.

## User Personas
- **CEO/Founder**: Strategic business oversight, targets, growth pipeline
- **Owner**: Multi-venue operator, aggregated business insights
- **Manager**: Venue-level operations, staff management, guest analytics
- **Staff**: Bartenders, servers, kitchen crew

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (configs, guests, events, staff, targets)
- **Auth**: JWT (email/password)
- **AI**: OpenAI GPT-5.2 via emergentintegrations + Emergent LLM Key
- **Credentials**: teste@teste.com / 12345

## NON-REGRESSION RULE (Absolute - Feb 2026)
- Nothing built can be removed/altered without explicit user approval
- All flows remain intact: Bar/Tap confirmation, Table ID verification, Server mandatory, Close flow, Tips flow, Event/Guest memory, Dashboards
- Product grows by ADDITION only

## Completed Features (as of Feb 28, 2026)
- [x] Auth + JWT
- [x] Home page with active event filtering + preview/enter
- [x] Pulse, TAP, Table, KDS modules
- [x] Guest confirmation modal (TAP + Pulse Bar)
- [x] ID verification for alcohol (Table) with cache + badge
- [x] Mandatory server selection (Table)
- [x] Unified Close Flow + Tip Recording
- [x] Conversational AI Assistant (Owner + Manager)
- [x] Tab search without "#" prefix (Pulse + TAP)
- [x] AI input: Enter = new line, button = submit
- [x] Manager Dashboard > Guests: Sorted by highest spender + profile modal
- [x] Owner Dashboard > Overview: View switcher (Business/Venue/Event)
- [x] Owner Dashboard > People & Ops: Clickable cards with staff drill-down
- [x] Demo Tables: 8 tables seeded at startup (3 occupied, 5 available)
- [x] **Pulse/Bar search fix**: barSearch endpoint supports tab_number (with/without #) and guest name, opens BarGuestConfirmModal with photo/name/tab#
- [x] **CEO Dashboard (Founder View)**: Complete implementation with 7 sections:
  - Company Health: 8 KPI cards (MRR, Gross Revenue, Net Profit, Active Companies, Active Venues, Churn Rate, Activation Rate, Avg Rev/Company) with color-coded status
  - Revenue vs Profit: Bar chart with week/month/year period switcher
  - Targets/Goals Panel: Left sidebar with weekly/monthly/annual goals, progress bars, pace needed, editable
  - Active Companies & Venues: Table with company/venues/status/MRR/modules
  - Module Adoption: Per-module adoption % with progress bars
  - Risk & Alerts: Severity-sorted actionable alerts
  - Growth Pipeline: 6-stage funnel (Leads → Paid → Activated → Active → At Risk → Cancelled)

## Backlog
### P1
- Per-Event Dashboard (Manager) — single event analysis (top spenders, top-selling items, team performance)
- CEO Access Control within Company Profile (status management, module toggles, user management)

### P2
- KDS/Bar Order Routing
- Push notifications

### P3
- Stripe Webhooks for subscriptions
- Offline-First capabilities
- Event Wallet Module
