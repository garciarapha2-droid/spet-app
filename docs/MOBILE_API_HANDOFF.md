# SPET Mobile App — Backend API Documentation for Mobile Agent

## Base URL
```
https://expo-sdk-upgrade-2.preview.emergentagent.com
```

All API endpoints are prefixed with `/api`.
All JSON responses are wrapped in: `{ "success": true, "data": {...}, "error": null }` or `{ "success": false, "data": null, "error": { "code": "...", "message": "..." } }`.

---

## Auth Flow

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "garcia.rapha2@gmail.com",
  "password": "12345"
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "a3f8b2c1...",
    "user": {
      "id": "8f562eb7-6bdc-4ab0-b450-6cbb4d984e11",
      "email": "garcia.rapha2@gmail.com",
      "name": "Raphael Garcia",
      "role": "ceo",
      "roles": [
        {
          "role": "ceo",
          "venue_id": "40a24e04-75b6-435d-bfff-ab0d469ce543",
          "company_id": "..."
        }
      ],
      "status": "active"
    },
    "next": { "type": "route", "route": "/app" }
  },
  "error": null
}
```

**Storage:** Save `access_token` in SecureStorage/AsyncStorage. Use it as `Authorization: Bearer <token>` in all subsequent requests.

**Token lifetime:** 7 days (168 hours). Use `refresh_token` for renewal.

### 2. Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refresh_token": "a3f8b2c1..."
}
```

**Response:** Same format as login.

### 3. Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refresh_token": "a3f8b2c1..."
}
```

---

## Venue Selection (after login)

### 4. Get Venues & Modules
```http
GET /api/venue/home
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "venues": [
      { "id": "40a24e04-75b6-435d-bfff-ab0d469ce543", "name": "Demo Club" }
    ],
    "active_venue": {
      "id": "40a24e04-75b6-435d-bfff-ab0d469ce543",
      "name": "Demo Club"
    },
    "modules": [
      { "key": "pulse", "name": "Pulse", "description": "Entry, Guests & Identity", "enabled": true, "locked_reason": null },
      { "key": "tap", "name": "TAP", "description": "Bar, Tabs & Checkout", "enabled": true, "locked_reason": null },
      { "key": "table", "name": "Table", "description": "Table Management & Orders", "enabled": true, "locked_reason": null }
    ],
    "user_email": "garcia.rapha2@gmail.com",
    "user_role": "ceo"
  }
}
```

**Flow:** After login, call this endpoint. If user has multiple venues, show venue picker. Store selected `venue_id` locally.

---

## NFC — Tag Registration & Scanning

### 5. Register NFC Tag
```http
POST /api/nfc/register
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "tag_uid": "04:A3:2B:1C:D4:E5:F6",
  "guest_id": "0902a609-a0e2-42b8-a64e-1655d2a84ac2",
  "venue_id": "40a24e04-75b6-435d-bfff-ab0d469ce543",
  "label": "Wristband Blue 001"
}
```

**`tag_uid`:** The raw UID read from the NFC chip (ISO 14443-A UID). The backend normalizes to uppercase. Send as-is from `react-native-nfc-manager`.

**Response (success):**
```json
{
  "success": true,
  "data": {
    "tag_id": "16feb349-8fdb-4d3a-b65e-f55e9e08a41a",
    "tag_uid": "04:A3:2B:1C:D4:E5:F6",
    "guest_id": "0902a609-a0e2-42b8-a64e-1655d2a84ac2",
    "guest_name": "Carlos NFC Test",
    "venue_id": "40a24e04-75b6-435d-bfff-ab0d469ce543",
    "status": "active",
    "label": "Wristband Blue 001",
    "assigned_by": "8f562eb7-6bdc-4ab0-b450-6cbb4d984e11",
    "created_at": "2026-03-24T09:12:44.659972+00:00",
    "message": "Tag registered successfully"
  }
}
```

**Error cases:**
- `404`: Guest not found in this venue
- `409`: Tag already assigned to another guest (must unlink first)

**Business rules:**
- One active tag per guest per venue (old tag auto-deactivated)
- One guest per tag per venue (no sharing)
- Re-registering an unlinked tag works (reactivates the row)

### 6. Scan NFC Tag (primary entry flow)
```http
POST /api/nfc/scan
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "tag_uid": "04:A3:2B:1C:D4:E5:F6",
  "venue_id": "40a24e04-75b6-435d-bfff-ab0d469ce543"
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "tag_uid": "04:A3:2B:1C:D4:E5:F6",
    "tag_id": "16feb349-8fdb-4d3a-b65e-f55e9e08a41a",
    "guest": {
      "id": "0902a609-a0e2-42b8-a64e-1655d2a84ac2",
      "name": "Carlos NFC Test",
      "email": "carlos.nfc@test.com",
      "phone": "+55119999-0001",
      "photo": null,
      "visits": 0,
      "spend_total": 0,
      "flags": [],
      "tags": [],
      "risk_chips": [],
      "value_chips": [],
      "last_visit": null
    },
    "tab": {
      "number": null,
      "total": 0,
      "has_open_tab": false
    },
    "scanned_at": "2026-03-24T09:12:54.351929+00:00"
  }
}
```

**Error cases:**
- `404`: No active binding for this tag in this venue

**`risk_chips`:** Array of `{ type, label, severity }` — "blocked" (critical), "flagged" (warning), "unpaid" (warning)
**`value_chips`:** Array of `{ type, label }` — "vip", "big_spender", "regular", "loyal"

**After scan:** Navigate to Entry Decision screen with guest data. If `tab.has_open_tab` is true, show existing tab.

### 7. Unlink NFC Tag
```http
POST /api/nfc/unlink
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "tag_uid": "04:A3:2B:1C:D4:E5:F6",
  "venue_id": "40a24e04-75b6-435d-bfff-ab0d469ce543"
}
```

**Response:**
```json
{ "success": true, "data": { "tag_uid": "04:A3:2B:1C:D4:E5:F6", "venue_id": "...", "status": "unlinked" } }
```

### 8. List Tags for Venue
```http
GET /api/nfc/tags?venue_id={venue_id}&status=active
Authorization: Bearer <token>
```

**Query params:** `status` can be `active`, `unlinked`, `replaced`, or `all`.

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "tag_id": "...",
        "tag_uid": "04:A3:2B:1C:D4:E5:F6",
        "guest_id": "...",
        "guest_name": "Carlos NFC Test",
        "guest_photo": null,
        "status": "active",
        "label": "Wristband Blue 001",
        "assigned_by": "...",
        "created_at": "...",
        "last_scanned": "2026-03-24T09:12:54.351929+00:00"
      }
    ],
    "total": 1
  }
}
```

---

## Guest Lookup (Fallback — no NFC)

### 9. Search Guests in Venue
```http
GET /api/pulse/guests/search?venue_id={venue_id}&q={query}
Authorization: Bearer <token>
```

**`q`:** Search by name, email, phone, or tab number. Min 2 chars.

**Response:**
```json
{
  "success": true,
  "data": {
    "guests": [
      {
        "id": "...",
        "name": "Sofia Cardoso",
        "email": "sofia@test.com",
        "phone": "+55...",
        "photo": "base64...",
        "visits": 5,
        "spend_total": 350,
        "flags": [],
        "tags": ["vip"],
        "tab_number": 106
      }
    ]
  }
}
```

### 10. Get Guest Profile (Decision Card)
```http
GET /api/pulse/guest/{guest_id}?venue_id={venue_id}
Authorization: Bearer <token>
```

**Response:** Full guest profile with risk_chips, value_chips, tab_number (same format as NFC scan response's `guest` field).

---

## Entry Decision Flow

### 11. Record Entry Decision
```http
POST /api/pulse/entry/decision
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `guest_id` | string | Yes | Guest UUID |
| `venue_id` | string | Yes | Venue UUID |
| `decision` | string | Yes | `"allowed"` or `"denied"` |
| `entry_type` | string | No | `"vip"`, `"cover"`, `"cover_consumption"`, `"consumption_only"` (default) |
| `cover_amount` | float | No | Cover charge amount (default 0) |
| `cover_paid` | bool | No | Whether cover was paid (default false) |

**Response:**
```json
{
  "success": true,
  "data": {
    "entry_id": "...",
    "decision": "allowed",
    "guest_id": "...",
    "tab_number": 106,
    "created_at": "..."
  }
}
```

**Side effects when `decision=allowed`:**
- Guest visit count incremented
- A `tap_session` (tab) is auto-created for the guest
- WebSocket event `guest_entered` broadcasted

### 12. Today's Entries
```http
GET /api/pulse/entries/today?venue_id={venue_id}
Authorization: Bearer <token>
```

---

## Pulse / Tab Flow

### 13. TAP Stats
```http
GET /api/tap/stats?venue_id={venue_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "open_tabs": 3,
    "running_total": 456.50,
    "closed_today": 12,
    "revenue_today": 2340.00
  }
}
```

### 14. Open Tabs
```http
GET /api/tap/sessions?venue_id={venue_id}&status=open
Authorization: Bearer <token>
```

### 15. Get Tab Items
```http
GET /api/tap/session/{session_id}/items
Authorization: Bearer <token>
```

### 16. Add Item to Tab
```http
POST /api/tap/session/{session_id}/item
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "product_id": "...",
  "name": "Caipirinha",
  "quantity": 2,
  "unit_price": 35.00,
  "category": "cocktails"
}
```

### 17. Close Tab
```http
POST /api/tap/session/{session_id}/close
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "payment_method": "card",
  "tip_amount": 15.00
}
```

### 18. Get Catalog (Menu)
```http
GET /api/tap/catalog?venue_id={venue_id}
Authorization: Bearer <token>
```

---

## WebSocket — Real-time Updates

```
wss://ceo-data-migration.preview.emergentagent.com/api/ws/manager/{venue_id}
```

**Events received:**
| Event | Payload | When |
|-------|---------|------|
| `guest_entered` | `{ guest_id, guest_name, tab_number }` | Entry decision = allowed |
| `nfc_scanned` | `{ guest_id, guest_name, tag_uid, tab_number }` | NFC tag scanned |
| `tab_updated` | `{ session_id, total, items_count }` | Item added/removed |
| `tab_closed` | `{ session_id, total, payment_method }` | Tab closed |

**Connection:** No auth header in WebSocket. The venue_id in the URL scopes the connection.

---

## Guest Registration (New Guest without NFC)

### 19. Register New Guest
```http
POST /api/pulse/guest/intake
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form fields:**
| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `email` | string | No |
| `phone` | string | No |
| `dob` | string | No (YYYY-MM-DD) |
| `venue_id` | string | Yes |
| `photo` | string | No (base64) |

**Response:**
```json
{
  "success": true,
  "data": {
    "guest_id": "...",
    "global_person_id": "...",
    "name": "New Guest",
    "created_at": "..."
  }
}
```

---

## Complete MVP Call Sequence

### Scenario A: NFC Entry (Happy Path)
```
1. POST /api/auth/login           → get token
2. GET  /api/venue/home            → get venues, select venue_id
3. [User taps NFC wristband]
4. POST /api/nfc/scan              → get guest + tab context
5.   if guest.flags includes "blocked" → show denied screen
6.   else → show Entry Decision screen
7. POST /api/pulse/entry/decision  → record "allowed" → auto-creates tab
8. [Guest is inside, tab is open]
```

### Scenario B: Manual Entry (Fallback)
```
1. POST /api/auth/login
2. GET  /api/venue/home
3. GET  /api/pulse/guests/search?q=Sofia  → find guest
4. GET  /api/pulse/guest/{id}?venue_id=X  → decision card
5. POST /api/pulse/entry/decision         → record entry
```

### Scenario C: New Guest + NFC Binding
```
1. POST /api/auth/login
2. GET  /api/venue/home
3. POST /api/pulse/guest/intake     → create guest
4. POST /api/nfc/register           → bind NFC tag to guest
5. POST /api/pulse/entry/decision   → allow entry
```

### Scenario D: Tab / Pulse Flow
```
1. GET  /api/tap/stats?venue_id=X        → dashboard
2. GET  /api/tap/sessions?venue_id=X     → list open tabs
3. GET  /api/tap/catalog?venue_id=X      → get menu
4. POST /api/tap/session/{id}/item       → add item
5. POST /api/tap/session/{id}/close      → close & pay
```

---

## Database Schema (NFC Tags)

```sql
nfc_tags (PostgreSQL):
  id            uuid PRIMARY KEY
  tag_uid       text NOT NULL          -- raw NFC UID (e.g. "04:A3:2B:1C:D4:E5:F6")
  guest_id      text NOT NULL          -- MongoDB venue_guests.id
  venue_id      text NOT NULL          -- venue UUID
  status        text DEFAULT 'active'  -- active | unlinked | replaced
  label         text                   -- human label (e.g. "Wristband Blue 001")
  assigned_by   text                   -- staff user_id who registered it
  created_at    timestamptz
  last_scanned  timestamptz

  UNIQUE (tag_uid, venue_id)
```

---

## NFC Integration Notes (react-native-nfc-manager)

```javascript
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

// Initialize on app start
await NfcManager.start();

// Read tag UID
async function readNfcTag() {
  await NfcManager.requestTechnology(NfcTech.NfcA);
  const tag = await NfcManager.getTag();
  // tag.id is the raw UID as hex string
  // Format: "04A32B1CD4E5F6" → normalize to "04:A3:2B:1C:D4:E5:F6"
  const uid = tag.id.match(/.{1,2}/g).join(':').toUpperCase();
  NfcManager.cancelTechnologyRequest();
  return uid;
}
```

**iOS specifics:**
- Requires `NFCReaderUsageDescription` in Info.plist
- Only works when app is in foreground
- iPhone 7+ supports reading; iPhone XS+ supports writing
- Shows system NFC sheet automatically

**Android specifics:**
- Requires `<uses-permission android:name="android.permission.NFC" />` in AndroidManifest.xml
- Supports background tag discovery via Intent filters
- Works on most Android phones with NFC hardware

---

## Test Credentials

| Account | Email | Password | Role |
|---------|-------|----------|------|
| CEO | garcia.rapha2@gmail.com | 12345 | ceo (full access) |
| Regular | teste@teste.com | 12345 | manager |

## Test Venue

| Name | ID |
|------|-----|
| Demo Club | 40a24e04-75b6-435d-bfff-ab0d469ce543 |

## Test NFC Data (already in DB)

| Tag UID | Guest | Status |
|---------|-------|--------|
| 04:A3:2B:1C:D4:E5:F6 | Carlos NFC Test | active |
