# SPET Mobile App — React Native / Expo

## Overview

MVP operacional do SPET para venues. **100% conectado ao backend real.**
Foco: Entry (NFC + search), Tab management, Guest registration.

---

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app no device (App Store / Google Play)
- Para NFC: device físico com NFC (iPhone 7+ / Android com NFC)

### Install & Run

```bash
cd /app/mobile
npx expo install  # instala dependências nativas corretas
npx expo start    # inicia dev server
```

### Conectar ao Device

1. **iPhone:** Abra a câmera → escaneie o QR code do terminal
2. **Android:** Abra Expo Go → escaneie o QR code

### Build para device (NFC real)

NFC **não funciona** no Expo Go. Para NFC real, faça um development build:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Configurar projeto
eas login
eas build:configure

# Build de desenvolvimento (iOS)
eas build --profile development --platform ios

# Build de desenvolvimento (Android)
eas build --profile development --platform android
```

---

## Backend API

O app consome o backend real em:
```
https://iphone-ux-redesign.preview.emergentagent.com/api
```

Para alterar, edite `/app/mobile/src/config/api.ts`.

### Test Credentials
| Account | Email | Password |
|---------|-------|----------|
| CEO | garcia.rapha2@gmail.com | 12345 |

### Test Venue
| Name | ID |
|------|-----|
| Demo Club | 40a24e04-75b6-435d-bfff-ab0d469ce543 |

---

## Architecture

```
/app/mobile/
├── App.tsx                          # Entry point
├── app.json                         # Expo config (NFC permissions)
├── src/
│   ├── config/
│   │   └── api.ts                   # API base URL
│   ├── services/
│   │   ├── api.ts                   # HTTP client + JWT auth + SecureStore
│   │   ├── authService.ts           # Login / refresh / logout
│   │   ├── venueService.ts          # Venue home
│   │   ├── nfcService.ts            # Register / scan / unlink / normalize UID
│   │   ├── pulseService.ts          # Guest intake / search / entry decision
│   │   └── tapService.ts            # Tabs / items / catalog / close
│   ├── hooks/
│   │   ├── useAuth.tsx              # Auth context + provider
│   │   ├── useVenue.tsx             # Venue context + provider
│   │   └── useWebSocket.ts          # Real-time events
│   ├── navigation/
│   │   └── RootNavigator.tsx        # Auth → VenueSelect → MainTabs
│   ├── screens/
│   │   ├── auth/LoginScreen.tsx
│   │   ├── venue/VenueSelectScreen.tsx
│   │   ├── entry/
│   │   │   ├── EntryHomeScreen.tsx   # Main: NFC Scan + Search + New Guest
│   │   │   ├── NfcScanScreen.tsx     # Real NFC read → POST /nfc/scan
│   │   │   ├── GuestSearchScreen.tsx # Manual search
│   │   │   ├── EntryDecisionScreen.tsx # Allow / Deny with chips
│   │   │   ├── GuestIntakeScreen.tsx   # Register new guest
│   │   │   └── NfcRegisterScreen.tsx   # Bind tag to guest
│   │   └── pulse/
│   │       ├── PulseHomeScreen.tsx   # Stats + open tabs list
│   │       ├── TabDetailScreen.tsx   # View/manage tab items
│   │       └── AddItemScreen.tsx     # Browse catalog, add to tab
│   ├── components/
│   │   └── ui.tsx                   # Button, Input, Card, Chip, etc.
│   └── theme/
│       └── colors.ts                # Dark theme + spacing + typography
```

---

## NFC Implementation

### Library
`react-native-nfc-manager` v3.15+

### How it works
1. App calls `NfcManager.requestTechnology(NfcTech.NfcA)`
2. iOS shows system NFC sheet / Android waits for tag
3. User touches wristband to phone
4. App reads `tag.id` (raw hex UID)
5. `normalizeTagUid()` converts to `"04:A3:2B:1C:D4:E5:F6"` format
6. App sends to `POST /api/nfc/scan` with venue_id
7. Backend returns guest profile + tab context
8. App navigates to Entry Decision screen

### iOS Requirements
- `Info.plist` → `NFCReaderUsageDescription` (already configured in app.json)
- iPhone 7+ for reading
- App must be in foreground
- System NFC sheet appears automatically

### Android Requirements
- `AndroidManifest.xml` → `<uses-permission android:name="android.permission.NFC" />` (configured)
- Device with NFC hardware
- Works in foreground and background (via intent filters)

### Testing NFC on Physical Device
1. Build development version via `eas build --profile development`
2. Install on device
3. Go to Entry → Scan NFC
4. Hold phone near NFC tag/wristband
5. Tag UID is read and sent to backend
6. If tag is registered → shows guest and Entry Decision
7. If not registered → shows error with option to register or search manually

---

## Screens

### 1. Login
- Email + password → JWT
- Token stored in SecureStore (encrypted)
- Auto-refresh on app reopen

### 2. Venue Selection
- Lists venues from `GET /api/venue/home`
- Auto-selects if only one venue
- Accessible from bottom tab

### 3. Entry Home
- Two main actions: **Scan NFC** and **Search Guest**
- Shows today's entry count (real-time via WebSocket)
- "New Guest" option for unregistered guests

### 4. NFC Scan
- Real NFC hardware scan
- Handles: success, not found, cancelled, NFC not available
- Fallback to manual search

### 5. Guest Search
- Debounced search (400ms)
- Shows name, phone, visits, spend, VIP badge, tab number
- Tap to open Entry Decision

### 6. Entry Decision
- Guest avatar with initial
- Risk chips (blocked, flagged) + value chips (VIP, big spender)
- Visit count + total spend
- Open tab indicator
- Allow (green) / Deny (red) buttons
- Blocked guests see forced deny

### 7. Guest Intake
- Name (required), phone, email
- After creation: option to bind NFC tag

### 8. NFC Register
- Read NFC tag → bind to guest
- Optional label (e.g. "Wristband Blue 001")
- Handles duplicate tag error

### 9. Pulse Home (Tabs)
- Stats: open tabs, running total, today's revenue
- List of open tabs with pull-to-refresh
- Real-time updates via WebSocket

### 10. Tab Detail
- Running total
- Item list with quantity × price
- Add Item + Close Tab actions
- Payment method selection (Card/Cash/Pix)

### 11. Add Item
- Catalog grouped by category
- Search filter
- Tap to add item
- "Add More" or "Done" after adding

---

## WebSocket Events

Connected to: `wss://[host]/api/ws/manager/{venue_id}`

| Event | Action |
|-------|--------|
| `guest_entered` | Increment entry count |
| `nfc_scanned` | Update entry count |
| `tab_updated` | Refresh tab list |
| `tab_closed` | Refresh tab list |

Auto-reconnects after 3 seconds on disconnect.

---

## Design

- **Dark theme** (bg: #0A0A0F) — premium nightlife aesthetic
- **Touch targets** ≥ 44px minimum (most are 56px)
- **Minimal steps** per operation (NFC scan → decision = 2 taps)
- **Clear feedback** — loading overlays, success alerts, error messages
- **Purple accent** (#7C3AED) + green success (#1FAA6B) + red danger (#E03131)
