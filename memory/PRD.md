# SPET - CEO OS Platform

## Original Problem Statement
Build a "CEO OS" module for a web app, expanded into a full-build mission: transform the React Native/Expo mobile app into a true 1:1 operational version of the web platform. The app is intended for **App Store publication** and must be **production-ready for real users**.

## User Personas
- **CEO**: Full platform visibility (revenue, pipeline, users, security)
- **Owner**: Business intelligence (finance, customers, growth, insights, venues)
- **Manager**: Operational control (staff, menu, shifts, tips, reports, guests)
- **Staff/Bartender**: Operational tasks (entry, tabs, tables, kitchen)

## Core Requirements
1. Full-stack web application (React/FastAPI/PostgreSQL) ✅
2. Mobile app (React Native/Expo SDK 54) — 1:1 parity with web ✅
3. Production-quality: error states, empty states, skeleton loading, pull-to-refresh, safe areas ✅
4. Real-time operations via WebSocket ✅
5. NFC integration for guest wristbands ✅
6. Multi-role dashboards (CEO, Owner, Manager) ✅

## Architecture
```
/app
├── backend/          # FastAPI + PostgreSQL (18 route modules)
├── frontend/         # React web app (all pages)
└── mobile/           # React Native / Expo SDK 54
    ├── App.tsx       # ErrorBoundary + SplashScreen
    ├── src/
    │   ├── components/
    │   │   ├── ui.tsx           # Base UI components
    │   │   └── ProductionUI.tsx # ScreenWrapper, ErrorState, EmptyState, SkeletonLoader, useAsyncData
    │   ├── screens/  (29 screens across 9 modules)
    │   │   ├── auth/       # LoginScreen
    │   │   ├── venue/      # VenueSelectScreen
    │   │   ├── entry/      # EntryHome, NfcScan, GuestSearch, EntryDecision, GuestIntake, NfcRegister
    │   │   ├── pulse/      # PulseHome, TabDetail, AddItem, PulseInside, PulseExit, PulseBar, PulseRewards
    │   │   ├── tables/     # TablesHome, TableDetail
    │   │   ├── kitchen/    # KitchenScreen
    │   │   ├── manager/    # ManagerDashboard (8 tabs)
    │   │   ├── ceo/        # CeoDashboard (6 tabs)
    │   │   ├── owner/      # OwnerDashboard (7 tabs)
    │   │   ├── modules/    # ModulesHome (hub)
    │   │   └── settings/   # SettingsScreen
    │   ├── services/ (13 API service files)
    │   ├── hooks/    (useAuth, useVenue, useWebSocket)
    │   ├── navigation/ (RootNavigator — 5 bottom tabs)
    │   └── theme/    (colors, spacing, typography)
    ├── app.json      # Production-configured
    └── eas.json      # Build profiles
```

## Production-Quality Standards (2026-03-25)
- **Error Boundary**: App-level crash recovery with restart
- **Error States**: Every API-consuming screen has retry-capable error UI
- **Empty States**: Meaningful icons + messages for zero-data scenarios
- **Skeleton Loading**: Animated pulse skeletons (KPI cards, list items)
- **Pull-to-Refresh**: All data screens support pull-to-refresh via ScreenWrapper
- **Safe Areas**: SafeAreaProvider + useSafeAreaInsets on all screens
- **Keyboard Handling**: Dismiss on scroll, persist taps
- **Accessibility**: accessibilityRole, accessibilityLabel, accessibilityState on interactive elements
- **Number Formatting**: fontVariant: ['tabular-nums'] for financial data
- **Splash Screen**: expo-splash-screen prevents white flash on launch
- **Icons**: All Feather vector icons (no Unicode emojis)
- **iPad Support**: Responsive grid layouts (numColumns adapts to screen width)

## API Endpoints (24/24 Verified)
All endpoints tested and passing. See /app/test_reports/iteration_91.json.

## Test Reports
- iteration_89.json: Web Support & Privacy (17/17 pass)
- iteration_90.json: Mobile Dashboard APIs (17/17 pass)
- iteration_91.json: Comprehensive Mobile APIs (24/24 pass)

## Prioritized Backlog

### P0 (Complete)
- [x] Wave 1: Full operational + dashboard parity foundation
- [x] Production hardening: error/empty/skeleton states, safe areas, accessibility

### P1 (Next)
- [ ] Wave 2: UX Polish — animations, transitions, haptic feedback
- [ ] Web: Migrate CeoOverview & CeoRevenue to real backend API
- [ ] Web: Drag-and-drop Pipeline Kanban
- [ ] Mobile: Tap/Orders dedicated catalog/cart flow

### P2
- [ ] Push Notifications
- [ ] Offline synchronization
- [ ] Biometric authentication

### P3
- [ ] Web: Fix recurring Pricing Cards landing page bug
- [ ] Production error tracking (Sentry)
- [ ] Analytics integration

## Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543
