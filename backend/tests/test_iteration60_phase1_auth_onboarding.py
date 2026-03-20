"""
Iteration 60: Phase 1 Auth & Onboarding Tests
Tests for signup, login, protected routes, onboarding flow
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
TEST_USER_EMAIL = "teste@teste.com"
TEST_USER_PASSWORD = "12345"


class TestPlans:
    """Test GET /api/onboarding/plans endpoint"""
    
    def test_get_plans_returns_three_plans(self):
        """Test 7: GET /api/onboarding/plans returns 3 plans"""
        response = requests.get(f"{BASE_URL}/api/onboarding/plans")
        assert response.status_code == 200
        
        data = response.json()
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


class TestSystemAccountLogin:
    """Test login with system accounts"""
    
    def test_ceo_login_returns_active_onboarded(self):
        """Test 5: System CEO account login with status=active, onboarding_completed=true"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        
        user = data["user"]
        assert user["status"] == "active"
        assert user["onboarding_completed"] == True
        
        # Test 5: next.route should be /venue/home for onboarded users
        assert "next" in data
        assert data["next"]["route"] == "/venue/home"
    
    def test_regular_user_login(self):
        """Test regular user login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
    
    def test_invalid_credentials_return_401(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "wrongpass"}
        )
        assert response.status_code == 401


class TestAuthMeEndpoint:
    """Test GET /api/auth/me endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["access_token"]
    
    def test_me_returns_user_info(self, ceo_token):
        """Test 6: GET /api/auth/me returns status, onboarding_completed, onboarding_step, plan_id"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "onboarding_completed" in data
        assert "onboarding_step" in data
        assert "plan_id" in data
        assert "email" in data
        assert "roles" in data
    
    def test_me_without_auth_returns_401(self):
        """Test /me without auth token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


class TestSignupFlow:
    """Test signup and payment flow"""
    
    @pytest.fixture
    def unique_email(self):
        return f"TEST_signup_{uuid.uuid4().hex[:8]}@test.com"
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["access_token"]
    
    def test_signup_creates_pending_payment_user(self, unique_email):
        """Test 2: POST /api/auth/signup creates user with status=pending_payment, returns checkout_url"""
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test User",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://order-management-77.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should return access token
        assert "access_token" in data
        
        # User should have pending_payment status
        assert "user" in data
        assert data["user"]["status"] == "pending_payment"
        
        # Should return checkout_url for Stripe
        assert "checkout_url" in data
        assert data["checkout_url"] is not None
        assert "stripe.com" in data["checkout_url"] or "checkout" in data["checkout_url"]
        
        # Next route should be payment pending
        assert "next" in data
        assert data["next"]["route"] == "/payment/pending"
        
        # Store token for cleanup
        return data["access_token"], data["user"]["id"]
    
    def test_signup_duplicate_email_fails(self, unique_email):
        """Test signup with same email fails"""
        # First signup
        requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test User",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://order-management-77.preview.emergentagent.com"
            }
        )
        
        # Second signup with same email should fail
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test User 2",
                "email": unique_email,
                "password": "testpass456",
                "plan_id": "growth",
                "origin_url": "https://order-management-77.preview.emergentagent.com"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
    
    def test_pending_payment_user_can_login(self, unique_email):
        """Test 4: POST /api/auth/login allows pending_payment users, returns correct next.route"""
        # Create user first
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test User",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://order-management-77.preview.emergentagent.com"
            }
        )
        assert signup_response.status_code == 200
        
        # Now login with the same credentials
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": unique_email, "password": "testpass123"}
        )
        assert login_response.status_code == 200
        
        data = login_response.json()
        assert data["user"]["status"] == "pending_payment"
        assert data["next"]["route"] == "/payment/pending"


class TestOnboardingStatus:
    """Test onboarding status endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["access_token"]
    
    def test_onboarding_status(self, ceo_token):
        """Test 9: GET /api/onboarding/status returns current onboarding state"""
        response = requests.get(
            f"{BASE_URL}/api/onboarding/status",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "onboarding_completed" in data
        assert "onboarding_step" in data
        assert "plan_id" in data
        assert "has_venue" in data
    
    def test_onboarding_status_without_auth(self):
        """Test onboarding status requires auth"""
        response = requests.get(f"{BASE_URL}/api/onboarding/status")
        assert response.status_code == 401


class TestOnboardingSteps:
    """Test onboarding step endpoints"""
    
    @pytest.fixture
    def test_user_token(self):
        """Create a test user and return their token"""
        unique_email = f"TEST_onboard_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Onboard Test",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://order-management-77.preview.emergentagent.com"
            }
        )
        data = response.json()
        return data["access_token"], data["user"]["id"]
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["access_token"]
    
    def test_account_setup_step(self, test_user_token):
        """Test 10: POST /api/onboarding/account-setup creates venue and returns venue_id"""
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
        
        data = response.json()
        assert "venue_id" in data
        assert "step" in data
        assert data["step"] == 2
    
    def test_password_reset_step(self, test_user_token):
        """Test 11: POST /api/onboarding/password-reset changes password"""
        token, user_id = test_user_token
        
        # First do account setup
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "user_name": "Test User",
                "venue_name": "Test Venue",
                "venue_type": "bar"
            }
        )
        
        # Now test password reset
        response = requests.post(
            f"{BASE_URL}/api/onboarding/password-reset",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_password": "newpassword123"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["step"] == 3
    
    def test_password_reset_short_password(self, test_user_token):
        """Test password reset with short password fails"""
        token, user_id = test_user_token
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/password-reset",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_password": "12345"}  # Too short
        )
        assert response.status_code == 400
    
    def test_modules_setup_step(self, test_user_token):
        """Test 12: POST /api/onboarding/modules-setup configures modules"""
        token, user_id = test_user_token
        
        # First do account setup
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "user_name": "Test User",
                "venue_name": "Test Venue",
                "venue_type": "bar"
            }
        )
        
        # Now test modules setup
        response = requests.post(
            f"{BASE_URL}/api/onboarding/modules-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={"modules": ["pulse", "tap", "kds"]}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "modules" in data
        assert "step" in data
        assert data["step"] == 4
    
    def test_complete_onboarding(self, test_user_token):
        """Test 13: POST /api/onboarding/complete marks onboarding as done"""
        token, user_id = test_user_token
        
        # Do account setup first
        requests.post(
            f"{BASE_URL}/api/onboarding/account-setup",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "user_name": "Test User",
                "venue_name": "Test Venue",
                "venue_type": "bar"
            }
        )
        
        # Complete onboarding
        response = requests.post(
            f"{BASE_URL}/api/onboarding/complete",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["completed"] == True
        assert data["step"] == 6


class TestCreateCheckout:
    """Test create checkout endpoint"""
    
    @pytest.fixture
    def test_user_token(self):
        """Create a test user and return their token"""
        unique_email = f"TEST_checkout_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Checkout Test",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://order-management-77.preview.emergentagent.com"
            }
        )
        data = response.json()
        return data["access_token"], data["user"]["id"]
    
    def test_create_checkout_requires_auth(self):
        """Test 8: POST /api/onboarding/create-checkout requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/create-checkout",
            json={"origin_url": "https://test.com"}
        )
        assert response.status_code == 401
    
    def test_create_checkout_with_auth(self, test_user_token):
        """Test 8: POST /api/onboarding/create-checkout creates Stripe checkout session"""
        token, user_id = test_user_token
        
        response = requests.post(
            f"{BASE_URL}/api/onboarding/create-checkout",
            headers={"Authorization": f"Bearer {token}"},
            json={"origin_url": "https://order-management-77.preview.emergentagent.com"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        # URL should be a Stripe checkout URL
        assert "stripe.com" in data["url"] or "checkout" in data["url"]


class TestDeleteUser:
    """Test user deletion (cleanup)"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["access_token"]
    
    def test_delete_test_user(self, ceo_token):
        """Delete a created test user"""
        # Create a test user
        unique_email = f"TEST_delete_{uuid.uuid4().hex[:8]}@test.com"
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Delete Test",
                "email": unique_email,
                "password": "testpass123",
                "plan_id": "starter",
                "origin_url": "https://order-management-77.preview.emergentagent.com"
            }
        )
        user_id = signup_response.json()["user"]["id"]
        
        # Delete the user
        response = requests.delete(
            f"{BASE_URL}/api/auth/users/{user_id}",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200
        assert response.json()["deleted"] == True
    
    def test_cannot_delete_system_account(self, ceo_token):
        """Test that system accounts cannot be deleted"""
        # Try to get CEO user ID
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        ceo_user_id = me_response.json()["id"]
        
        # Try to delete CEO account - should fail
        response = requests.delete(
            f"{BASE_URL}/api/auth/users/{ceo_user_id}",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 403


# Cleanup fixture to remove test users after all tests
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_users():
    """Cleanup any TEST_ prefixed users after tests complete"""
    yield
    # This runs after all tests
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        if response.status_code == 200:
            token = response.json()["access_token"]
            # Note: In production, you'd want a proper cleanup endpoint
            # For now, test users remain but are prefixed with TEST_
    except:
        pass
