"""
Iteration 50: Onboarding, Pricing, and Menu Grid Phase 2 Tests
Tests:
- Pricing plans API
- Lead capture API
- Checkout (Stripe) API
- Kitchen page KDS endpoints
- Login flow
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://owner-insights-hub.preview.emergentagent.com')

VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

# Test Credentials
TEST_USER = {"email": "teste@teste.com", "password": "12345"}
CEO_USER = {"email": "garcia.rapha2@gmail.com", "password": "12345"}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for test user."""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestOnboardingPlansAPI:
    """Tests for /api/onboarding/plans - Pricing plans endpoint"""

    def test_get_plans_returns_200(self, api_client):
        """GET /api/onboarding/plans should return 200"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_get_plans_returns_3_plans(self, api_client):
        """Plans endpoint should return exactly 3 plans (Starter, Growth, Enterprise)"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/plans")
        data = response.json()
        assert "plans" in data, "Response should contain 'plans' key"
        plans = data["plans"]
        assert len(plans) == 3, f"Expected 3 plans, got {len(plans)}"

    def test_plans_have_correct_structure(self, api_client):
        """Each plan should have id, name, price, currency, interval, features"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/plans")
        plans = response.json()["plans"]
        required_fields = ["id", "name", "price", "currency", "interval", "features"]
        for plan in plans:
            for field in required_fields:
                assert field in plan, f"Plan missing required field: {field}"

    def test_starter_plan_details(self, api_client):
        """Starter plan should be $79/month"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/plans")
        plans = response.json()["plans"]
        starter = next((p for p in plans if p["id"] == "starter"), None)
        assert starter is not None, "Starter plan not found"
        assert starter["name"] == "Starter", f"Expected name 'Starter', got {starter['name']}"
        assert starter["price"] == 79.0 or starter["price"] == 79, f"Expected price 79, got {starter['price']}"
        assert starter["interval"] == "month", f"Expected interval 'month', got {starter['interval']}"

    def test_growth_plan_details(self, api_client):
        """Growth plan should be $149/month"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/plans")
        plans = response.json()["plans"]
        growth = next((p for p in plans if p["id"] == "growth"), None)
        assert growth is not None, "Growth plan not found"
        assert growth["name"] == "Growth", f"Expected name 'Growth', got {growth['name']}"
        assert growth["price"] == 149.0 or growth["price"] == 149, f"Expected price 149, got {growth['price']}"

    def test_enterprise_plan_details(self, api_client):
        """Enterprise plan should be $299/month"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/plans")
        plans = response.json()["plans"]
        enterprise = next((p for p in plans if p["id"] == "enterprise"), None)
        assert enterprise is not None, "Enterprise plan not found"
        assert enterprise["name"] == "Enterprise", f"Expected name 'Enterprise', got {enterprise['name']}"
        assert enterprise["price"] == 299.0 or enterprise["price"] == 299, f"Expected price 299, got {enterprise['price']}"


class TestOnboardingLeadAPI:
    """Tests for /api/onboarding/lead - Lead capture endpoint"""

    def test_lead_capture_success(self, api_client):
        """POST /api/onboarding/lead should capture lead info"""
        payload = {
            "name": "Test Lead",
            "email": "testlead@example.com",
            "phone": "+1234567890",
            "plan_id": "starter"
        }
        response = api_client.post(f"{BASE_URL}/api/onboarding/lead", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "lead_id" in data, "Response should contain 'lead_id'"
        assert data.get("status") == "captured", "Lead status should be 'captured'"

    def test_lead_capture_missing_name(self, api_client):
        """Lead capture should fail without name"""
        payload = {
            "email": "test@example.com",
            "plan_id": "starter"
        }
        response = api_client.post(f"{BASE_URL}/api/onboarding/lead", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"

    def test_lead_capture_missing_email(self, api_client):
        """Lead capture should fail without email"""
        payload = {
            "name": "Test User",
            "plan_id": "starter"
        }
        response = api_client.post(f"{BASE_URL}/api/onboarding/lead", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"

    def test_lead_capture_invalid_plan(self, api_client):
        """Lead capture should fail with invalid plan_id"""
        payload = {
            "name": "Test User",
            "email": "test@example.com",
            "plan_id": "invalid_plan"
        }
        response = api_client.post(f"{BASE_URL}/api/onboarding/lead", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestOnboardingCheckoutAPI:
    """Tests for /api/onboarding/checkout - Stripe checkout endpoint"""

    def test_checkout_creates_session(self, api_client):
        """POST /api/onboarding/checkout should create Stripe session"""
        # First capture a lead
        lead_payload = {
            "name": "Checkout Test User",
            "email": "checkout@example.com",
            "phone": "+1234567890",
            "plan_id": "growth"
        }
        lead_res = api_client.post(f"{BASE_URL}/api/onboarding/lead", json=lead_payload)
        lead_id = lead_res.json().get("lead_id")

        # Create checkout session
        checkout_payload = {
            "plan_id": "growth",
            "lead_id": lead_id,
            "origin_url": "https://owner-insights-hub.preview.emergentagent.com"
        }
        response = api_client.post(f"{BASE_URL}/api/onboarding/checkout", json=checkout_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, "Response should contain checkout 'url'"
        assert "session_id" in data, "Response should contain 'session_id'"
        # URL should be a Stripe URL or contain stripe
        assert data["url"], "Checkout URL should not be empty"

    def test_checkout_missing_plan_id(self, api_client):
        """Checkout should fail without plan_id"""
        payload = {
            "origin_url": "https://example.com"
        }
        response = api_client.post(f"{BASE_URL}/api/onboarding/checkout", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"

    def test_checkout_invalid_plan_id(self, api_client):
        """Checkout should fail with invalid plan_id"""
        payload = {
            "plan_id": "nonexistent",
            "origin_url": "https://example.com"
        }
        response = api_client.post(f"{BASE_URL}/api/onboarding/checkout", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestLoginAPI:
    """Tests for login flow"""

    def test_login_test_user_success(self, api_client):
        """Login with test user credentials should succeed"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEST_USER)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data, "Response should contain token"

    def test_login_ceo_user_success(self, api_client):
        """Login with CEO user credentials should succeed"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=CEO_USER)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data, "Response should contain token"

    def test_login_invalid_credentials(self, api_client):
        """Login with wrong credentials should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"


class TestKDSKitchenAPI:
    """Tests for KDS/Kitchen endpoints"""

    def test_kds_tickets_returns_200(self, api_client, auth_token):
        """GET /api/kds/tickets should return 200"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = api_client.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=kitchen")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_kds_tickets_has_correct_structure(self, api_client, auth_token):
        """KDS tickets should return tickets array"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = api_client.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=kitchen")
        data = response.json()
        assert "tickets" in data, "Response should contain 'tickets' key"
        assert isinstance(data["tickets"], list), "tickets should be a list"

    def test_kds_bar_tickets(self, api_client, auth_token):
        """GET /api/kds/tickets with destination=bar should work"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = api_client.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=bar")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


class TestTapCatalogAPI:
    """Tests for Tap/Menu catalog endpoints"""

    def test_tap_catalog_returns_200(self, api_client, auth_token):
        """GET /api/tap/catalog should return 200"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = api_client.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_tap_catalog_has_items(self, api_client, auth_token):
        """Tap catalog should return items array"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = api_client.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}")
        data = response.json()
        assert "items" in data, "Response should contain 'items' key"
        assert isinstance(data["items"], list), "items should be a list"


class TestTableAPI:
    """Tests for Table endpoints"""

    def test_tables_list_returns_200(self, api_client, auth_token):
        """GET /api/table/tables should return 200"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = api_client.get(f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_tables_list_has_tables(self, api_client, auth_token):
        """Tables endpoint should return tables array"""
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
        response = api_client.get(f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}")
        data = response.json()
        assert "tables" in data, "Response should contain 'tables' key"
        assert isinstance(data["tables"], list), "tables should be a list"


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_returns_200(self, api_client):
        """GET /api/health should return 200"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", "Health status should be 'healthy'"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
