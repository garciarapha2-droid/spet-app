# SPET — Owner Command Center & Pulse Module

## Original Problem Statement
Build a multi-page "Owner Command Center" and "Pulse" POS module with pixel-perfect design specifications provided by the user. The application is a nightlife management dashboard with multiple modules: Pulse (POS), TAP, Table, KDS, Manager, and Owner.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts + Framer Motion
- **Backend**: FastAPI + MongoDB (not yet connected — all data is MOCKED)
- **Auth**: JWT-based (teste@teste.com / 12345)
- **Data**: All mock data from `/data/ownerData.js` and `/data/pulseData.js`

## Core Modules
### Owner Module (`/owner/*`)
Dashboard for venue owners with analytics, customer intelligence, and system management.

### Pulse Module (`/pulse/*`)
Real-time operations: Entry (check-in), Inside (guest tracking), Bar (POS), Exit, Rewards.

### Shared Navbar (`PulseLayout`)
Global navbar used across all modules: Pulse, TAP, Table, KDS, Manager, Owner.

---

## What's Been Implemented

### Pages — Owner Module
| Page | Route | Status |
|---|---|---|
| Loyalty Performance | `/owner/growth/loyalty` | ✅ Complete |
| Audience Intelligence | `/owner/customers/audience` | ✅ Complete |
| Customer Profile | `/owner/customers/CustomerProfile` | ✅ Complete |
| Audience Genre Detail | `/owner/customers/audience/:genreSlug` | ✅ Complete |
| Time Analysis | `/owner/performance/time` | ✅ Complete |
| Venue Comparison | `/owner/performance/venues` | ✅ Complete |
| Event Detail | `/owner/system/venues/:venueId/events/:eventId` | ✅ Complete |
| Venue Detail | `/owner/system/venues/:venueId` | ✅ Complete |
| Revenue Analytics | `/owner/performance/revenue` | ✅ Complete (with Scope Selector) |

### Pages — Pulse Module
| Page | Route | Status |
|---|---|---|
| Pulse Bar (POS) | `/pulse/bar` | ✅ Complete |

### Components
| Component | Status |
|---|---|
| PulseLayout (Global Navbar) | ✅ Complete — v2 spec implemented |
| OwnerLayout | ✅ Complete |
| Calendar Popover (Venue Management) | ✅ Complete |

### Revenue Analytics — Scope Selector
- **Company** scope: Aggregated KPIs, trend, hourly & venue charts
- **Venue** scope: Per-venue pills (Downtown/Midtown/Uptown), filtered KPIs, Revenue by Night chart
- **Night/Event** scope: Dual sub-selector (venue + event pills), event-specific KPIs, Night Comparison chart
- Period filter works in combination with scope

---

## P0 — In Progress / Next
- Awaiting user specs for: Profit Analysis, Venue Cost Detail, Pulse Inside, Pulse Entry

## P1 — Upcoming
- Revenue Analytics enhancements per user feedback
- GuestFullHistory.js integration into Manager & Pulse modules
- Backend API integration (replace mock data)

## P2 — Backlog
- CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)
- Subscription & team invite APIs
- Financial Overview, Segments, Churn & Retention pages

## P3 — Future
- Refactor LandingPage.js, remove ManagerPage.legacy.js
- Split ownerData.js by domain (guestData, venueData, eventData)
- Centralize inline mock data

---

## Credentials
- **Owner/Manager User**: `teste@teste.com` / `12345`

## Known Issues
- Pricing Cards on landing page (user verification pending, recurrence: 3)
- KDS dropdown has duplicate `/kitchen` path for Kitchen and Bar items
