"""Shared constants for the SPET platform."""

# Demo/system accounts that bypass paywall
DEMO_EMAILS = frozenset({
    "garcia.rapha2@gmail.com",  # admin, protected, not deletable
    "teste@teste.com",           # demo full (persistent)
    "teste1@teste.com",          # demo onboarding (resettable)
})

# ─── Plan Definitions ────────────────────────────────────────────────

PLANS = {
    "core": {
        "name": "Spet Core",
        "price": 79.00,
        "promo_price": 39.00,
        "currency": "usd",
        "interval": "month",
        "modules": ["pulse"],
        "limits": {"venues": 1, "staff": 5},
        "features": [
            "1 Venue",
            "Pulse (entry management)",
            "Up to 5 staff",
            "Email support",
        ],
    },
    "flow": {
        "name": "Spet Flow",
        "price": 149.00,
        "promo_price": 59.00,
        "currency": "usd",
        "interval": "month",
        "modules": ["pulse", "tap", "table"],
        "limits": {"venues": 3, "staff": 20},
        "features": [
            "3 Venues",
            "Pulse + Tap + Table",
            "Up to 20 staff",
            "Priority support",
            "Manager dashboard",
        ],
    },
    "sync": {
        "name": "Spet Sync",
        "price": 299.00,
        "promo_price": 99.00,
        "currency": "usd",
        "interval": "month",
        "modules": ["pulse", "tap", "table", "kds"],
        "limits": {"venues": 10, "staff": 50},
        "features": [
            "10 Venues",
            "All Modules (Pulse + Tap + Table + KDS)",
            "Up to 50 staff",
            "Dedicated support",
            "Owner dashboard",
        ],
    },
    "os": {
        "name": "Spet OS",
        "price": 499.00,
        "promo_price": 149.00,
        "currency": "usd",
        "interval": "month",
        "modules": ["pulse", "tap", "table", "kds"],
        "limits": {"venues": -1, "staff": -1},  # unlimited
        "features": [
            "Unlimited Venues",
            "All Modules",
            "Unlimited staff",
            "CEO dashboard",
            "API access",
            "Custom integrations",
            "White-glove support",
        ],
    },
}

# Early-stage promo is active by default; flip to False to use official pricing
PROMO_ACTIVE = True

# Legacy plan ID mapping (for existing users)
LEGACY_PLAN_MAP = {
    "starter": "core",
    "growth": "flow",
    "enterprise": "sync",
}


def resolve_plan_id(plan_id: str) -> str:
    """Resolve a plan ID, mapping legacy IDs to current ones."""
    if not plan_id:
        return "core"
    return LEGACY_PLAN_MAP.get(plan_id, plan_id)


def get_plan(plan_id: str) -> dict:
    """Get plan details by ID (handles legacy IDs)."""
    resolved = resolve_plan_id(plan_id)
    return PLANS.get(resolved)


def get_checkout_price(plan_id: str, use_promo: bool = None) -> float:
    """Get the price to charge. Uses promo if active and available."""
    plan = get_plan(plan_id)
    if not plan:
        return 0
    if use_promo is None:
        use_promo = PROMO_ACTIVE
    if use_promo and plan.get("promo_price"):
        return plan["promo_price"]
    return plan["price"]
