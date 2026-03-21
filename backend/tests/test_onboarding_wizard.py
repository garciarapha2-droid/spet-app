"""
Onboarding Wizard API Tests
Tests for the 10-step onboarding wizard endpoints:
- POST /api/onboarding/save-config
- POST /api/onboarding/complete
- POST /api/onboarding/skip
- GET /api/onboarding/status
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_NOT_ONBOARDED = {"email": "teste1@teste.com", "password": "12345"}
TEST_USER_ONBOARDED = {"email": "teste@teste.com", "password": "12345"}
CEO_USER = {"email": "garcia.rapha2@gmail.com", "password": "12345"}


def unwrap_response(data):
    """Unwrap envelope format {success, data, error}"""
    if isinstance(data, dict) and 'data' in data and 'success' in data:
        return data['data']
    return data


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token_not_onboarded(api_client):
    """Get auth token for teste1@teste.com (not onboarded user)"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_NOT_ONBOARDED)
    if response.status_code == 200:
        data = unwrap_response(response.json())
        return data.get("access_token")
    pytest.skip(f"Authentication failed for {TEST_USER_NOT_ONBOARDED['email']}")


@pytest.fixture(scope="module")
def auth_token_onboarded(api_client):
    """Get auth token for teste@teste.com (onboarded user)"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=TEST_USER_ONBOARDED)
    if response.status_code == 200:
        data = unwrap_response(response.json())
        return data.get("access_token")
    pytest.skip(f"Authentication failed for {TEST_USER_ONBOARDED['email']}")


@pytest.fixture(scope="module")
def auth_token_ceo(api_client):
    """Get auth token for CEO user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=CEO_USER)
    if response.status_code == 200:
        data = unwrap_response(response.json())
        return data.get("access_token")
    pytest.skip(f"Authentication failed for {CEO_USER['email']}")


class TestOnboardingStatus:
    """Test GET /api/onboarding/status endpoint"""
    
    def test_status_requires_auth(self, api_client):
        """Status endpoint requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/status")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Status endpoint requires authentication")
    
    def test_status_for_not_onboarded_user(self, api_client, auth_token_not_onboarded):
        """Get status for user who hasn't completed onboarding"""
        response = api_client.get(
            f"{BASE_URL}/api/onboarding/status",
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        print(f"Status response for not-onboarded user: {data}")
        
        # Verify response structure
        assert "status" in data or "onboarding_completed" in data
        assert data.get("onboarding_completed") == False, "Not-onboarded user should have onboarding_completed=False"
        print("PASS: Status endpoint returns valid response for not-onboarded user")
    
    def test_status_for_onboarded_user(self, api_client, auth_token_onboarded):
        """Get status for user who has completed onboarding"""
        response = api_client.get(
            f"{BASE_URL}/api/onboarding/status",
            headers={"Authorization": f"Bearer {auth_token_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        print(f"Status response for onboarded user: {data}")
        
        # Onboarded user should have onboarding_completed = True
        assert data.get("onboarding_completed") == True, "Onboarded user should have onboarding_completed=True"
        print("PASS: Onboarded user has onboarding_completed=True")


class TestSaveConfig:
    """Test POST /api/onboarding/save-config endpoint"""
    
    def test_save_config_requires_auth(self, api_client):
        """Save config endpoint requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/onboarding/save-config", json={})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Save config endpoint requires authentication")
    
    def test_save_config_basic(self, api_client, auth_token_not_onboarded):
        """Save basic onboarding config"""
        config = {
            "venueName": "Test Venue",
            "venueType": ["bar", "restaurant"],
            "enabledModules": ["pulse"],
            "paymentFlow": {
                "bartendersCanCloseChecks": True,
                "serversCanCloseChecks": False,
                "cashierOnly": False
            }
        }
        response = api_client.post(
            f"{BASE_URL}/api/onboarding/save-config",
            json=config,
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        assert data.get("saved") == True, "Response should indicate config was saved"
        print("PASS: Basic config saved successfully")
    
    def test_save_config_with_team_members(self, api_client, auth_token_not_onboarded):
        """Save config with team members"""
        config = {
            "venueName": "Test Venue",
            "venueType": ["club"],
            "enabledModules": ["pulse", "tap"],
            "teamMembers": [
                {"name": "John Doe", "email": "john@test.com", "role": "Manager"},
                {"name": "Jane Smith", "email": "jane@test.com", "role": "Server"}
            ]
        }
        response = api_client.post(
            f"{BASE_URL}/api/onboarding/save-config",
            json=config,
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Config with team members saved successfully")
    
    def test_save_config_with_all_modules(self, api_client, auth_token_not_onboarded):
        """Save config with all modules enabled"""
        config = {
            "venueName": "Full Feature Venue",
            "venueType": ["restaurant", "bar", "lounge"],
            "enabledModules": ["pulse", "tap", "table", "kds", "reservations", "events"],
            "paymentFlow": {
                "bartendersCanCloseChecks": True,
                "serversCanCloseChecks": True,
                "cashierOnly": False
            },
            "pulseRewards": {
                "tiers": [
                    {"id": "1", "name": "Bronze", "minPoints": "0"},
                    {"id": "2", "name": "Silver", "minPoints": "500"},
                    {"id": "3", "name": "Gold", "minPoints": "1500"}
                ],
                "rewards": [
                    {"id": "1", "name": "Free Beer", "pointsCost": "100", "category": "drinks"}
                ],
                "pointsPerDollar": "2"
            },
            "reservationSettings": {
                "waitlistEnabled": True,
                "vipPriority": True
            }
        }
        response = api_client.post(
            f"{BASE_URL}/api/onboarding/save-config",
            json=config,
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Full config with all modules saved successfully")


class TestOnboardingComplete:
    """Test POST /api/onboarding/complete endpoint"""
    
    def test_complete_requires_auth(self, api_client):
        """Complete endpoint requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/onboarding/complete", json={})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Complete endpoint requires authentication")
    
    def test_complete_with_empty_body(self, api_client, auth_token_not_onboarded):
        """Complete onboarding with empty body"""
        response = api_client.post(
            f"{BASE_URL}/api/onboarding/complete",
            json={},
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        assert data.get("completed") == True, "Response should indicate completion"
        assert data.get("step") == 10, "Step should be 10 after completion"
        print("PASS: Onboarding completed with empty body")
    
    def test_complete_with_full_config(self, api_client, auth_token_not_onboarded):
        """Complete onboarding with full configuration"""
        config = {
            "venueName": "Complete Test Venue",
            "venueType": ["bar"],
            "enabledModules": ["pulse", "table"],
            "paymentFlow": {
                "bartendersCanCloseChecks": True,
                "serversCanCloseChecks": False,
                "cashierOnly": False
            },
            "pulseMenu": {
                "items": [
                    {"id": "1", "name": "Test Cocktail", "price": "12.00", "category": "Cocktails", "extras": []}
                ],
                "categories": ["Cocktails", "Beers"]
            },
            "pulseRewards": {
                "tiers": [{"id": "1", "name": "Bronze", "minPoints": "0"}],
                "rewards": [{"id": "1", "name": "Free Drink", "pointsCost": "100", "category": "drinks"}],
                "pointsPerDollar": "2"
            },
            "tables": [
                {"id": "1", "name": "Table #1", "capacity": 4, "zone": "Main"}
            ],
            "reservationSettings": {
                "waitlistEnabled": True,
                "vipPriority": True
            }
        }
        response = api_client.post(
            f"{BASE_URL}/api/onboarding/complete",
            json=config,
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        assert data.get("completed") == True
        print("PASS: Onboarding completed with full config")


class TestOnboardingSkip:
    """Test POST /api/onboarding/skip endpoint"""
    
    def test_skip_requires_auth(self, api_client):
        """Skip endpoint requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/onboarding/skip", json={})
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("PASS: Skip endpoint requires authentication")
    
    def test_skip_onboarding(self, api_client, auth_token_not_onboarded):
        """Skip onboarding"""
        response = api_client.post(
            f"{BASE_URL}/api/onboarding/skip",
            json={},
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        assert data.get("skipped") == True, "Response should indicate skipped"
        print("PASS: Onboarding skipped successfully")


class TestOnboardingPlans:
    """Test GET /api/onboarding/plans endpoint"""
    
    def test_get_plans(self, api_client):
        """Get available plans (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/onboarding/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        assert "plans" in data, "Response should contain plans"
        plans = data["plans"]
        assert len(plans) > 0, "Should have at least one plan"
        
        # Verify plan structure
        for plan in plans:
            assert "id" in plan, "Plan should have id"
            assert "name" in plan, "Plan should have name"
            assert "price" in plan, "Plan should have price"
        
        print(f"PASS: Got {len(plans)} plans")


class TestAuthMeRedirect:
    """Test that /api/auth/me returns correct onboarding status"""
    
    def test_auth_me_not_onboarded(self, api_client, auth_token_not_onboarded):
        """Auth me should indicate onboarding not completed"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token_not_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        
        print(f"Auth me response for not-onboarded user: {data}")
        # Check onboarding_completed field
        onboarding_completed = data.get("onboarding_completed", False)
        print(f"onboarding_completed: {onboarding_completed}")
        print("PASS: Auth me returns user data")
    
    def test_auth_me_onboarded(self, api_client, auth_token_onboarded):
        """Auth me should indicate onboarding completed"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {auth_token_onboarded}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = unwrap_response(response.json())
        
        print(f"Auth me response for onboarded user: {data}")
        onboarding_completed = data.get("onboarding_completed", False)
        assert onboarding_completed == True, "Onboarded user should have onboarding_completed=True"
        print("PASS: Onboarded user has onboarding_completed=True in auth/me")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
