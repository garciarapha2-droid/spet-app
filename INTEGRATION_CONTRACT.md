# SPET Integration Contract — Lovable ↔ Emergent
> **Version**: 1.0 — FROZEN  
> **Date**: March 19, 2026  
> **Status**: FINAL — Do not change without mutual agreement

---

## Architecture

```
Lovable (Public)                    Emergent (Protected)
─────────────────                   ────────────────────
Landing page                        /venue/home (dashboard)
Signup form          ──── API ────► /tap (POS)
Login form           ──── API ────► /table (table service)
Pricing page                        /kitchen (KDS)
Checkout (Stripe)                   /manager (admin)
                     ──── handoff → /auth/handoff?code=XXX
```

**Production**: Lovable handles all public UI. Emergent has no login page.  
**Preview/Dev**: Emergent has a fallback `/login` page (activated when `REACT_APP_LOVABLE_LOGIN_URL` is not set).

---

## Base URL

```
Production:  https://app.spetapp.com  (or assigned Emergent domain)
Preview:     https://nfc-guest-flow.preview.emergentagent.com
```

All endpoints are prefixed with `/api`.

---

## 1. SIGNUP — Account Creation

### `POST /api/auth/signup`

Creates a new user, company, and venue in a single transaction. Returns a JWT immediately (user is logged in).

**Auth**: None required

**Request**:
```json
{
  "email": "owner@venue.com",          // REQUIRED — EmailStr
  "password": "securepass123",          // REQUIRED — string
  "name": "John Smith",                // optional — string
  "company_name": "The Lounge",        // optional — string (defaults to "{name}'s Venue")
  "venue_type": "bar"                  // optional — string: bar | nightclub | restaurant | lounge
}
```

**Response** `200`:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": "f62a0324-a12d-4308-adae-30d28a42c311",
    "email": "owner@venue.com",
    "name": "John Smith",
    "role": "USER",
    "status": "active",
    "created_at": "2026-03-19T00:01:31.175590Z"
  },
  "next": {
    "type": "route",
    "route": "/venue/home"
  }
}
```

**Errors**:
| Code | Detail |
|------|--------|
| 400  | `"Email already registered"` |
| 422  | Validation error (missing/invalid fields) |

**What it creates**:
- User record (PostgreSQL `users` table)
- Company record (PostgreSQL `companies` table)
- Venue record (MongoDB `venues` collection)
- Venue config with default modules (MongoDB `venue_configs`)
- User access with `owner` role (PostgreSQL `user_access`)

---

## 2. LOGIN

### `POST /api/auth/login`

Authenticates an existing user. Returns a JWT.

**Auth**: None required

**Request**:
```json
{
  "email": "owner@venue.com",    // REQUIRED — EmailStr
  "password": "securepass123"    // REQUIRED — string
}
```

**Response** `200`:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": "5773e652-8e75-4fef-9bfb-54446b828145",
    "email": "owner@venue.com",
    "name": "John Smith",
    "role": "CEO",
    "status": "active",
    "created_at": "2026-03-18T23:39:00.731256Z"
  },
  "next": {
    "type": "route",
    "route": "/venue/home"
  }
}
```

**Errors**:
| Code | Detail |
|------|--------|
| 401  | `"Invalid credentials"` |
| 403  | `"Account inactive"` |

---

## 3. AUTH HANDOFF — Cross-Domain Transfer (Lovable → Emergent)

Two-step flow for transferring an authenticated session from Lovable to Emergent without exposing the JWT in the URL.

### Step A: Create Handoff Code

### `POST /api/auth/handoff/create`

**Auth**: `Authorization: Bearer <access_token>` (required)

Called by Lovable AFTER the user is logged in. Creates a one-time code.

**Request**: Empty body (user identity comes from the JWT)

**Response** `200`:
```json
{
  "code": "rkQgNaNRTGyPIl4m8XA6QHM_1Xlh93...",
  "expires_in": 60
}
```

**Lovable then redirects to**:
```
https://app.spetapp.com/auth/handoff?code=rkQgNaNRTGyPIl4m8XA6QHM_1Xlh93...
```

### Step B: Exchange Code for JWT

### `POST /api/auth/handoff/exchange`

**Auth**: None required (the code IS the auth)

Called by the Emergent frontend automatically when `/auth/handoff?code=XXX` loads.

**Request**:
```json
{
  "code": "rkQgNaNRTGyPIl4m8XA6QHM_1Xlh93..."
}
```

**Response** `200`:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": "5773e652-8e75-4fef-9bfb-54446b828145",
    "email": "garcia.rapha2@gmail.com",
    "name": "Raphael Garcia",
    "status": "active"
  }
}
```

**Errors**:
| Code | Detail |
|------|--------|
| 400  | `"Code is required"` |
| 401  | `"Invalid or expired code"` / `"Code expired"` |

**Properties**:
- Code is **single-use** (idempotent — handles React StrictMode double-calls)
- Expires in **60 seconds**
- Stored in MongoDB `auth_handoff_codes` collection

### Full Handoff Flow:
```
1. User logs in on Lovable
2. Lovable calls POST /api/auth/login → gets access_token
3. Lovable calls POST /api/auth/handoff/create (with Bearer token) → gets code
4. Lovable redirects browser to: https://emergent-domain/auth/handoff?code=XXX
5. Emergent frontend calls POST /api/auth/handoff/exchange → gets new access_token
6. Emergent stores token in localStorage, user enters the app
```

---

## 4. LEAD CAPTURE

### `POST /api/onboarding/lead`

Captures prospect info before checkout. Returns a `lead_id` to associate with the payment.

**Auth**: None required

**Request**:
```json
{
  "name": "Jane Doe",           // REQUIRED — string
  "email": "jane@example.com",  // REQUIRED — string
  "phone": "+1234567890",       // optional — string
  "plan_id": "starter"          // REQUIRED — "starter" | "growth" | "enterprise"
}
```

**Response** `200`:
```json
{
  "lead_id": "2d6ab24e-9e21-4edb-a87e-6827ae37bc97",
  "status": "captured"
}
```

**Errors**:
| Code | Detail |
|------|--------|
| 400  | `"Name, email, and plan are required"` |
| 400  | `"Invalid plan"` |

---

## 5. PRICING PLANS

### `GET /api/onboarding/plans`

Returns available subscription plans. Server-side pricing (never trust frontend amounts).

**Auth**: None required

**Response** `200`:
```json
{
  "plans": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 79.0,
      "currency": "usd",
      "interval": "month",
      "features": ["1 Venue", "Pulse + Tap", "Basic KDS", "Up to 5 staff", "Email support"]
    },
    {
      "id": "growth",
      "name": "Growth",
      "price": 149.0,
      "currency": "usd",
      "interval": "month",
      "features": ["3 Venues", "All Modules", "Advanced KDS + Bar", "Up to 20 staff", "Priority support", "Manager dashboard"]
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "price": 299.0,
      "currency": "usd",
      "interval": "month",
      "features": ["Unlimited Venues", "All Modules", "Custom integrations", "Unlimited staff", "Dedicated support", "CEO dashboard", "API access"]
    }
  ]
}
```

---

## 6. CHECKOUT — Stripe Payment

### `POST /api/onboarding/checkout`

Creates a Stripe Checkout Session. Returns the Stripe redirect URL.

**Auth**: None required

**Request**:
```json
{
  "plan_id": "starter",                    // REQUIRED — "starter" | "growth" | "enterprise"
  "lead_id": "2d6ab24e-...",               // optional — from /api/onboarding/lead
  "origin_url": "https://spet.lovable.app" // REQUIRED — base URL for success/cancel redirects
}
```

**Response** `200`:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_a1OvURhVkmjd..."
}
```

**Redirect URLs** (built automatically from `origin_url`):
- Success: `{origin_url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
- Cancel: `{origin_url}/pricing`

**Errors**:
| Code | Detail |
|------|--------|
| 400  | `"Invalid plan"` |
| 400  | `"Origin URL required"` |

### `GET /api/onboarding/checkout/status/{session_id}`

Poll after Stripe redirects back to check payment status.

**Auth**: None required

**Response** `200`:
```json
{
  "status": "complete",
  "payment_status": "paid",
  "amount_total": 7900,
  "currency": "usd"
}
```

---

## 7. USER PROFILE

### `GET /api/auth/me`

Returns the authenticated user's full profile with venues and roles.

**Auth**: `Authorization: Bearer <access_token>` (required)

**Response** `200`:
```json
{
  "id": "5773e652-...",
  "name": "Raphael Garcia",
  "email": "garcia.rapha2@gmail.com",
  "role": "CEO",
  "status": "active",
  "created_at": "2026-03-18T23:39:00.731256",
  "roles": [
    {
      "company_id": "c0000001-...",
      "venue_id": "40a24e04-...",
      "role": "platform_admin",
      "permissions": { "ceo": true, "kds": true, "HOST_COLLECT_DOB": true }
    }
  ],
  "venues": [
    {
      "id": "40a24e04-...",
      "company_id": "c0000001-...",
      "name": "Demo Club Updated",
      "venue_type": "nightclub",
      "status": "active"
    }
  ]
}
```

---

## 8. LOGOUT

### `POST /api/auth/logout`

Invalidates the current token.

**Auth**: `Authorization: Bearer <access_token>` (required)

**Response** `200`:
```json
{
  "message": "Logged out successfully"
}
```

---

## JWT Token Structure

All tokens are HS256-signed JWTs containing:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "CEO | USER",
  "roles": [
    {
      "user_id": "...",
      "company_id": "...",
      "venue_id": "...",
      "role": "platform_admin | owner | staff",
      "permissions": { ... }
    }
  ],
  "exp": 1774481994
}
```

**Expiration**: 24 hours from creation.  
**Header**: `Authorization: Bearer <token>`

---

## Typical Lovable Flows

### Flow A: New User (Signup → Checkout → App)
```
1. GET  /api/onboarding/plans               → show pricing
2. POST /api/onboarding/lead                → capture name, email, phone, plan_id
3. POST /api/onboarding/checkout            → get Stripe URL, redirect user
4. User completes payment on Stripe
5. Stripe redirects to {origin_url}/checkout/success?session_id=XXX
6. GET  /api/onboarding/checkout/status/XXX → confirm payment_status = "paid"
7. POST /api/auth/signup                    → create account, get access_token
8. POST /api/auth/handoff/create            → get handoff code
9. Redirect to https://emergent-domain/auth/handoff?code=XXX
```

### Flow B: Returning User (Login → App)
```
1. POST /api/auth/login                     → get access_token
2. POST /api/auth/handoff/create            → get handoff code
3. Redirect to https://emergent-domain/auth/handoff?code=XXX
```

### Flow C: Direct Token Handoff (Alternative)
```
1. POST /api/auth/login                     → get access_token
2. Redirect to https://emergent-domain/auth/handoff?token=XXX
   (The Emergent frontend validates the token directly via GET /api/auth/me)
```

---

## Environment Configuration

### Emergent Frontend `.env`

| Variable | Preview | Production |
|----------|---------|------------|
| `REACT_APP_BACKEND_URL` | `https://preview-url.emergentagent.com` | `https://app.spetapp.com` |
| `REACT_APP_LOVABLE_LOGIN_URL` | *(not set — uses internal /login)* | `https://spet.lovable.app/login` |

### CORS (Backend `.env`)
```
CORS_ORIGINS="https://spetapp.com,https://www.spetapp.com,https://spet.lovable.app,https://preview-url.emergentagent.com"
```

Lovable's domain **must** be in the CORS allowlist.

---

## Contract Guarantees

1. **Endpoint paths will not change**
2. **Request field names will not change**
3. **Response field names will not change**
4. **New optional fields may be added** (non-breaking)
5. **Error codes and messages are stable**
6. **JWT structure is stable**
7. **Pricing is server-controlled** — Lovable must never send amounts
