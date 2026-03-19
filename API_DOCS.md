# SPET API Documentation

> Base URL: `{YOUR_BACKEND_URL}/api`
>
> All responses follow the standard format:
> ```json
> { "success": true|false, "data": {...}|null, "error": null|{"code":"...", "message":"..."} }
> ```

---

## Plans

| ID | Name | Official Price | Early Price | Modules | Limits |
|---|---|---|---|---|---|
| `core` | Spet Core | $79/mo | $39/mo | Pulse | 1 venue, 5 staff |
| `flow` | Spet Flow | $149/mo | $59/mo | Pulse, Tap, Table | 3 venues, 20 staff |
| `sync` | Spet Sync | $299/mo | $99/mo | Pulse, Tap, Table, KDS | 10 venues, 50 staff |
| `os` | Spet OS | $499/mo | $149/mo | All modules | Unlimited |

Early-stage pricing is applied automatically when `promo_active: true`. Official prices remain in Stripe. To disable promo pricing, set `PROMO_ACTIVE = False` in `utils/constants.py`.

Legacy plan IDs (`starter`, `growth`, `enterprise`) are automatically mapped to `core`, `flow`, `sync`.

---

## Authentication

### POST `/api/auth/signup`
Create a new account. Returns JWT + Stripe checkout URL.

**Body:**
```json
{
  "email": "user@email.com",
  "password": "min6chars",
  "name": "User Name",
  "company_name": "Optional Company",
  "plan_id": "core|flow|sync|os",
  "origin_url": "https://your-frontend.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "abc123...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "user@email.com",
      "name": "User Name",
      "role": "USER",
      "status": "pending_payment",
      "onboarding_completed": false,
      "created_at": "2026-01-01T00:00:00"
    },
    "next": { "type": "route", "route": "/payment" },
    "checkout_url": "https://checkout.stripe.com/..."
  },
  "error": null
}
```

**Frontend Flow:**
1. Store `access_token` and `refresh_token` in localStorage
2. Redirect to `checkout_url` (Stripe Checkout)
3. Stripe redirects back to `{origin_url}/payment/success?session_id=xxx`

---

### POST `/api/auth/login`
Authenticate and get JWT token.

**Body:**
```json
{
  "email": "user@email.com",
  "password": "password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "abc123...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "user@email.com",
      "name": "User Name",
      "role": "CEO|USER",
      "status": "active|pending_payment",
      "onboarding_completed": true|false,
      "created_at": "..."
    },
    "next": {
      "type": "route",
      "route": "/app|/payment|/onboarding"
    }
  },
  "error": null
}
```

**Frontend Routing Decision:**
```
if (user.status === "pending_payment") → /payment
else if (!user.onboarding_completed)   → /onboarding
else                                    → /app
```

---

### GET `/api/auth/me`
Get current user profile. **Requires: Bearer token**

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@email.com",
    "role": "CEO|USER",
    "status": "active|pending_payment",
    "onboarding_completed": true|false,
    "onboarding_step": 0-6,
    "plan_id": "core|flow|sync|os",
    "created_at": "...",
    "roles": [
      {
        "company_id": "uuid",
        "venue_id": "uuid|null",
        "role": "owner|manager|host|server|bartender",
        "permissions": { "pulse": true, "tap": true }
      }
    ],
    "venues": [
      {
        "id": "venue-uuid",
        "name": "My Bar",
        "venue_type": "bar",
        "status": "active"
      }
    ]
  },
  "error": null
}
```

---

### GET `/api/auth/permissions`
Get complete permission map. **Requires: Bearer token**

Primary endpoint for frontend routing decisions.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "email": "user@email.com",
    "global_role": "CEO|USER",
    "status": "active|pending_payment",
    "plan_id": "flow",
    "plan": "Spet Flow",
    "onboarding_completed": true|false,
    "onboarding_step": 0-6,
    "is_demo": true|false,
    "access": [
      {
        "company_id": "uuid",
        "venue_id": "uuid",
        "role": "owner",
        "permissions": { "pulse": true, "tap": true, "table": true },
        "venue": {
          "venue_id": "uuid",
          "venue_name": "My Bar",
          "venue_type": "bar",
          "modules": ["pulse", "tap", "table"]
        }
      }
    ],
    "flags": {
      "is_active": true,
      "requires_payment": false,
      "requires_onboarding": false
    }
  },
  "error": null
}
```

---

### GET `/api/auth/payment-status`
Check payment/subscription status. **Requires: Bearer token**

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "status": "active|pending_payment",
    "plan_id": "core",
    "plan": "Spet Core",
    "is_active": true,
    "is_demo": false,
    "requires_payment": false,
    "requires_onboarding": false,
    "last_payment": {
      "stripe_session_id": "cs_xxx",
      "payment_status": "paid|pending",
      "amount": 39.0,
      "currency": "usd",
      "created_at": "2026-01-01T00:00:00"
    }
  },
  "error": null
}
```

---

### POST `/api/auth/logout`
Invalidate current token. **Requires: Bearer token**

**Body (optional):**
```json
{ "refresh_token": "abc123..." }
```

If `refresh_token` is provided, it will also be revoked.

---

### POST `/api/auth/refresh-token`
Exchange a valid refresh token for a new access_token + refresh_token pair. **No Bearer token required.**

Uses single-use rotation: the old refresh token is revoked after use.

**Body:**
```json
{ "refresh_token": "abc123..." }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ... (new)",
    "refresh_token": "xyz... (new)",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "user@email.com",
      "name": "User Name",
      "role": "CEO|USER",
      "status": "active|pending_payment",
      "onboarding_completed": true|false,
      "created_at": "..."
    },
    "next": { "type": "route", "route": "/app|/payment|/onboarding" }
  },
  "error": null
}
```

**Error Cases:**
- `400`: Missing `refresh_token` in body
- `401`: Invalid, revoked, or expired refresh token
- `403`: Account suspended

**Frontend Flow:**
1. Before `access_token` expires (1 hour), call this endpoint with the stored `refresh_token`
2. Replace both `access_token` and `refresh_token` in localStorage
3. If refresh fails (401), redirect to `/login`

**Token Lifetimes:**
| Token | Lifetime |
|---|---|
| `access_token` | 1 hour |
| `refresh_token` | 30 days |

---

### POST `/api/auth/handoff/create`
Create a one-time auth handoff code. **Requires: Bearer token**

**Response:**
```json
{
  "success": true,
  "data": { "code": "abc123...", "expires_in": 60 },
  "error": null
}
```

### POST `/api/auth/handoff/exchange`
Exchange handoff code for a JWT token. **No auth required.**

**Body:** `{ "code": "abc123..." }`

---

## Onboarding

### GET `/api/onboarding/plans`
Get available subscription plans. **No auth required.**

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "core",
        "name": "Spet Core",
        "price": 79.0,
        "promo_price": 39.0,
        "promo_active": true,
        "currency": "usd",
        "interval": "month",
        "modules": ["pulse"],
        "limits": { "venues": 1, "staff": 5 },
        "features": ["1 Venue", "Pulse (entry management)", "Up to 5 staff", "Email support"]
      }
    ]
  },
  "error": null
}
```

---

### POST `/api/onboarding/create-checkout`
Create Stripe checkout session. **Requires: Bearer token**

**Body:**
```json
{
  "origin_url": "https://your-frontend.com",
  "plan_id": "core"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "url": "https://checkout.stripe.com/...", "session_id": "cs_xxx" },
  "error": null
}
```

---

### GET `/api/onboarding/checkout/status/{session_id}`
Poll payment status. Activates user when paid. **Requires: Bearer token**

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "complete|expired|open",
    "payment_status": "paid|unpaid",
    "amount_total": 3900,
    "currency": "usd"
  },
  "error": null
}
```

---

### GET `/api/onboarding/status`
Get current onboarding state. **Requires: Bearer token**

---

### POST `/api/onboarding/account-setup`
Step 2: Set up venue. **Requires: Bearer token**

**Body:**
```json
{
  "user_name": "Owner Name",
  "venue_name": "My Bar & Grill",
  "venue_type": "bar|nightclub|restaurant|lounge|hotel|other"
}
```

### POST `/api/onboarding/password-reset`
Step 3. **Body:** `{ "new_password": "min6chars" }`

### POST `/api/onboarding/modules-setup`
Step 4. **Body:** `{ "modules": ["pulse", "tap", "table", "kds"] }`

### POST `/api/onboarding/team-setup`
Step 5 (placeholder). **Body:** `{}`

### POST `/api/onboarding/complete`
Mark onboarding as done.

---

## Stripe Webhook

### POST `/api/webhook/stripe`
Receives Stripe events. Activates user on payment. **No auth required.**

---

## Error Codes

| HTTP | Code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Invalid input |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Payment required / insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 422 | `VALIDATION_ERROR` | Validation failed |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Demo Accounts

| Email | Password | Role | Behavior |
|---|---|---|---|
| `garcia.rapha2@gmail.com` | `12345` | CEO | Admin, protected, not deletable |
| `teste@teste.com` | `12345` | USER | Demo full (persistent) |
| `teste1@teste.com` | `12345` | USER | Demo onboarding (resets on restart) |

---

## Frontend Integration

### Routing
```
/            → Landing page
/payment     → Payment / Stripe flow
/onboarding  → Multi-step onboarding
/app         → Authenticated app (all active+onboarded users)
```

### Route Decision
```javascript
const { flags } = await fetch('/api/auth/permissions');
if (flags.requires_payment)     → /payment
if (flags.requires_onboarding)  → /onboarding
else                            → /app
```

### CORS
Accepts: `*.lovable.app`, `*.lovable.dev`, `localhost:3000/5173/8080`, `CORS_ORIGINS` env var.
