"""Shared constants for the SPET platform."""

# Demo/system accounts that bypass paywall
DEMO_EMAILS = frozenset({
    "garcia.rapha2@gmail.com",  # admin, protected, not deletable
    "teste@teste.com",           # demo full (persistent)
    "teste1@teste.com",          # demo onboarding (resettable)
})
