# SPET API — Authentication Endpoints
# Base URL: https://table-verify-fix.preview.emergentagent.com
# Production: https://spetapp.com (when deployed)

---

## 1. POST /api/auth/signup

### Request
```
POST /api/auth/signup
Content-Type: application/json
```

```json
{
  "name": "Carlos Oliveira",
  "email": "carlos@example.com",
  "password": "securepass123",
  "venue_type": "nightclub"
}
```

| Field       | Type   | Required | Notes                                               |
|-------------|--------|----------|-----------------------------------------------------|
| name        | string | No       | User display name                                   |
| email       | string | Yes      | Must be unique, will be lowercased                   |
| password    | string | Yes      | Will be hashed with bcrypt                           |
| venue_type  | string | No       | Default: "bar". Options: bar, nightclub, restaurant, lounge |

### Response (201 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "532924e0-2886-42d6-978f-5080bbef3621",
    "email": "carlos@example.com",
    "name": "Carlos Oliveira",
    "status": "active",
    "created_at": "2026-03-18T08:51:26.518393Z"
  },
  "next": {
    "type": "route",
    "route": "/venue/home"
  }
}
```

### Error Responses
- `400` → `{"detail": "Email already registered"}`
- `422` → Validation error (missing email/password)

---

## 2. POST /api/auth/login

### Request
```
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "carlos@example.com",
  "password": "securepass123"
}
```

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "532924e0-2886-42d6-978f-5080bbef3621",
    "email": "carlos@example.com",
    "name": "Carlos Oliveira",
    "status": "active",
    "created_at": "2026-03-18T08:51:26.518393Z"
  },
  "next": {
    "type": "route",
    "route": "/venue/home"
  }
}
```

### Error Responses
- `401` → `{"detail": "Invalid credentials"}`
- `403` → `{"detail": "Account inactive"}`

---

## 3. POST /api/auth/logout

### Request
```
POST /api/auth/logout
Authorization: Bearer <access_token>
```

No body required.

### Response (200 OK)
```json
{
  "message": "Logged out successfully"
}
```

### Error Responses
- `401` → `{"detail": "Not authenticated"}`

---

## 4. GET /api/auth/me

### Request
```
GET /api/auth/me
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
{
  "id": "532924e0-2886-42d6-978f-5080bbef3621",
  "name": "Carlos Oliveira",
  "email": "carlos@example.com",
  "status": "active",
  "created_at": "2026-03-18T08:51:26.518393+00:00",
  "roles": [
    {
      "company_id": "c0ba193d-74ba-4930-9a73-57898ca240a7",
      "venue_id": "ea16d854-a5ac-4587-86a2-1e0b260877c6",
      "role": "owner",
      "permissions": {
        "pulse": true,
        "tap": true,
        "table": true,
        "kds": true,
        "HOST_COLLECT_DOB": true
      }
    }
  ],
  "venues": [
    {
      "id": "ea16d854-a5ac-4587-86a2-1e0b260877c6",
      "company_id": "c0ba193d-74ba-4930-9a73-57898ca240a7",
      "name": "Carlos Oliveira's Venue",
      "venue_type": "nightclub",
      "status": "active",
      "created_at": "2026-03-18T08:51:26.518393+00:00"
    }
  ]
}
```

### Error Responses
- `401` → `{"detail": "Not authenticated"}` (invalid/expired/blacklisted token)
- `404` → `{"detail": "User not found"}`

---

## Lovable Integration Example (JavaScript)

```javascript
const API_BASE = "https://table-verify-fix.preview.emergentagent.com/api";

// SIGNUP
async function signup(name, email, password, venueType) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, venue_type: venueType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail);
  localStorage.setItem("token", data.access_token);
  return data;
}

// LOGIN
async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail);
  localStorage.setItem("token", data.access_token);
  return data;
}

// GET CURRENT USER
async function getMe() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    localStorage.removeItem("token");
    throw new Error("Not authenticated");
  }
  return await res.json();
}

// LOGOUT
async function logout() {
  const token = localStorage.getItem("token");
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.removeItem("token");
}
```

---

## CORS Configuration
Allowed origins:
- https://spetapp.com
- https://www.spetapp.com
- https://table-verify-fix.preview.emergentagent.com (preview/dev)

## Security
- Passwords: bcrypt hashed
- Tokens: JWT (HS256), 7-day expiry
- Logout: Token blacklisted in MongoDB
- Protected routes: All /api/* except /auth/login and /auth/signup
