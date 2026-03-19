# SPET API Documentation

> Base URL: `{YOUR_BACKEND_URL}/api`
>
> All responses follow the standard format:
> ```json
> { "success": true|false, "data": {...}|null, "error": null|{"code":"...", "message":"..."} }
> ```

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
  "plan_id": "starter|growth|enterprise",
  "origin_url": "https://your-frontend.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
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
1. Store `access_token` in localStorage
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
    "plan_id": "starter|growth|enterprise",
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
Get complete permission map for the user. **Requires: Bearer token**

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
    "plan_id": "starter|growth|enterprise",
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
          "modules": ["pulse", "tap", "table", "kds"]
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

**Frontend Usage:**
```javascript
const { flags } = await fetch('/api/auth/permissions');

if (flags.requires_payment)     → /payment
if (flags.requires_onboarding)  → /onboarding
else                            → /app
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
    "plan_id": "starter",
    "is_active": true,
    "is_demo": false,
    "requires_payment": false,
    "requires_onboarding": false,
    "last_payment": {
      "stripe_session_id": "cs_xxx",
      "payment_status": "paid|pending",
      "amount": 79.0,
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

---

### POST `/api/auth/handoff/create`
Create a one-time auth handoff code (for cross-domain token exchange). **Requires: Bearer token**

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

**Response:** Same structure as login.

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
        "id": "starter",
        "name": "Starter",
        "price": 79.0,
        "currency": "usd",
        "interval": "month",
        "features": ["1 Venue", "Pulse + Tap", "Basic KDS", "Up to 5 staff", "Email support"]
      },
      { "id": "growth", "..." : "..." },
      { "id": "enterprise", "..." : "..." }
    ]
  },
  "error": null
}
```

---

### POST `/api/onboarding/create-checkout`
Create a Stripe checkout session (for payment or retry). **Requires: Bearer token**

**Body:**
```json
{
  "origin_url": "https://your-frontend.com",
  "plan_id": "starter"
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
    "payment_status": "paid|unpaid|no_payment_required",
    "amount_total": 7900,
    "currency": "usd"
  },
  "error": null
}
```

**Frontend:** Poll every 2s until `payment_status === "paid"`, then redirect to `/onboarding`.

---

### GET `/api/onboarding/status`
Get current onboarding state. **Requires: Bearer token**

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "onboarding_completed": false,
    "onboarding_step": 2,
    "plan_id": "starter",
    "has_venue": true,
    "venue": { "id": "...", "name": "My Bar", "venue_type": "bar" },
    "company_id": "uuid"
  },
  "error": null
}
```

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

**Response:** `{ "success": true, "data": { "venue_id": "uuid", "step": 2 } }`

---

### POST `/api/onboarding/password-reset`
Step 3: Set new password. **Requires: Bearer token**

**Body:** `{ "new_password": "min6chars" }`

**Response:** `{ "success": true, "data": { "step": 3 } }`

---

### POST `/api/onboarding/modules-setup`
Step 4: Enable/disable modules. **Requires: Bearer token**

**Body:**
```json
{ "modules": ["pulse", "tap", "table", "kds"] }
```

Valid modules: `pulse`, `tap`, `table`, `kds`

**Response:** `{ "success": true, "data": { "modules": ["pulse", "tap", "table"], "step": 4 } }`

---

### POST `/api/onboarding/team-setup`
Step 5: Team setup (placeholder). **Requires: Bearer token**

**Body:** `{}` (empty for now)

**Response:** `{ "success": true, "data": { "step": 5 } }`

---

### POST `/api/onboarding/complete`
Mark onboarding as done. **Requires: Bearer token**

**Response:** `{ "success": true, "data": { "completed": true, "step": 6 } }`

---

## Stripe Webhook

### POST `/api/webhook/stripe`
Receives Stripe `checkout.session.completed` events.
Automatically activates user (`status: pending_payment → active`).

**No auth required.** Called by Stripe directly.

---

## Error Codes

| HTTP Status | Code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Invalid input |
| 401 | `UNAUTHORIZED` | Missing/invalid token |
| 403 | `FORBIDDEN` | Payment required or insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 422 | `VALIDATION_ERROR` | Request body validation failed |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Demo Accounts

| Email | Password | Role | Behavior |
|---|---|---|---|
| `garcia.rapha2@gmail.com` | `12345` | CEO (admin) | Always active, protected, not deletable |
| `teste@teste.com` | `12345` | USER | Demo full (persistent, always onboarded) |
| `teste1@teste.com` | `12345` | USER | Demo onboarding (resets every restart) |

Demo accounts bypass the paywall — they are always treated as `active` regardless of actual DB status.

---

## Frontend Integration Guide

### Routing Standard
```
/                → Landing page (speedapp.com)
/payment         → Payment required / Stripe flow
/onboarding      → Multi-step onboarding
/app             → Authenticated app entry (all active+onboarded users)
```

### Authentication Flow
```
1. User signs up  → POST /api/auth/signup → store token, redirect to checkout_url
2. Stripe payment → redirect to /payment/success?session_id=xxx
3. Poll GET /api/onboarding/checkout/status/{session_id} until paid
4. Onboarding steps (2-6) → POST each step endpoint
5. POST /api/onboarding/complete
6. GET /api/auth/permissions → flags determine route → /app
```

### Route Decision (from `GET /api/auth/permissions`)
```javascript
const { flags } = await fetch('/api/auth/permissions');

if (flags.requires_payment)     → /payment
if (flags.requires_onboarding)  → /onboarding
else                            → /app
```

### CORS
The API accepts requests from:
- `*.lovable.app` / `*.lovable.dev`
- `localhost:3000`, `localhost:5173`, `localhost:8080`
- Any origin in the `CORS_ORIGINS` env var
