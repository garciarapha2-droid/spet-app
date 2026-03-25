# SPET — Mobile Bar/Venue Management App (iPhone Focus)

## Original Problem Statement
Complete redesign of the iPhone application's UX and navigation with a full theming system. Strict E2E operational flow for bar/venue staff: Login → NFC Scan → NFC Result → Entry Decision → Menu (Tap/Table) → Payment → Customer Profile (on demand).

## Core Business Rules
1. **NFC ALWAYS starts a NEW session at $0** — no carry-over from previous visits
2. **Historical data** (visits, lifetime spend) exists but is kept entirely separate from active session
3. **Items are added directly to the tab** — NO manual "create tab" step
4. **After NFC/Table** → go directly to MENU (no open tabs list as first step)
5. **Guest Profile** is for historical data only; never mixed with active session

## Architecture
```
/app
├── mobile/           # React Native / Expo (iPhone focus)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── auth/ (LoginScreen, ForgotPasswordScreen)
│   │   │   ├── entry/ (EntryHome, NfcScan, NfcResult, GuestSearch, EntryDecision, GuestIntake, NfcRegister, CustomerProfile)
│   │   │   ├── tabs/ (TabsMainScreen — Menu-first POS)
│   │   │   ├── tables/ (TablesHome, TableDetail)
│   │   │   ├── pulse/ (TabDetail, AddItem)
│   │   │   ├── settings/ (SettingsScreen)
│   │   ├── navigation/ (RootNavigator, CustomTabBar)
│   │   ├── services/ (api, authService, tapService, pulseService, nfcService, tableService)
│   │   ├── hooks/ (useAuth, useVenue)
│   │   ├── contexts/ (ThemeContext)
│   │   ├── theme/ (themes.ts — premium dark/light tokens)
│   │   ├── config/api.ts — API_PREFIX = '/mapi' (CRITICAL - see routing fix)
│   │   ├── components/ (TopNavbar, ui, ProductionUI)
├── frontend/
│   ├── src/setupProxy.js — /mapi → /api proxy (CRITICAL - enables mobile login)
├── backend/          # FastAPI + MongoDB
│   ├── routes/ (auth, tap, pulse, table, venue, ceo)
```

## CRITICAL: Mobile API Routing Fix (March 2026)

### Problem
The Kubernetes ingress routes `/api/*` to port 8001 (backend). This works from browsers and server-side curl. But from iOS devices, the same URL returns plain-text "404 page not found" (from the Go-based ingress/proxy layer). The response is NOT from FastAPI and NOT from React.

### Root Cause
The Emergent Kubernetes ingress + Cloudflare edge inconsistently handles `/api` path-based routing for external mobile device requests. The "404 page not found" comes from the ingress controller itself, not reaching the backend at all.

### Fix
- **`/mapi` prefix**: Mobile app uses `/mapi` instead of `/api`
- **setupProxy.js**: The frontend (port 3000) has a proxy rule that catches `/mapi/*`, rewrites it to `/api/*`, and forwards to port 8001
- **Request flow**: iPhone → `/mapi/auth/login` → ingress → port 3000 (no `/api` match) → setupProxy → `http://localhost:8001/api/auth/login` → JSON response

### Files changed
1. `/app/mobile/src/config/api.ts` — `API_PREFIX = '/mapi'`
2. `/app/frontend/src/setupProxy.js` — Added `/mapi` proxy with `pathRewrite: { '^/mapi': '/api' }`

### DO NOT REVERT
- `setupProxy.js` — Both `/api` and `/mapi` proxy rules are essential
- `API_PREFIX = '/mapi'` — This is what makes mobile login work
- `authService.ts` direct fetch with cache-busting — Still needed for iOS

## Navigation Flow (iPhone)
```
Login → VenueSelect → MainTabs
  ├── Entry Tab: EntryHome → NfcScan → NfcResult → [Open Tab → Menu] | [CustomerProfile] | [EntryDecision]
  ├── Tabs Tab: TabsMainScreen (Menu-first) → Close Tab → Tip
  ├── Tables Tab: TablesHome → [Occupied → Menu] | [Available → TableDetail]
  └── More Tab: Settings
```

## What's Been Implemented

### Backend (100% tested - 15/15)
- Full API: auth, tap, pulse, table, venue, CEO
- 28-item drink catalog
- E2E flow: login → open tab → add items → close → tip

### Mobile App (iPhone)
- NfcResultScreen, CustomerProfileScreen (NEW)
- TabsMainScreen refactored to menu-first with route params
- Complete navigation wiring
- /mapi routing fix for iOS login

### Web Frontend
- Landing page, login, CEO dashboards
- setupProxy.js with /api and /mapi proxy rules

## P1 Backlog
- Web App: Migrate CeoOverview & CeoRevenue to real backend API
- Web App: Drag-and-drop Pipeline Kanban view
- Mobile: Re-enable expo-updates for OTA
- Web App: Pricing Cards landing page bug (recurring >4x)

## P2 Future
- Page transition animations
- Push notifications
- Offline mode for mobile
