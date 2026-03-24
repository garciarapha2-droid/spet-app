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

## Prioritized Backlog

### P1
- Test mobile app on physical device (iPhone + Android)
- CeoOverview/CeoRevenue migration to real API (web)
- Drag-and-drop Pipeline Kanban (web)

### P2
- Push notifications (FCM + APNs)
- Offline mode / sync
- Biometric auth (Face ID / fingerprint)

### P3
- Landing page Pricing Cards fix
- Deep linking / universal links
- Batch NFC register

## Credentials
- CEO: garcia.rapha2@gmail.com / 12345
- Venue: 40a24e04-75b6-435d-bfff-ab0d469ce543 (Demo Club)
