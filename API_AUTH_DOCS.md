# SPET API — Authentication + Handoff Documentation
# Base URL: https://pulse-pos-system.preview.emergentagent.com
# Production: https://spetapp.com (when deployed)

---

## LOVABLE → EMERGENT AUTH HANDOFF

Two methods are available. Use whichever fits best:

### Method 1: Token Handoff (Simpler)

After login/signup on Lovable, redirect directly with the JWT:

```
https://pulse-pos-system.preview.emergentagent.com/auth/handoff?token=<JWT>
```

**Lovable code example:**
```javascript
// After successful login
const res = await fetch("https://pulse-pos-system.preview.emergentagent.com/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await res.json();

// Redirect to Emergent app — user lands directly on dashboard
window.location.href = `https://pulse-pos-system.preview.emergentagent.com/auth/handoff?token=${data.access_token}`;
```

### Method 2: One-Time Code (More Secure)

Uses a short-lived one-time code exchange (code expires in 60 seconds):

```javascript
// Step 1: Login
const loginRes = await fetch("https://pulse-pos-system.preview.emergentagent.com/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { access_token } = await loginRes.json();

// Step 2: Create handoff code
const handoffRes = await fetch("https://pulse-pos-system.preview.emergentagent.com/api/auth/handoff/create", {
  method: "POST",
  headers: { "Authorization": `Bearer ${access_token}` },
});
const { code } = await handoffRes.json();

// Step 3: Redirect — user lands directly on dashboard
window.location.href = `https://pulse-pos-system.preview.emergentagent.com/auth/handoff?code=${code}`;
```

---

## API ENDPOINTS

### POST /api/auth/signup

**Request:**
```json
{
  "name": "Carlos Oliveira",
  "email": "carlos@example.com",
  "password": "securepass123",
  "venue_type": "nightclub"
}
```

| Field      | Type   | Required | Notes                                         |
|------------|--------|----------|-----------------------------------------------|
| name       | string | No       | Display name                                  |
| email      | string | Yes      | Unique, lowercased                            |
| password   | string | Yes      | Hashed with bcrypt                            |
| venue_type | string | No       | Default: "bar". Options: bar, nightclub, restaurant, lounge |

**Success Response (200):**
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "carlos@example.com",
    "name": "Carlos Oliveira",
    "status": "active",
    "created_at": "2026-03-18T08:51:26Z"
  },
  "next": { "type": "route", "route": "/venue/home" }
}
```

**Errors:** `400` Email exists | `422` Validation error

---

### POST /api/auth/login

**Request:**
```json
{
  "email": "carlos@example.com",
  "password": "securepass123"
}
```

**Success Response (200):** Same format as signup

**Errors:** `401` Invalid credentials | `403` Account inactive

---

### POST /api/auth/logout

**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response:**
```json
{ "message": "Logged out successfully" }
```

---

### GET /api/auth/me

**Request:** Requires `Authorization: Bearer <token>` header.

**Response:**
```json
{
  "id": "uuid",
  "name": "Carlos Oliveira",
  "email": "carlos@example.com",
  "status": "active",
  "created_at": "2026-03-18T08:51:26+00:00",
  "roles": [{
    "company_id": "uuid",
    "venue_id": "uuid",
    "role": "owner",
    "permissions": { "pulse": true, "tap": true, "table": true, "kds": true }
  }],
  "venues": [{
    "id": "uuid",
    "company_id": "uuid",
    "name": "Carlos Oliveira's Venue",
    "venue_type": "nightclub",
    "status": "active",
    "created_at": "2026-03-18T08:51:26+00:00"
  }]
}
```

---

### POST /api/auth/handoff/create

Creates a one-time code for cross-domain handoff.
Requires `Authorization: Bearer <token>` header.

**Response:**
```json
{ "code": "wHKg8NQnM2P3...", "expires_in": 60 }
```

---

### POST /api/auth/handoff/exchange

Exchanges a one-time code for a JWT. **No auth required.**

**Request:**
```json
{ "code": "wHKg8NQnM2P3..." }
```

**Response:**
```json
{
  "access_token": "eyJhbG...",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "...", "name": "...", "status": "active" }
}
```

**Errors:** `401` Invalid/expired code | `400` Missing code

---

## URLS SUMMARY

| Purpose           | URL                                                                    |
|-------------------|------------------------------------------------------------------------|
| API base          | `https://pulse-pos-system.preview.emergentagent.com/api`               |
| App (frontend)    | `https://pulse-pos-system.preview.emergentagent.com`                   |
| Token handoff     | `https://pulse-pos-system.preview.emergentagent.com/auth/handoff?token=<JWT>` |
| Code handoff      | `https://pulse-pos-system.preview.emergentagent.com/auth/handoff?code=<CODE>` |
| Dashboard         | `https://pulse-pos-system.preview.emergentagent.com/venue/home`        |

## CORS
Allowed origins: `spetapp.com`, `www.spetapp.com`, preview domain

## Security
- Passwords: bcrypt | JWT: HS256, 7-day expiry | Logout: token blacklist
- Handoff codes: one-time use, 60-second TTL, stored in MongoDB
