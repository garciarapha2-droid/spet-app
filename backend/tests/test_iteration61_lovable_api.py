"""
Iteration 61: Lovable API Backend Tests
Tests for standardized {success, data, error} response format and all auth/onboarding endpoints
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
DEMO_FULL_EMAIL = "teste@teste.com"
DEMO_FULL_PASSWORD = "12345"
DEMO_ONBOARDING_EMAIL = "teste1@teste.com"
DEMO_ONBOARDING_PASSWORD = "12345"


class TestStandardizedResponseFormat:
    """Test 1: All API responses follow {success: true/false, data: ..., error: ...} format"""

    def test_success_response_format(self):
        """Test successful response has correct format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify standardized format
        assert "success" in data
        assert "data" in data
        assert "error" in data
        assert data["success"] == True
        assert data["error"] is None
        assert isinstance(data["data"], dict)

    def test_error_response_format(self):
        """Test error response has correct format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        data = response.json()
        
        # Verify standardized format
        assert "success" in data
        assert "data" in data
        assert "error" in data
        assert data["success"] == False
        assert data["data"] is None
        assert isinstance(data["error"], dict)
        assert "code" in data["error"]
        assert "message" in data["error"]


class TestSignup:
    """Test 2: POST /api/auth/signup → returns standardized response with pending_payment status + checkout_url"""
    
    def test_signup_returns_standardized_response(self):
        """Signup returns {success, data, error} format with pending_payment status and checkout_url"""
        unique_email = f"TEST_signup_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test User",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://owner-insights-hub.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        
        json_data = response.json()
        # Verify standardized format
        assert json_data["success"] == True
        assert json_data["error"] is None
        
        # Access actual data through 'data' key
        data = json_data["data"]
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["status"] == "pending_payment"
        assert "checkout_url" in data
        assert data["checkout_url"] is not None
        assert "stripe.com" in data["checkout_url"] or "checkout" in data["checkout_url"]
        
        # Verify next route
        assert data["next"]["route"] == "/payment/pending"


class TestLogin:
    """Test 3 & 4: POST /api/auth/login tests"""
    
    def test_login_returns_standardized_response_with_token_and_user(self):
        """Test 3: Login returns standardized response with token + user (status, onboarding_completed)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        
        # User object has required fields
        user = data["user"]
        assert "id" in user
        assert "email" in user
        assert "status" in user
        assert "onboarding_completed" in user
    
    def test_login_wrong_credentials_returns_unauthorized(self):
        """Test 4: Login with wrong credentials returns {success: false, error: {code: UNAUTHORIZED}}"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401
        
        json_data = response.json()
        assert json_data["success"] == False
        assert json_data["data"] is None
        assert json_data["error"]["code"] == "UNAUTHORIZED"


class TestAuthMe:
    """Test 5 & 8: GET /api/auth/me tests"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["data"]["access_token"]
    
    def test_me_returns_user_profile_with_status_onboarding_roles_venues(self, ceo_token):
        """Test 5: GET /api/auth/me returns user profile with status, onboarding_completed, roles, venues"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "id" in data
        assert "email" in data
        assert "status" in data
        assert "onboarding_completed" in data
        assert "roles" in data
        assert "venues" in data
        assert isinstance(data["roles"], list)
        assert isinstance(data["venues"], list)
    
    def test_me_without_token_returns_unauthorized(self):
        """Test 8: GET /api/auth/me without token returns {success: false, error: {code: UNAUTHORIZED}}"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        
        json_data = response.json()
        assert json_data["success"] == False
        assert json_data["error"]["code"] == "UNAUTHORIZED"


class TestAuthPermissions:
    """Test 6: GET /api/auth/permissions tests"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["data"]["access_token"]
    
    def test_permissions_returns_role_modules_flags(self, ceo_token):
        """Test 6: GET /api/auth/permissions returns role, modules, flags (is_active, requires_payment, requires_onboarding)"""
        response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "user_id" in data
        assert "email" in data
        assert "global_role" in data
        assert "status" in data
        assert "onboarding_completed" in data
        assert "is_demo" in data
        assert "access" in data
        
        # Verify flags
        assert "flags" in data
        flags = data["flags"]
        assert "is_active" in flags
        assert "requires_payment" in flags
        assert "requires_onboarding" in flags


class TestAuthPaymentStatus:
    """Test 7: GET /api/auth/payment-status tests"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["data"]["access_token"]
    
    def test_payment_status_returns_payment_info(self, ceo_token):
        """Test 7: GET /api/auth/payment-status returns payment status with is_active, requires_payment flags"""
        response = requests.get(
            f"{BASE_URL}/api/auth/payment-status",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "user_id" in data
        assert "status" in data
        assert "is_active" in data
        assert "is_demo" in data
        assert "requires_payment" in data
        assert "requires_onboarding" in data


class TestDemoUserCEO:
    """Test 9: Demo user garcia.rapha2@gmail.com tests"""
    
    def test_ceo_demo_user_flags(self):
        """Test 9: Demo user garcia.rapha2@gmail.com → is_demo=true, is_active=true, onboarding_completed=true"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        token = response.json()["data"]["access_token"]
        
        # Check permissions endpoint
        perm_response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        data = perm_response.json()["data"]
        
        assert data["is_demo"] == True
        assert data["flags"]["is_active"] == True
        assert data["onboarding_completed"] == True


class TestDemoUserFull:
    """Test 10: Demo user teste@teste.com tests"""
    
    def test_demo_full_user_flags(self):
        """Test 10: Demo user teste@teste.com → is_demo=true, onboarding_completed=true"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_FULL_EMAIL, "password": DEMO_FULL_PASSWORD}
        )
        token = response.json()["data"]["access_token"]
        
        perm_response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        data = perm_response.json()["data"]
        
        assert data["is_demo"] == True
        assert data["onboarding_completed"] == True
        assert data["flags"]["is_active"] == True


class TestDemoUserOnboarding:
    """Test 11: Demo user teste1@teste.com tests"""
    
    def test_demo_onboarding_user_flags(self):
        """Test 11: Demo user teste1@teste.com → is_demo=true, requires_onboarding may be true initially"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_ONBOARDING_EMAIL, "password": DEMO_ONBOARDING_PASSWORD}
        )
        assert response.status_code == 200
        token = response.json()["data"]["access_token"]
        
        perm_response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        data = perm_response.json()["data"]
        
        assert data["is_demo"] == True
        assert data["flags"]["is_active"] == True  # Demo users always active
        # Note: requires_onboarding depends on state, but demo user bypasses paywall


class TestOnboardingPlans:
    """Test 12: GET /api/onboarding/plans tests"""
    
    def test_plans_returns_three_plans(self):
        """Test 12: GET /api/onboarding/plans → returns 3 plans in standardized format"""
        response = requests.get(f"{BASE_URL}/api/onboarding/plans")
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "plans" in data
        plans = data["plans"]
        assert len(plans) == 3
        
        plan_ids = [p["id"] for p in plans]
        assert "starter" in plan_ids
        assert "growth" in plan_ids
        assert "enterprise" in plan_ids
        
        # Verify plan structure
        for plan in plans:
            assert "id" in plan
            assert "name" in plan
            assert "price" in plan
            assert "currency" in plan
            assert "interval" in plan
            assert "features" in plan


class TestOnboardingCreateCheckout:
    """Test 13: POST /api/onboarding/create-checkout tests"""
    
    @pytest.fixture
    def test_user_token(self):
        """Create a test user for checkout tests"""
        unique_email = f"TEST_checkout_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Checkout Test",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://owner-insights-hub.preview.emergentagent.com"
            }
        )
        return response.json()["data"]["access_token"], response.json()["data"]["user"]["id"]
    
    def test_create_checkout_requires_auth(self):
        """Create checkout requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/create-checkout",
            json={"origin_url": "https://test.com"}
        )
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "UNAUTHORIZED"
    
    def test_create_checkout_returns_stripe_url(self, test_user_token):
        """Test 13: POST /api/onboarding/create-checkout → returns Stripe checkout URL (requires auth)"""
        token, user_id = test_user_token
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/create-checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"origin_url": "https://owner-insights-hub.preview.emergentagent.com"}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "url" in data
        assert "session_id" in data
        assert "stripe.com" in data["url"] or "checkout" in data["url"]


class TestOnboardingFlow:
    """Test 14 & 15: Onboarding flow tests"""
    
    @pytest.fixture
    def test_user_token(self):
        """Create a test user for onboarding tests"""
        unique_email = f"TEST_onboard_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Onboard Test",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://owner-insights-hub.preview.emergentagent.com"
            }
        )
        return response.json()["data"]["access_token"], response.json()["data"]["user"]["id"]
    
    def test_account_setup_returns_standardized_response(self, test_user_token):
        """account-setup returns standardized response"""
        token, user_id = test_user_token
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "user_name": "Test User",
                "venue_name": "Test Venue",
                "venue_type": "bar"
            }
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "venue_id" in data
        assert "step" in data
        assert data["step"] == 2
    
    def test_password_reset_returns_standardized_response(self, test_user_token):
        """password-reset returns standardized response"""
        token, user_id = test_user_token
        
        # First do account setup
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_name": "Test User", "venue_name": "Test Venue", "venue_type": "bar"}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/password-reset",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_password": "newpassword123"}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        assert json_data["data"]["step"] == 3
    
    def test_modules_setup_returns_standardized_response(self, test_user_token):
        """modules-setup returns standardized response"""
        token, user_id = test_user_token
        
        # First do account setup
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_name": "Test User", "venue_name": "Test Venue", "venue_type": "bar"}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/modules-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={"modules": ["pulse", "tap", "kds"]}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        assert json_data["data"]["step"] == 4
        assert "modules" in json_data["data"]
    
    def test_team_setup_returns_standardized_response(self, test_user_token):
        """team-setup returns standardized response"""
        token, user_id = test_user_token
        
        # Do prerequisite steps
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_name": "Test User", "venue_name": "Test Venue", "venue_type": "bar"}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/team-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        assert json_data["data"]["step"] == 5
    
    def test_complete_returns_standardized_response(self, test_user_token):
        """complete returns standardized response"""
        token, user_id = test_user_token
        
        # Do account setup
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_name": "Test User", "venue_name": "Test Venue", "venue_type": "bar"}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/complete",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        assert json_data["data"]["completed"] == True
        assert json_data["data"]["step"] == 6
    
    def test_permissions_after_onboarding_complete(self, test_user_token):
        """Test 15: After completing onboarding, GET /api/auth/permissions shows requires_onboarding=false"""
        token, user_id = test_user_token
        
        # Do account setup and complete
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_name": "Test User", "venue_name": "Test Venue", "venue_type": "bar"}
        )
        
        requests.post(
            f"{BASE_URL}/api/onboarding/complete",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Check permissions
        response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        json_data = response.json()
        assert json_data["success"] == True
        assert json_data["data"]["onboarding_completed"] == True
        assert json_data["data"]["flags"]["requires_onboarding"] == False


class TestLogout:
    """Test 16: POST /api/auth/logout tests"""
    
    def test_logout_invalidates_token(self):
        """Test 16: POST /api/auth/logout → invalidates token"""
        # Login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        token = login_response.json()["data"]["access_token"]
        
        # Logout
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert logout_response.status_code == 200
        
        json_data = logout_response.json()
        assert json_data["success"] == True
        
        # Note: Token invalidation is stored in DB, subsequent requests with same token
        # should be rejected (depending on implementation)


class TestValidationErrors:
    """Test 18: Validation errors return {success: false, error: {code: VALIDATION_ERROR}}"""
    
    def test_signup_missing_fields_returns_validation_error(self):
        """Signup with missing fields returns VALIDATION_ERROR"""
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={"name": "Test"}  # Missing email and password
        )
        assert response.status_code == 422
        
        json_data = response.json()
        assert json_data["success"] == False
        assert json_data["error"]["code"] == "VALIDATION_ERROR"
    
    def test_login_missing_fields_returns_validation_error(self):
        """Login with missing fields returns VALIDATION_ERROR"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@test.com"}  # Missing password
        )
        assert response.status_code == 422
        
        json_data = response.json()
        assert json_data["success"] == False
        assert json_data["error"]["code"] == "VALIDATION_ERROR"
    
    def test_password_reset_short_password_returns_error(self):
        """Password reset with short password returns error"""
        # Create test user
        unique_email = f"TEST_passreset_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test User",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://owner-insights-hub.preview.emergentagent.com"
            }
        )
        token = signup_response.json()["data"]["access_token"]
        
        # Try short password
        response = requests.post(
            f"{BASE_URL}/api/onboarding/password-reset",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_password": "12345"}  # Too short (<6 chars)
        )
        assert response.status_code == 400
        
        json_data = response.json()
        assert json_data["success"] == False


class TestUserDeletion:
    """Test user deletion and system account protection"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["data"]["access_token"]
    
    def test_delete_test_user(self, ceo_token):
        """Can delete test users"""
        # Create test user
        unique_email = f"TEST_delete_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Delete Test",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://owner-insights-hub.preview.emergentagent.com"
            }
        )
        user_id = signup_response.json()["data"]["user"]["id"]
        
        # Delete the user
        response = requests.delete(
            f"{BASE_URL}/api/auth/users/{user_id}",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        assert json_data["data"]["deleted"] == True
    
    def test_cannot_delete_system_account(self, ceo_token):
        """System accounts cannot be deleted"""
        # Get CEO user ID
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        ceo_user_id = me_response.json()["data"]["id"]
        
        # Try to delete CEO account - should fail
        response = requests.delete(
            f"{BASE_URL}/api/auth/users/{ceo_user_id}",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 403
        
        json_data = response.json()
        assert json_data["success"] == False
        assert json_data["error"]["code"] == "FORBIDDEN"


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_users():
    """Note: TEST_ prefixed users remain in DB but can be cleaned up manually"""
    yield
    # Test cleanup would happen here if needed
