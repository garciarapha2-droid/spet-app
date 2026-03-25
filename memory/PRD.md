# SPET — Mobile App Redesign PRD

## Original Problem Statement
Complete redesign of the iPhone app's user experience, navigation structure, and theming system. The app must be rebuilt to match a designer-provided mobile spec with premium execution quality and consistent dark/light theming.

## Core Requirements

### 1. Theme System (Dark & Light)
- Dark mode is the default
- Light mode available
- Respects iOS system appearance (`useColorScheme`)
- Manual override in Settings (Dark / Light / System)
- Persisted via SecureStore
- Semantic theme tokens only — no hardcoded colors
- Same layout in both themes; only colors change

### 2. iPhone Navigation (4 Bottom Tabs)
- **Entry** — Guest check-in, NFC scan, manual entry
- **Tabs** — Full POS ordering (Bar module)
- **Tables** — Table management grid
- **More** — Settings + Logout

### 3. Removed from iPhone
- CEO module
- Manager module
- Owner module
- Kitchen / KDS module
- Modules home screen
- Inside / Exit / Rewards Pulse sub-screens

### 4. Entry Module
- KPI row: Guests Inside, Total Entries, Denied
- NFC scan area with search
- Manual entry button → Guest registration
- Guest list with tier colors, status pills
- NFC unregistered tag → registration flow (not an error)

### 5. Tabs / Bar Module
- Mode toggle: TAP / TABLE
- Quick actions: Scan NFC, Search, Create guest
- Open tabs list (tappable, selectable)
- Menu categories with emojis
- Drink cards grid with one-tap add
- Order panel: items, quantities, send order
- Extras/Customization modal for every item
- Close tab modal: payment method → tip → confirmation

### 6. Tables Module
- Grid layout with status cards
- Filters: all / available / occupied / reserved
- Color-coded status badges

### 7. Settings (More tab)
- User info card
- Theme toggle (Dark/Light/System) with visual selector
- Active venue with switch option
- Privacy, Support, About links
- Logout button with confirmation

## Architecture

```
/app/mobile/
├── App.tsx                          # ThemeProvider → AuthProvider → VenueProvider → RootNavigator
├── src/
│   ├── theme/
│   │   ├── themes.ts                # Dark & light token definitions + spacing/radius/fontSize
│   │   └── colors.ts                # Backward-compat shim (re-exports dark theme)
│   ├── contexts/
│   │   └── ThemeContext.tsx          # Theme provider, useTheme() hook, persistence
│   ├── components/
│   │   ├── TopNavbar.tsx             # Shared: logo + title + theme toggle
│   │   ├── ui.tsx                    # Button, Input, Card, Chip, StatCard, etc.
│   │   └── ProductionUI.tsx          # ScreenWrapper, ErrorState, EmptyState, Skeleton
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # 4 bottom tabs + auth/venue gates
│   │   └── CustomTabBar.tsx          # Spec-aligned tab bar with indicator
│   ├── screens/
│   │   ├── entry/                    # EntryHome, NfcScan, GuestSearch, EntryDecision, GuestIntake, NfcRegister
│   │   ├── tabs/                     # TabsMainScreen (POS ordering with Extras modal)
│   │   ├── tables/                   # TablesHome, TableDetail
│   │   ├── settings/                 # SettingsScreen (theme toggle + logout)
│   │   ├── auth/                     # LoginScreen
│   │   └── venue/                    # VenueSelectScreen
│   ├── services/                     # API clients (tap, pulse, table, nfc, auth, venue)
│   └── hooks/                        # useAuth, useVenue, useWebSocket
```

## Tech Stack
- React Native + Expo (managed workflow)
- TypeScript
- React Navigation (native stack + bottom tabs)
- SecureStore for auth tokens + theme preference
- NFC via react-native-nfc-manager (lazy-loaded)
- expo-image-picker for guest photo capture

## API Endpoints Used
- `POST /api/auth/login` — Authentication
- `GET /api/venue/home` — Venues and modules
- `GET /api/tap/sessions?venue_id=` — Open tabs
- `GET /api/tap/catalog?venue_id=` — Menu items with categories
- `POST /api/tap/session/open` — Open new tab (FormData)
- `POST /api/tap/session/{id}/add` — Add item with modifiers (FormData)
- `GET /api/tap/session/{id}` — Session detail with items
- `POST /api/tap/session/{id}/close` — Close tab (FormData)
- `POST /api/tap/session/{id}/record-tip` — Record tip (FormData)
- `GET /api/pulse/inside?venue_id=` — Guests inside
- `GET /api/pulse/entries/today?venue_id=` — Today's entries
- `POST /api/pulse/guest/intake` — Register guest with photo (FormData)
- `GET /api/table/tables?venue_id=` — Tables list

## Test Credentials
- Email: garcia.rapha2@gmail.com / Password: 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Completed (Mar 2026)
- [x] Theme system with dark/light/system modes + persistence
- [x] Navigation restructured to 4 tabs (Entry, Tabs, Tables, More)
- [x] CEO/Manager/Owner/Kitchen removed from iPhone routes
- [x] Shared TopNavbar with theme toggle
- [x] Custom bottom tab bar per spec
- [x] Entry module redesign (KPIs, scan, guest list)
- [x] Tabs/Bar module as full POS ordering system
- [x] Extras/Customization modal for drink items
- [x] Close tab flow with payment location + tip
- [x] Tables module with grid and filters
- [x] Settings with theme selector + logout
- [x] All screens themed (no hardcoded colors)
- [x] TypeScript clean (zero errors on iPhone screens)
- [x] Backend API tests: 15/15 passing (iteration 94)
- [x] Full E2E flow validated: login → open tab → add items → close → tip → persistence
- [x] Bug fix: catalogItemId extraction (was truncating UUID)
- [x] Bug fix: stale selectedTab state after data refresh
- [x] Debug logging: URL visibility in api.ts request function
- [x] Guest registration with photo capture (expo-image-picker)
- [x] NFC unregistered tag → success flow (not error)
- [x] FormData used for all POST mutations (not JSON)

## Backlog
- (P1) Web App: Migrate CeoOverview & CeoRevenue to real backend API
- (P1) Web App: Drag-and-drop Pipeline Kanban
- (P2) Mobile: Re-enable expo-updates in app.json for OTA updates
- (P3) Web App: Pricing Cards landing page bug (recurring)
- (P3) Mobile: Animated tab bar indicator (spring animation)
- (P3) Mobile: Page transition animations
