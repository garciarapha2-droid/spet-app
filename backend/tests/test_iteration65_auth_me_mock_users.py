"""
Iteration 65: Test /api/auth/me endpoint with 6 mock test users

Tests the enhanced /api/auth/me endpoint that returns rich user profile:
- user info (id, email, name, status, onboarding_completed)
- company (id, name)
- plan (id, name, status, interval, modules, limits)
- modules_enabled (array)
- roles (array with venue_id, role, permissions)

Mock users seeded on startup cover different scenarios:
1. mock-owner-active@spetapp.com - Owner with active plan, all modules
2. mock-trial@spetapp.com - Trial period user
3. mock-pending@spetapp.com - Pending payment user
4. mock-cancelled@spetapp.com - Cancelled plan user
5. mock-no-onboarding@spetapp.com - Active user without onboarding
6. mock-limited@spetapp.com - Staff with limited permissions (bartender)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# ─── TEST CREDENTIALS ────────────────────────────────────────────────
MOCK_USERS = {
    "owner_active": {"email": "mock-owner-active@spetapp.com", "password": "test123"},
    "trial": {"email": "mock-trial@spetapp.com", "password": "test123"},
    "pending": {"email": "mock-pending@spetapp.com", "password": "test123"},
    "cancelled": {"email": "mock-cancelled@spetapp.com", "password": "test123"},
    "no_onboarding": {"email": "mock-no-onboarding@spetapp.com", "password": "test123"},
    "limited": {"email": "mock-limited@spetapp.com", "password": "test123"},
}

DEMO_USER = {"email": "teste@teste.com", "password": "12345"}


@pytest.fixture(scope="module")
def session():
    """Create a shared requests session"""
    return requests.Session()


def login(session, email, password):
    """Login and return (access_token, refresh_token) or raise error"""
    resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        return None, None
    data = resp.json().get("data", resp.json())
    return data.get("access_token"), data.get("refresh_token")


def get_me(session, access_token):
    """Call /api/auth/me and return unwrapped data"""
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = session.get(f"{BASE_URL}/api/auth/me", headers=headers)
    if resp.status_code == 200:
        body = resp.json()
        return body.get("data", body)
    return None


# ═══════════════════════════════════════════════════════════════════════
# 1. HEALTH CHECK (Regression)
# ═══════════════════════════════════════════════════════════════════════

class TestHealthCheck:
    """GET /api/health returns healthy"""
    
    def test_health_returns_healthy(self, session):
        resp = session.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        body = resp.json()
        # Response middleware wraps: {"success": true, "data": {...}}
        data = body.get("data", body)
        assert data.get("status") == "healthy"
        print("PASS: GET /api/health returns healthy")


# ═══════════════════════════════════════════════════════════════════════
# 2. LOGIN TESTS FOR MOCK USERS
# ═══════════════════════════════════════════════════════════════════════

class TestLoginMockUsers:
    """Login tests for trial and cancelled users - should work"""

    def test_login_trial_user(self, session):
        """Trial user can login"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": MOCK_USERS["trial"]["email"],
            "password": MOCK_USERS["trial"]["password"]
        })
        assert resp.status_code == 200, f"Trial login failed: {resp.text}"
        data = resp.json().get("data", resp.json())
        assert "access_token" in data
        assert "refresh_token" in data
        print("PASS: Login works for trial user (mock-trial@spetapp.com)")

    def test_login_cancelled_user(self, session):
        """Cancelled user can login"""
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": MOCK_USERS["cancelled"]["email"],
            "password": MOCK_USERS["cancelled"]["password"]
        })
        assert resp.status_code == 200, f"Cancelled login failed: {resp.text}"
        data = resp.json().get("data", resp.json())
        assert "access_token" in data
        assert "refresh_token" in data
        print("PASS: Login works for cancelled user (mock-cancelled@spetapp.com)")

    def test_all_mock_users_return_tokens(self, session):
        """All mock users login returns access_token and refresh_token"""
        for key, creds in MOCK_USERS.items():
            resp = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": creds["email"],
                "password": creds["password"]
            })
            assert resp.status_code == 200, f"Login failed for {key}: {resp.text}"
            data = resp.json().get("data", resp.json())
            assert "access_token" in data, f"Missing access_token for {key}"
            assert "refresh_token" in data, f"Missing refresh_token for {key}"
        print("PASS: All mock users return access_token and refresh_token")


# ═══════════════════════════════════════════════════════════════════════
# 3. GET /api/auth/me FOR MOCK-OWNER-ACTIVE
# ═══════════════════════════════════════════════════════════════════════

class TestMockOwnerActive:
    """GET /api/auth/me for mock-owner-active@spetapp.com
    
    Expected:
    - status=active
    - plan.id=sync
    - plan.name=Spet Sync
    - modules_enabled includes pulse/tap/table/kds
    - company.name exists
    - roles[0].role=owner
    """

    @pytest.fixture(scope="class")
    def me_data(self, session):
        token, _ = login(session, MOCK_USERS["owner_active"]["email"], MOCK_USERS["owner_active"]["password"])
        assert token, "Failed to login mock-owner-active"
        return get_me(session, token)

    def test_status_is_active(self, me_data):
        assert me_data is not None, "Failed to get /me data"
        assert me_data.get("status") == "active"
        print("PASS: mock-owner-active status=active")

    def test_plan_id_is_sync(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("id") == "sync", f"Expected plan.id=sync, got {plan.get('id')}"
        print("PASS: mock-owner-active plan.id=sync")

    def test_plan_name_is_spet_sync(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("name") == "Spet Sync", f"Expected plan.name=Spet Sync, got {plan.get('name')}"
        print("PASS: mock-owner-active plan.name=Spet Sync")

    def test_modules_enabled_includes_all(self, me_data):
        modules = me_data.get("modules_enabled", [])
        expected = {"pulse", "tap", "table", "kds"}
        assert expected.issubset(set(modules)), f"Expected {expected} in modules, got {modules}"
        print("PASS: mock-owner-active modules_enabled includes pulse/tap/table/kds")

    def test_company_name_exists(self, me_data):
        company = me_data.get("company")
        assert company is not None, "Expected company to exist"
        assert company.get("name"), "Expected company.name to exist"
        print(f"PASS: mock-owner-active company.name={company.get('name')}")

    def test_role_is_owner(self, me_data):
        roles = me_data.get("roles", [])
        assert len(roles) > 0, "Expected at least one role"
        assert roles[0].get("role") == "owner", f"Expected role=owner, got {roles[0].get('role')}"
        print("PASS: mock-owner-active roles[0].role=owner")


# ═══════════════════════════════════════════════════════════════════════
# 4. GET /api/auth/me FOR MOCK-TRIAL
# ═══════════════════════════════════════════════════════════════════════

class TestMockTrial:
    """GET /api/auth/me for mock-trial@spetapp.com
    
    Expected:
    - status=trial
    - plan.id=core
    - plan.status=trial
    - onboarding_completed=true
    """

    @pytest.fixture(scope="class")
    def me_data(self, session):
        token, _ = login(session, MOCK_USERS["trial"]["email"], MOCK_USERS["trial"]["password"])
        assert token, "Failed to login mock-trial"
        return get_me(session, token)

    def test_status_is_trial(self, me_data):
        assert me_data is not None, "Failed to get /me data"
        assert me_data.get("status") == "trial", f"Expected status=trial, got {me_data.get('status')}"
        print("PASS: mock-trial status=trial")

    def test_plan_id_is_core(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("id") == "core", f"Expected plan.id=core, got {plan.get('id')}"
        print("PASS: mock-trial plan.id=core")

    def test_plan_status_is_trial(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("status") == "trial", f"Expected plan.status=trial, got {plan.get('status')}"
        print("PASS: mock-trial plan.status=trial")

    def test_onboarding_completed_true(self, me_data):
        assert me_data.get("onboarding_completed") is True, f"Expected onboarding_completed=true, got {me_data.get('onboarding_completed')}"
        print("PASS: mock-trial onboarding_completed=true")


# ═══════════════════════════════════════════════════════════════════════
# 5. GET /api/auth/me FOR MOCK-PENDING
# ═══════════════════════════════════════════════════════════════════════

class TestMockPending:
    """GET /api/auth/me for mock-pending@spetapp.com
    
    Expected:
    - status=pending_payment
    - onboarding_completed=false
    - plan.id=flow
    """

    @pytest.fixture(scope="class")
    def me_data(self, session):
        token, _ = login(session, MOCK_USERS["pending"]["email"], MOCK_USERS["pending"]["password"])
        assert token, "Failed to login mock-pending"
        return get_me(session, token)

    def test_status_is_pending_payment(self, me_data):
        assert me_data is not None, "Failed to get /me data"
        assert me_data.get("status") == "pending_payment", f"Expected status=pending_payment, got {me_data.get('status')}"
        print("PASS: mock-pending status=pending_payment")

    def test_onboarding_completed_false(self, me_data):
        assert me_data.get("onboarding_completed") is False, f"Expected onboarding_completed=false, got {me_data.get('onboarding_completed')}"
        print("PASS: mock-pending onboarding_completed=false")

    def test_plan_id_is_flow(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("id") == "flow", f"Expected plan.id=flow, got {plan.get('id')}"
        print("PASS: mock-pending plan.id=flow")


# ═══════════════════════════════════════════════════════════════════════
# 6. GET /api/auth/me FOR MOCK-CANCELLED
# ═══════════════════════════════════════════════════════════════════════

class TestMockCancelled:
    """GET /api/auth/me for mock-cancelled@spetapp.com
    
    Expected:
    - status=cancelled
    - plan.id=flow
    - onboarding_completed=true
    """

    @pytest.fixture(scope="class")
    def me_data(self, session):
        token, _ = login(session, MOCK_USERS["cancelled"]["email"], MOCK_USERS["cancelled"]["password"])
        assert token, "Failed to login mock-cancelled"
        return get_me(session, token)

    def test_status_is_cancelled(self, me_data):
        assert me_data is not None, "Failed to get /me data"
        assert me_data.get("status") == "cancelled", f"Expected status=cancelled, got {me_data.get('status')}"
        print("PASS: mock-cancelled status=cancelled")

    def test_plan_id_is_flow(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("id") == "flow", f"Expected plan.id=flow, got {plan.get('id')}"
        print("PASS: mock-cancelled plan.id=flow")

    def test_onboarding_completed_true(self, me_data):
        assert me_data.get("onboarding_completed") is True, f"Expected onboarding_completed=true, got {me_data.get('onboarding_completed')}"
        print("PASS: mock-cancelled onboarding_completed=true")


# ═══════════════════════════════════════════════════════════════════════
# 7. GET /api/auth/me FOR MOCK-NO-ONBOARDING
# ═══════════════════════════════════════════════════════════════════════

class TestMockNoOnboarding:
    """GET /api/auth/me for mock-no-onboarding@spetapp.com
    
    Expected:
    - status=active
    - onboarding_completed=false
    - plan.id=sync
    """

    @pytest.fixture(scope="class")
    def me_data(self, session):
        token, _ = login(session, MOCK_USERS["no_onboarding"]["email"], MOCK_USERS["no_onboarding"]["password"])
        assert token, "Failed to login mock-no-onboarding"
        return get_me(session, token)

    def test_status_is_active(self, me_data):
        assert me_data is not None, "Failed to get /me data"
        assert me_data.get("status") == "active", f"Expected status=active, got {me_data.get('status')}"
        print("PASS: mock-no-onboarding status=active")

    def test_onboarding_completed_false(self, me_data):
        assert me_data.get("onboarding_completed") is False, f"Expected onboarding_completed=false, got {me_data.get('onboarding_completed')}"
        print("PASS: mock-no-onboarding onboarding_completed=false")

    def test_plan_id_is_sync(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("id") == "sync", f"Expected plan.id=sync, got {plan.get('id')}"
        print("PASS: mock-no-onboarding plan.id=sync")


# ═══════════════════════════════════════════════════════════════════════
# 8. GET /api/auth/me FOR MOCK-LIMITED
# ═══════════════════════════════════════════════════════════════════════

class TestMockLimited:
    """GET /api/auth/me for mock-limited@spetapp.com
    
    Expected:
    - status=active
    - roles[0].role=bartender
    - plan.id=core
    - roles[0].permissions.pulse=true
    """

    @pytest.fixture(scope="class")
    def me_data(self, session):
        token, _ = login(session, MOCK_USERS["limited"]["email"], MOCK_USERS["limited"]["password"])
        assert token, "Failed to login mock-limited"
        return get_me(session, token)

    def test_status_is_active(self, me_data):
        assert me_data is not None, "Failed to get /me data"
        assert me_data.get("status") == "active", f"Expected status=active, got {me_data.get('status')}"
        print("PASS: mock-limited status=active")

    def test_role_is_bartender(self, me_data):
        roles = me_data.get("roles", [])
        assert len(roles) > 0, "Expected at least one role"
        assert roles[0].get("role") == "bartender", f"Expected role=bartender, got {roles[0].get('role')}"
        print("PASS: mock-limited roles[0].role=bartender")

    def test_plan_id_is_core(self, me_data):
        plan = me_data.get("plan", {})
        assert plan.get("id") == "core", f"Expected plan.id=core, got {plan.get('id')}"
        print("PASS: mock-limited plan.id=core")

    def test_permissions_pulse_true(self, me_data):
        roles = me_data.get("roles", [])
        assert len(roles) > 0, "Expected at least one role"
        perms = roles[0].get("permissions", {})
        assert perms.get("pulse") is True, f"Expected permissions.pulse=true, got {perms.get('pulse')}"
        print("PASS: mock-limited roles[0].permissions.pulse=true")


# ═══════════════════════════════════════════════════════════════════════
# 9. GET /api/auth/permissions (Regression)
# ═══════════════════════════════════════════════════════════════════════

class TestPermissionsEndpoint:
    """GET /api/auth/permissions works for mock-owner-active"""

    def test_permissions_returns_data(self, session):
        token, _ = login(session, MOCK_USERS["owner_active"]["email"], MOCK_USERS["owner_active"]["password"])
        assert token, "Failed to login"
        headers = {"Authorization": f"Bearer {token}"}
        resp = session.get(f"{BASE_URL}/api/auth/permissions", headers=headers)
        assert resp.status_code == 200, f"Permissions failed: {resp.text}"
        data = resp.json().get("data", resp.json())
        assert "user_id" in data
        assert "email" in data
        assert "status" in data
        assert "plan_id" in data
        print("PASS: GET /api/auth/permissions works for mock-owner-active")


# ═══════════════════════════════════════════════════════════════════════
# 10. POST /api/auth/refresh-token (Regression)
# ═══════════════════════════════════════════════════════════════════════

class TestRefreshToken:
    """POST /api/auth/refresh-token works after login"""

    def test_refresh_token_works(self, session):
        _, refresh_token = login(session, MOCK_USERS["owner_active"]["email"], MOCK_USERS["owner_active"]["password"])
        assert refresh_token, "Failed to get refresh token"
        resp = session.post(f"{BASE_URL}/api/auth/refresh-token", json={"refresh_token": refresh_token})
        assert resp.status_code == 200, f"Refresh token failed: {resp.text}"
        data = resp.json().get("data", resp.json())
        assert "access_token" in data, "Missing access_token in refresh response"
        assert "refresh_token" in data, "Missing refresh_token in refresh response"
        print("PASS: POST /api/auth/refresh-token works after login")


# ═══════════════════════════════════════════════════════════════════════
# 11. GET /api/onboarding/plans (Regression)
# ═══════════════════════════════════════════════════════════════════════

class TestOnboardingPlans:
    """GET /api/onboarding/plans returns 4 plans with correct pricing"""

    def test_plans_returns_4_plans(self, session):
        resp = session.get(f"{BASE_URL}/api/onboarding/plans")
        assert resp.status_code == 200, f"Plans failed: {resp.text}"
        data = resp.json().get("data", resp.json())
        plans = data.get("plans", [])
        assert len(plans) == 4, f"Expected 4 plans, got {len(plans)}"
        print("PASS: GET /api/onboarding/plans returns 4 plans")

    def test_plans_have_correct_pricing(self, session):
        resp = session.get(f"{BASE_URL}/api/onboarding/plans")
        assert resp.status_code == 200
        data = resp.json().get("data", resp.json())
        plans = {p["id"]: p for p in data.get("plans", [])}
        
        expected_prices = {
            "core": 79.0,
            "flow": 149.0,
            "sync": 299.0,
            "os": 499.0
        }
        
        for plan_id, expected_price in expected_prices.items():
            assert plan_id in plans, f"Missing plan: {plan_id}"
            actual_price = plans[plan_id].get("price")
            assert actual_price == expected_price, f"Plan {plan_id} expected price={expected_price}, got {actual_price}"
        
        print("PASS: Plans have correct pricing (core=$79, flow=$149, sync=$299, os=$499)")


# ═══════════════════════════════════════════════════════════════════════
# 12. FULL /me RESPONSE STRUCTURE VALIDATION
# ═══════════════════════════════════════════════════════════════════════

class TestMeResponseStructure:
    """Validate the complete structure of /api/auth/me response"""

    def test_me_has_required_fields(self, session):
        token, _ = login(session, MOCK_USERS["owner_active"]["email"], MOCK_USERS["owner_active"]["password"])
        me = get_me(session, token)
        
        # User info fields
        assert "id" in me, "Missing id"
        assert "email" in me, "Missing email"
        assert "name" in me, "Missing name"
        assert "status" in me, "Missing status"
        assert "onboarding_completed" in me, "Missing onboarding_completed"
        
        # Company
        assert "company" in me, "Missing company"
        company = me["company"]
        if company:
            assert "id" in company, "Missing company.id"
            assert "name" in company, "Missing company.name"
        
        # Plan
        assert "plan" in me, "Missing plan"
        plan = me["plan"]
        if plan:
            assert "id" in plan, "Missing plan.id"
            assert "name" in plan, "Missing plan.name"
            assert "status" in plan, "Missing plan.status"
            assert "interval" in plan, "Missing plan.interval"
            assert "modules" in plan, "Missing plan.modules"
            assert "limits" in plan, "Missing plan.limits"
        
        # Modules enabled
        assert "modules_enabled" in me, "Missing modules_enabled"
        assert isinstance(me["modules_enabled"], list), "modules_enabled should be list"
        
        # Roles
        assert "roles" in me, "Missing roles"
        assert isinstance(me["roles"], list), "roles should be list"
        if me["roles"]:
            role = me["roles"][0]
            assert "role" in role, "Missing role in roles[0]"
            assert "permissions" in role, "Missing permissions in roles[0]"
        
        print("PASS: /me response has all required fields with correct structure")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
