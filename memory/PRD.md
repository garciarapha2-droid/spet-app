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
│   │   ├── components/ (TopNavbar, ui, ProductionUI)
├── frontend/         # React web (landing + CEO dashboard)
├── backend/          # FastAPI + MongoDB
│   ├── routes/ (auth, tap, pulse, table, venue, ceo)
```

## Navigation Flow (iPhone)
```
Login → VenueSelect → MainTabs
  ├── Entry Tab: EntryHome → NfcScan → NfcResult → [Open Tab → Menu] | [CustomerProfile] | [EntryDecision]
  ├── Tabs Tab: TabsMainScreen (Menu-first) → Close Tab → Tip
  ├── Tables Tab: TablesHome → [Occupied → Menu] | [Available → TableDetail]
  └── More Tab: Settings
```

## What's Been Implemented

### Session 1-3 (Previous)
- Full backend API (auth, tap, pulse, table, venue, CEO)
- Web frontend (landing, login, CEO dashboards)
- Mobile app scaffolding with theming
- 28-item drink catalog seeded
- Backend E2E tests: 15/15 passing

### Session 4 (Current - Feb 2026)
- **NfcResultScreen** — Post-scan decision point showing guest info, lifetime stats, new session at $0, and action buttons (Open Tab & Go to Menu, View Profile, Entry Decision)
- **CustomerProfileScreen** — Historical-only guest profile (visits, spend, tags, flags, NFC info)
- **TabsMainScreen refactored to menu-first** — Route params from NFC/Table auto-select session; collapsible tabs list; quick action buttons (Scan NFC, Search, Tabs toggle)
- **Navigation wiring complete** — NfcResult and CustomerProfile added to EntryStack; ForgotPassword added to auth flow
- **GuestSearch → NfcResult** (instead of EntryDecision)
- **GuestIntake → NfcResult** after guest creation
- **NfcRegister → NfcResult** after NFC binding
- **EntryDecision** now auto-opens tab and navigates to Menu on "Allow"
- **Tables → Menu directly** for occupied tables with session context
- **Table schema alignment** — Fixed `table_number` field mapping
- **EntryHome guest list** → tap guest navigates to NfcResult
- **NfcScan unregistered tag** → navigates to NfcResult (unregistered mode)
- Backend tests: 15/15 passing (iteration_95)

## Key Technical Decisions
- **Networking patches**: `setupProxy.js` on web frontend and `authService.ts` direct fetch with cache-busting must NOT be removed
- **FormData**: All TAP POST endpoints require FormData, not JSON
- **Theme tokens**: Premium dark/light with tier colors (gold/silver/bronze/platinum), status colors, glass-morphism

## P1 Backlog
- Web App: Migrate CeoOverview & CeoRevenue to real backend API
- Web App: Drag-and-drop Pipeline Kanban view
- Mobile: Re-enable expo-updates for OTA
- Web App: Pricing Cards landing page bug (recurring >4x)
- Validate mobile login on physical iPhone device
- Cleanup legacy web screens from mobile app

## P2 Future
- Page transition animations
- Push notifications
- Offline mode for mobile
