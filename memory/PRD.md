# SPET — Product Requirements Document

## Original Problem Statement
Nightlife management SaaS with modules: Owner, Manager, Pulse, CEO OS.
The platform includes a web app (React) and a native mobile app (React Native/Expo) for venue operations.

## Architecture Overview
```
/app
├── backend/          FastAPI + PostgreSQL + MongoDB
│   ├── routes/
│   │   ├── nfc.py              # NFC tag register/scan/unlink/list
│   │   ├── crm.py              # CRM CRUD (deals, customers)
│   │   ├── ceo_analytics.py    # Security, Reports, Revenue
│   │   ├── pulse.py            # Guest intake, entry, search
│   │   ├── tap.py              # Tabs, catalog, items
│   │   ├── venue.py            # Venue home, modules
│   │   └── auth.py             # Login, signup, refresh
│   ├── migrations/
│   │   ├── crm_migration.py
│   │   └── nfc_migration.py
│   └── ws_manager.py           # WebSocket real-time
├── frontend/         React (CRA) + Tailwind + Shadcn UI (Web)
└── mobile/           React Native + Expo (Native App)
    ├── App.tsx
    └── src/
        ├── services/  (6 services — api, auth, venue, nfc, pulse, tap)
        ├── hooks/     (3 hooks — useAuth, useVenue, useWebSocket)
        ├── screens/   (11 screens across auth, venue, entry, pulse)
        ├── navigation/ (RootNavigator with Auth/Venue/MainTabs)
        ├── components/ (shared UI components)
        └── theme/     (dark theme, spacing, typography)
```

## Database Schema

### PostgreSQL
- **nfc_tags**: id, tag_uid, guest_id, venue_id, status, label, assigned_by, created_at, last_scanned
- **deals**: id, company_name, contact_name, plan_id, stage, deal_value, notes, ...
- **customers**: id, company_name, contact_name, plan_id, status, mrr, modules_enabled, ...
- **tap_sessions**: id, venue_id, guest_id, status, total, meta, opened_at, ...
- **entry_events**: id, venue_id, guest_id, decision, entry_type, ...

### MongoDB
- **venue_guests**: PII (name, email, phone, photo, flags, tags, spend_total, visits)
- **venue_configs**: Venue settings
- **venue_catalog**: Menu/products

## Testing History
- iteration_87: 28/28 (CEO analytics migration)
- iteration_88: 27/27 (NFC backend + regression)

## What's Complete

### Web App
- [x] Full CRM backend + frontend (Pipeline, Customers, Analytics)
- [x] CEO OS pages on real API (Security, Reports, Users, Overview partial)
- [x] Theme toggle (dark/light)
- [x] All legacy pages preserved

### Backend for Mobile
- [x] NFC infrastructure (nfc_tags table + 4 endpoints)
- [x] CORS configured for mobile (Expo + React Native)
- [x] JWT auth mobile-ready (SecureStore compatible)
- [x] API documentation (/app/docs/MOBILE_API_HANDOFF.md)

### Mobile App (React Native / Expo)
- [x] Project structure (24 TypeScript files)
- [x] Auth flow (Login → SecureStore → auto-refresh)
- [x] Venue selection (auto-select single venue)
- [x] Entry Home (NFC Scan + Search + New Guest)
- [x] NFC Scan (react-native-nfc-manager integration)
- [x] Guest Search (debounced, results with VIP/tab badges)
- [x] Entry Decision (allow/deny with risk/value chips)
- [x] Guest Intake (create new guest + optional NFC binding)
- [x] NFC Register (bind tag to guest)
- [x] Pulse/Tabs (stats, open tabs, items, add item, close tab)
- [x] WebSocket real-time (auto-reconnect)
- [x] Dark theme + premium aesthetic
- [x] Touch targets >= 44px
- [x] Expo SDK 54 upgrade complete
- [x] NFC bridge for Expo Go compatibility
- [x] 0 TypeScript errors
- [x] API timeout + network error fallback (15s AbortController)
- [x] WS_BASE_URL derived from API_BASE_URL (single source of truth)
- [x] EAS project configured (@raphazitto/spet-mobile, ID: 5073c0c3-bea4-43e8-a6f0-c133b29b82ff)
- [x] app.json production-ready (buildNumber, versionCode, scheme, OTA updates, NFC permissions)
- [x] eas.json with dev/preview/production profiles + autoIncrement + submit config
- [x] Build scripts in package.json (build:ios, build:android, build:all, submit:ios, submit:android)

## Prioritized Backlog

### P0 (Blockers para Store Release)
- [ ] Criar ícone real do app (1024x1024 PNG) — substituir assets/icon.png e adaptive-icon.png
- [ ] Criar splash screen real — substituir assets/splash.png
- [ ] Configurar Apple Developer Account + App Store Connect
- [ ] Configurar Google Play Console + Service Account Key (play-store-key.json)
- [ ] Criar Privacy Policy e Support URL reais
- [ ] Definir API URL de produção em src/config/api.ts

### Completed (this session)
- [x] Privacy Policy page (/privacy) — 8 legal sections, PageNavbar, PageFooter
- [x] Support page (/support) — contact form, Zod validation, file attachments UI, Resend email integration
- [x] POST /api/support backend endpoint — Resend SDK, input validation, HTML email to support@spetapp.com
- [x] Footer links (Privacy Policy + Support) on landing, privacy, and support pages
- [x] App icons replaced with real SPET icon (1024x1024, no transparency)
- [x] Splash screen generated with SPET logo
- [x] Mobile Expo SDK 54 verified — 0 TypeScript errors
- [x] Mobile API timeout/fallback (15s AbortController)
- [x] Mobile WS_BASE_URL derived from API_BASE_URL
- [x] EAS project configured (@raphazitto/spet-mobile, ID: 5073c0c3-bea4-43e8-a6f0-c133b29b82ff)

### P1
- CeoOverview/CeoRevenue migration to real API (web)
- Drag-and-drop Pipeline Kanban (web)

### P2
- Push notifications (FCM + APNs)
- Offline mode / sync
- Biometric auth (Face ID / fingerprint)

### P3
- Landing page Pricing Cards fix (recorrente x3)
- Deep linking / universal links
- Batch NFC register

## Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Venue: 40a24e04-75b6-435d-bfff-ab0d469ce543 (Demo Club)
