# SPET - CEO OS Platform

## Original Problem Statement
Build a "CEO OS" module for a web app. This expanded into a full-build mission to transform the existing React Native/Expo mobile app into a true 1:1 operational version of the web platform, achieving complete feature and design parity.

## User Personas
- **CEO**: Full platform visibility (revenue, pipeline, users, security)
- **Owner**: Business intelligence (finance, customers, growth, insights, venues)
- **Manager**: Operational control (staff, menu, shifts, tips, reports, guests)
- **Staff/Bartender**: Operational tasks (entry, tabs, tables, kitchen)

## Core Requirements
1. **Full-stack web application** - React/FastAPI/PostgreSQL ✅
2. **Mobile app (React Native/Expo)** - 1:1 parity with web ✅ (Wave 1 Complete)
3. **Real-time operations** - WebSocket for live updates ✅
4. **NFC integration** - Guest wristband scanning ✅
5. **Multi-role dashboards** - CEO, Owner, Manager ✅

## Architecture
```
/app
├── backend/          # FastAPI + PostgreSQL
│   ├── routes/       # 18 route modules
│   └── server.py     # Main app
├── frontend/         # React web app
│   └── src/
│       ├── pages/    # All web pages
│       └── components/
└── mobile/           # React Native / Expo SDK 54
    ├── src/
    │   ├── screens/  # 17+ screens
    │   ├── services/ # 12 API services
    │   ├── hooks/    # Auth, Venue, WebSocket
    │   ├── components/
    │   ├── navigation/
    │   └── theme/
    ├── app.json
    └── eas.json
```

## What's Been Implemented

### Web App (Complete)
- Landing page, Auth, Onboarding
- All operational modules (Pulse, Tap, Tables, Kitchen)
- Manager Dashboard (11 tabs)
- CEO Dashboard (7 pages)
- Owner Dashboard (7+ sub-modules)
- Support form with Resend email integration
- Privacy Policy page

### Mobile App - Wave 1 COMPLETE (2026-03-25)
**Navigation**: 5-tab bottom bar (Entry, Tabs, Tables, Kitchen, More)
**Screens implemented**:
- Auth: LoginScreen
- Venue: VenueSelectScreen
- Entry: EntryHome, NfcScan, GuestSearch, EntryDecision, GuestIntake, NfcRegister
- Pulse/Tabs: PulseHome (with Inside/Exit/Bar/Rewards quick-nav), TabDetail, AddItem, PulseInside, PulseExit, PulseBar, PulseRewards
- Tables: TablesHome, TableDetail
- Kitchen: KitchenScreen
- Manager Dashboard: 8-tab dashboard (Overview, Staff, Menu, Shifts, Tips, Guests, Reports, Loyalty)
- CEO Dashboard: 6-tab dashboard (Overview, Revenue, Pipeline, Users, Security, Reports)
- Owner Dashboard: 7-tab dashboard (Overview, Performance, Finance, Customers, Growth, Insights, System)
- Modules Hub: Central navigation to all dashboards
- Settings: User info, venue switch, privacy, support, logout

**Services**: 12 API service files covering all backend endpoints
**Icons**: All Unicode emojis replaced with Feather vector icons
**Data mapping**: All dashboard screens verified against real API responses (17/17 tests passed)

## Prioritized Backlog

### P0 (In Progress)
- [x] Wave 1: Full operational + dashboard parity foundation
- [ ] Wave 2: Refinement + performance + UX polish
  - Animations and transitions
  - Pull-to-refresh on all screens
  - Error states and retry UX
  - Loading skeletons

### P1
- [ ] Web: Migrate CeoOverview & CeoRevenue to real backend API
- [ ] Web: Drag-and-drop for Pipeline Kanban view
- [ ] Mobile: Tap/Orders dedicated catalog/cart flow

### P2
- [ ] Mobile: Push Notifications
- [ ] Mobile: Offline synchronization
- [ ] Mobile: Biometric authentication

### P3
- [ ] Web: Fix recurring Pricing Cards landing page bug
- [ ] Production hardening (error tracking, analytics)

## API Endpoints (All Verified)
- Auth: POST /api/auth/login
- CEO: /api/ceo/health, /revenue, /pipeline, /users, /targets, /companies, /alerts
- Owner: /api/owner/dashboard, /finance, /venues, /insights, /growth, /people, /system
- Manager: /api/manager/overview, /staff, /shifts, /reports/sales, /guests, /tips-detail
- Tap: /api/tap/stats, /sessions, /catalog
- Table: /api/table/tables
- Kitchen: /api/kds/tickets
- Rewards: /api/rewards/config
- Pulse: /api/pulse/inside, /exits/today, /bar/search

## Test Reports
- iteration_89.json: Web Support & Privacy (17/17 pass)
- iteration_90.json: Mobile Dashboard APIs (17/17 pass)

## Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543
