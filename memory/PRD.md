# SPET — Owner Command Center & Pulse Module

## Original Problem Statement
Build a multi-page "Owner Command Center" and "Pulse" POS module with pixel-perfect design specifications. The application is a nightlife management dashboard with multiple modules: Pulse (POS), TAP, Table, KDS, Manager, and Owner.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts + Framer Motion
- **Backend**: FastAPI + MongoDB (not yet connected — all data is MOCKED)
- **Auth**: JWT-based (teste@teste.com / 12345)
- **Data**: All mock data from `/data/ownerData.js` and `/data/pulseData.js`
- **Global Navbar**: `GlobalNavbar.js` shared by ALL modules (Pulse, TAP, Table, KDS, Manager, Owner)

## Core Components
### GlobalNavbar (`/components/shared/GlobalNavbar.js`)
Single navbar used across all modules. Features: SPET branding, central navigation with dropdowns (Pulse, KDS) and direct links, dynamic breadcrumb, theme toggle, logout. CEO link role-gated.

### Module Layouts
- **PulseLayout**: GlobalNavbar + content (no sidebar)
- **OwnerLayout**: GlobalNavbar + sidebar (expandable groups) + content
- **ManagerLayout**: GlobalNavbar + sidebar + content

---

## What's Been Implemented

### Pages — Owner Module
| Page | Route | Status |
|---|---|---|
| Revenue Analytics (Scope Selector) | `/owner/performance/revenue` | ✅ Complete |
| Loyalty Performance | `/owner/growth/loyalty` | ✅ Complete |
| Audience Intelligence | `/owner/customers/audience` | ✅ Complete |
| Customer Profile | `/owner/customers/:guestId` | ✅ Complete |
| Audience Genre Detail | `/owner/customers/audience/:genreSlug` | ✅ Complete |
| Time Analysis | `/owner/performance/time` | ✅ Complete |
| Venue Comparison (Night Cards) | `/owner/performance/venues` | ✅ Complete |
| Event Detail | `/owner/system/venues/:venueId/events/:eventId` | ✅ Complete |
| Venue Detail | `/owner/system/venues/:venueId` | ✅ Complete |

### Pages — Pulse Module
| Page | Route | Status |
|---|---|---|
| Pulse Entry (Guest Check-in) | `/pulse/guest` | ✅ Complete |
| Pulse Bar (POS) | `/pulse/bar` | ✅ Complete |

### Components & Features
| Component | Status |
|---|---|
| GlobalNavbar (shared by all modules) | ✅ Complete |
| PulseLayout (uses GlobalNavbar) | ✅ Complete |
| OwnerLayout (uses GlobalNavbar + sidebar) | ✅ Complete |
| ManagerLayout (uses GlobalNavbar + sidebar) | ✅ Complete |
| Revenue Analytics Scope Selector | ✅ Complete |
| Night Cards (Comparison) | ✅ Complete |
| Guest Row → Customer Profile navigation | ✅ Complete |
| Calendar Popover (Venue Management) | ✅ Complete |
| /pulse/entry → /pulse/guest redirect | ✅ Complete |

### Data — Mock Guests (pg1-pg5) with full profiles
All 5 Pulse Entry guests have complete Customer Profile data in ownerData.js.

---

## P0 — Awaiting User Specs
- Pulse Inside, Profit Analysis, Venue Cost Detail, Customer Profile (complete spec)

## P1 — Upcoming
- GuestFullHistory.js integration into Manager & Pulse modules
- Backend API integration (replace mock data)
- CEO module (role-gated, spec pending)

## P2 — Backlog
- CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)
- Subscription & team invite APIs
- Financial Overview, Segments, Churn & Retention pages

## P3 — Future
- Refactor LandingPage.js, remove ManagerPage.legacy.js
- Split ownerData.js by domain

---

## Credentials
- **Owner/Manager User**: `teste@teste.com` / `12345`

## Known Issues
- KDS dropdown has duplicate `/kitchen` path for Kitchen and Bar items
- Pricing Cards on landing page (user verification pending, recurrence: 3)
