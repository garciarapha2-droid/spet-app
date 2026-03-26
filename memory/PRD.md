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
│   ├── app.json      # NFC entitlements: NDEF+TAG, NFCReaderUsageDescription
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
│   │   ├── config/api.ts — API_PREFIX = '/mapi' (bypasses broken ingress)
│   │   ├── components/ (TopNavbar, ui, ProductionUI)
├── frontend/
│   ├── src/setupProxy.js — /mapi → /api proxy (enables mobile API access)
├── backend/          # FastAPI + MongoDB
│   ├── routes/ (auth, tap, pulse, table, venue, ceo, nfc)
```

## CRITICAL: Mobile API Routing Fix
- **Problem**: Kubernetes ingress routes `/api/*` → backend, but fails from iOS devices (plain-text "404 page not found")
- **Fix**: Mobile uses `/mapi` prefix → ingress routes to frontend (port 3000) → setupProxy.js rewrites to `/api` → forwards to backend (port 8001)
- **DO NOT REVERT**: `API_PREFIX = '/mapi'` in config/api.ts, `/mapi` proxy in setupProxy.js

## NFC iOS Implementation (March 2026)
### Changes
1. **app.json**: Added `NFCReaderUsageDescription`, entitlements `["NDEF", "TAG"]`, `includeNdefEntitlement: true`
2. **NfcScanScreen.tsx**: Complete rewrite using `react-native-nfc-manager`:
   - Init NFC on mount (NfcManager.start())
   - Tap "Scan NFC" → NfcManager.requestTechnology(NfcTech.Ndef) → iOS native popup
   - Tag detected → extract UID + parse NDEF payload
   - Call backend /nfc/scan to resolve tag
   - Navigate to NfcResult (guest found or unregistered)
   - Debug panel with NFC supported/enabled/status/lastTag/lastError
3. **nfcService.ts**: Already had scanNfcTag() and normalizeTagUid() — used by new scan screen

### NFC Flow
```
NfcScanScreen → startNfcScan() → iOS "Ready to Scan" popup
  → Tag detected → extractTagUid(tag) → normalizeTagUid()
  → nfcService.scanNfcTag(uid, venueId)
  → Guest found → NfcResult (guest mode)
  → NOT_FOUND → NfcResult (unregistered mode, offer register)
```

## What's Been Implemented
- Full backend API (15/15 tests passing)
- Complete iPhone E2E flow with navigation wiring
- NFC reading on iOS with debug panel
- /mapi routing fix for iOS login
- Menu-first TabsMainScreen
- NfcResultScreen, CustomerProfileScreen

## P1 Backlog
- Web App: Migrate CeoOverview & CeoRevenue to real backend API
- Web App: Drag-and-drop Pipeline Kanban view
- Mobile: Re-enable expo-updates for OTA
- Web App: Pricing Cards landing page bug (recurring)

## P2 Future
- Page transition animations, Push notifications, Offline mode
