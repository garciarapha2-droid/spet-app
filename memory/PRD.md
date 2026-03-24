# SPET — Product Requirements Document

## Original Problem Statement
Nightlife management SaaS with modules: Owner, Manager, Pulse, CEO OS.
The CEO OS module includes a full CRM with Pipeline, Customer Base, and executive dashboards.
The platform is being prepared for native mobile app (React Native) with real NFC support.

## Architecture
```
/app
├── backend/         FastAPI + PostgreSQL + MongoDB
│   ├── routes/
│   │   ├── nfc.py              # NFC tag register/scan/unlink/list
│   │   ├── crm.py              # CRM CRUD (deals, customers, activities)
│   │   ├── ceo_analytics.py    # Security, Reports, Revenue analytics
│   │   ├── pulse.py            # Guest intake, entry, search
│   │   ├── tap.py              # Tabs, catalog, items
│   │   ├── venue.py            # Venue home, module access
│   │   └── auth.py             # Login, signup, refresh, logout
│   ├── migrations/
│   │   ├── crm_migration.py
│   │   └── nfc_migration.py    # nfc_tags table
│   └── ws_manager.py           # WebSocket real-time
└── frontend/        React (CRA) + Tailwind + Shadcn UI
    └── src/
        ├── services/crmService.js    # Real API layer
        ├── hooks/useCrmData.js       # React hooks for CRM
        └── pages/ceo/               # All CEO pages on real API
```

## Database Schema

### PostgreSQL Tables
- **nfc_tags**: id, tag_uid (UNIQUE per venue), guest_id, venue_id, status, label, assigned_by, created_at, last_scanned
- **deals**: id, contact_name, contact_email, company_name, plan_id, stage, deal_value, notes, ...
- **deal_activities**: id, deal_id, type, description, created_at
- **customers**: id, company_name, contact_name, plan_id, status, mrr, modules_enabled, ...
- **tap_sessions**: venue_id, guest_id, session_type, status, total, meta, ...
- **entry_events**: venue_id, guest_id, decision, entry_type, cover_amount, ...
- **global_persons**: id, email_hash, phone_hash (cross-venue dedupe)

### MongoDB Collections
- **venue_guests**: PII (name, email, phone, photo, flags, tags, spend_total, visits)
- **venue_configs**: Venue settings, module configs
- **venue_catalog**: Menu/products
- **refresh_tokens**: JWT refresh tokens

## API Endpoints Summary

### NFC (/api/nfc/*)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /nfc/register | Bind NFC tag to guest |
| POST | /nfc/scan | Scan tag → return guest + context |
| POST | /nfc/unlink | Deactivate tag binding |
| GET | /nfc/tags | List venue tags |

### CRM (/api/crm/*)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /crm/deals | List deals |
| GET | /crm/customers | List customers |
| GET | /crm/customers/{id} | Single customer |
| PUT | /crm/customers/{id} | Update customer |
| GET | /crm/analytics/security | Security alerts |
| GET | /crm/analytics/reports | Pipeline funnel |
| GET | /crm/analytics/revenue-targets | Revenue targets |

### Pulse (/api/pulse/*)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /pulse/guest/intake | Register new guest |
| GET | /pulse/guest/{id} | Decision card |
| POST | /pulse/entry/decision | Allow/deny entry |
| GET | /pulse/entries/today | Today's entries |

### TAP (/api/tap/*)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tap/stats | Real-time stats |
| GET | /tap/sessions | Open/closed tabs |
| POST | /tap/session/{id}/item | Add item to tab |
| POST | /tap/session/{id}/close | Close tab |

## Testing History
- iteration_87: 28/28 (CEO analytics migration)
- iteration_88: 27/27 (NFC backend + regression tests)

## What's Complete
- [x] Full CRM backend (deals, customers, activities)
- [x] CEO OS pages on real API (Security, Reports, Users, Layout)
- [x] NFC backend: nfc_tags table + register/scan/unlink/list endpoints
- [x] CORS configured for mobile (Expo/React Native)
- [x] Mobile API documentation (/app/docs/MOBILE_API_HANDOFF.md)
- [x] WebSocket real-time events (guest_entered, nfc_scanned, tab_updated)

## Prioritized Backlog

### P0 — DONE
- ~~NFC backend infrastructure~~
- ~~CORS for mobile~~
- ~~API documentation for Mobile Agent~~

### P1 — Mobile App (React Native)
- Auth screen + SecureStorage
- Venue selection screen
- NFC scan screen (react-native-nfc-manager)
- Entry decision screen
- Guest lookup (manual fallback)
- Pulse/Tab flow
- WebSocket real-time

### P1 — Web Improvements
- Migrate CeoOverview/CeoRevenue from ceoData.js to real API
- Drag-and-drop Pipeline Kanban
- Global CEO navigation link

### P2
- Push notifications (FCM + APNs)
- Offline mode / sync
- Owner/Manager backend migration

### P3
- Landing page Pricing Cards fix (3x recurrence)
- Biometric auth
- Deep linking

## User Accounts
- CEO: garcia.rapha2@gmail.com / 12345
- Regular: teste@teste.com / 12345
- Test venue: 40a24e04-75b6-435d-bfff-ab0d469ce543
