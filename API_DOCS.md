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
Get current user profile with full session data. **Requires: Bearer token**

This is the **primary endpoint for frontend session hydration**. Returns everything needed to determine: routing, feature access, and UI state.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@email.com",
    "name": "User Name",
    "role": "CEO|USER",
    "status": "active|pending_payment|trial|cancelled",
    "onboarding_completed": true|false,
    "onboarding_step": 0-6,
    "company": {
      "id": "uuid",
      "name": "Meu Restaurante",
      "venue_type": "restaurant|bar|club|hotel"
    },
    "plan": {
      "id": "core|flow|sync|os",
      "name": "Spet Core|Flow|Sync|OS",
      "status": "active|pending_payment|trial|cancelled",
      "interval": "month",
      "modules": ["pulse", "tap", "table", "kds"],
      "limits": { "venues": 10, "staff": 50 }
    },
    "modules_enabled": ["pulse", "tap", "table", "kds"],
    "roles": [
      {
        "venue_id": "uuid",
        "role": "owner|manager|host|server|bartender",
        "permissions": { "pulse": true, "tap": true, "table": true, "kds": true },
        "venue_name": "My Bar",
        "venue_type": "bar"
      }
    ]
  },
  "error": null
}
```

**Frontend Decision Tree:**
```javascript
const me = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
const { status, onboarding_completed, plan, modules_enabled, roles } = me.data;

// 1. Route decision
if (status === 'pending_payment')           → redirect /payment
if (status === 'cancelled')                 → redirect /payment-required
if (!onboarding_completed)                  → redirect /onboarding
else                                        → allow /app

// 2. Feature gating
modules_enabled.includes('tap')             → show Tap module
modules_enabled.includes('kds')             → show KDS module

// 3. Permission check
roles[0].permissions.kds                    → allow KDS access
roles[0].role === 'owner'                   → show admin settings
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

### POST `/api/auth/verify-payment`
**Official post-payment activation endpoint.** Verifies a Stripe Checkout session and activates the user. **Requires: Bearer token**

The backend verifies directly with Stripe — it does NOT trust the frontend. This is the source of truth for payment activation.

**Body:**
```json
{ "session_id": "cs_xxx" }
```

**Response (200) — Payment verified, user activated:**
```json
{
  "success": true,
  "data": {
    "activated": true,
    "already_active": false,
    "status": "active",
    "plan_id": "core",
    "plan": "Spet Core"
  },
  "error": null
}
```

**Response (200) — User already active (idempotent):**
```json
{
  "success": true,
  "data": {
    "activated": true,
    "already_active": true,
    "status": "active",
    "plan_id": "core",
    "plan": "Spet Core"
  },
  "error": null
}
```

**Response (200) — Payment not completed yet:**
```json
{
  "success": true,
  "data": {
    "activated": false,
    "status": "pending_payment",
    "payment_status": "unpaid",
    "stripe_session_status": "open",
    "message": "Payment not completed yet"
  },
  "error": null
}
```

**Error Cases:**
- `400`: Missing `session_id` or invalid/expired Stripe session
- `401`: No auth token
- `404`: User not found

**Frontend Flow:**
```
1. User completes Stripe Checkout → redirected to /payment/success?session_id=cs_xxx
2. Frontend calls POST /api/auth/verify-payment { session_id: "cs_xxx" }
3. If activated=true → redirect to /onboarding or /app
4. If activated=false → show "payment pending" message, retry after delay
5. After activation, /auth/me and /auth/permissions will reflect status="active"
```

**Edge Cases:**
- Calling multiple times with same session_id is safe (idempotent)
- Works with sessions created by backend OR by frontend edge functions
- If user is already active, returns immediately without hitting Stripe

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
Create a one-time handoff code for cross-domain auth. **Requires: Bearer token**

Used by Lovable (spetapp.com) to redirect users into the product app after onboarding.

**Response:**
```json
{
  "success": true,
  "data": { "code": "abc123...", "expires_in": 60 },
  "error": null
}
```

### POST `/api/auth/handoff/exchange`
Exchange a one-time handoff code for `access_token` + `refresh_token`. **No auth required.**

The code is **single-use** — a second call with the same code returns 401.

**Body:**
```json
{ "code": "abc123..." }
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "xyz...",
    "token_type": "bearer",
    "user": {
      "id": "uuid",
      "email": "user@email.com",
      "name": "User Name",
      "role": "USER|CEO",
      "status": "active|pending_payment",
      "onboarding_completed": true|false
    }
  },
  "error": null
}
```

**Error Cases:**
- `400`: Missing code
- `401`: Invalid code, expired (>60s), or already used

### Cross-Domain Handoff Flow (Lovable → Product App)

```
                   spetapp.com (Lovable)                          app.spetapp.com (Product App)
                   ─────────────────────                          ─────────────────────────────

1. User completes onboarding
2. Lovable calls:
   POST /api/auth/handoff/create
   → receives { code: "abc123", expires_in: 60 }

3. Lovable redirects browser to:
   https://app.spetapp.com/auth/handoff?code=abc123
                                                        4. Product app reads ?code from URL
                                                        5. Calls POST /api/auth/handoff/exchange
                                                           { code: "abc123" }
                                                           → receives access_token + refresh_token

                                                        6. Stores tokens in localStorage
                                                        7. User is authenticated — no login screen
                                                        8. Redirects to /dashboard or /app
```

**Security:**
- Code expires in 60 seconds
- Code is single-use (cannot be replayed)
- Code is cryptographically random (48 bytes, URL-safe)
- The exchange returns a full refresh_token for long-term session

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

## Frontend Integration (Same-Domain Architecture)

### URL Structure
```
spetapp.com           → Landing page
spetapp.com/login     → Login
spetapp.com/signup    → Signup + Stripe checkout
spetapp.com/payment   → Payment required / retry
spetapp.com/onboarding → Multi-step onboarding (5 steps)
spetapp.com/app       → Real product (all active + onboarded users)
```

### Complete User Journey
```
signup → pending_payment → Stripe payment → active → onboarding → /app
```

All within the same domain. JWT stays in localStorage throughout.

### Route Decision (after any page load)
```javascript
// Call on every protected page load
const res = await fetch('/api/auth/permissions', {
  headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
});
const { flags } = res.data;

if (flags.requires_payment)     → redirect to /payment
if (flags.requires_onboarding)  → redirect to /onboarding
else                            → allow /app
```

### Token Management
```javascript
// On login/signup response:
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('refresh_token', data.refresh_token);

// Before access_token expires (1 hour), refresh silently:
const res = await fetch('/api/auth/refresh-token', {
  method: 'POST',
  body: JSON.stringify({ refresh_token: localStorage.getItem('refresh_token') })
});
// Replace both tokens:
localStorage.setItem('access_token', res.data.access_token);
localStorage.setItem('refresh_token', res.data.refresh_token);

// If refresh fails (401) → redirect to /login
```

### After Onboarding Complete
```javascript
// Step 6: call complete
await fetch('/api/onboarding/complete', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }
});
// Simply redirect — session is already authenticated
window.location.href = '/app';
```

### After Payment Success
```javascript
// Stripe redirects to /payment/success?session_id=cs_xxx
const sessionId = new URLSearchParams(window.location.search).get('session_id');
const res = await fetch('/api/auth/verify-payment', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ session_id: sessionId })
});
if (res.data.activated) → redirect to /onboarding
```

### Token Lifetimes
| Token | Lifetime |
|---|---|
| `access_token` | 1 hour |
| `refresh_token` | 30 days |

### CORS
Accepts: `*.lovable.app`, `*.lovable.dev`, `localhost:3000/5173/8080`, `CORS_ORIGINS` env var.

---

## Cross-Domain Handoff (Future Fallback Only)

The handoff system (`/api/auth/handoff/create` + `/api/auth/handoff/exchange`) is available but **not used in the main flow**. It exists as a fallback if the architecture ever moves to separate domains.


---

## Test Users

These users are **reset on every backend restart** for consistent testing.
Password: `12345` for all.

| Email | Role | Status | Onboarding | Plan | Modules | Route |
|---|---|---|---|---|---|---|
| `teste@teste.com` | owner | `active` | `true` | Spet Sync | pulse, tap, table, kds | `/app` |
| `teste1@teste.com` | owner | `active` | `false` | Spet Flow | pulse, tap, table | `/onboarding` |
| `garcia.rapha2@gmail.com` | CEO / platform_admin | `active` | `true` | Spet OS | pulse, tap, table, kds, bar, finance, analytics, ai | `/app` |

### Quick Test
```bash
# Login
curl -X POST /api/auth/login -d '{"email":"teste@teste.com","password":"12345"}'
# Get full profile
curl -H "Authorization: Bearer {token}" /api/auth/me
```

### Payment Confirmation

Two mechanisms exist for activating users after Stripe payment:

| Method | Endpoint | When |
|---|---|---|
| **Webhook** (preferred) | `POST /api/webhook/stripe` | Stripe sends automatically after payment |
| **Frontend verify** | `POST /api/auth/verify-payment` | Frontend calls with `{ session_id }` after Stripe redirect |

Both verify directly with Stripe before activating. The backend is the **source of truth** — frontend should never set `active` locally.
