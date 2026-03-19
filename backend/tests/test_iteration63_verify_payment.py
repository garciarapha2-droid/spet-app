"""
Iteration 63: Verify Payment Endpoint Tests
Tests for POST /api/auth/verify-payment - the official post-payment activation endpoint.
The endpoint accepts { session_id: 'cs_xxx' }, verifies with Stripe, and activates the user.

Test scenarios:
- POST /api/auth/verify-payment with missing session_id returns 400
- POST /api/auth/verify-payment with no auth token returns 401
- POST /api/auth/verify-payment with invalid Stripe session_id returns 400 for pending_payment user
- POST /api/auth/verify-payment for already-active user returns idempotent success (already_active=true)
- POST /api/auth/verify-payment for already-active user with any session_id returns success
- After failed verify-payment, GET /api/auth/me still shows pending_payment
- POST /api/auth/signup creates user with status=pending_payment
- GET /api/auth/permissions flags.requires_payment=true for pending_payment user
- POST /api/auth/login still returns access_token and refresh_token
- POST /api/auth/refresh-token still works correctly
- GET /api/onboarding/plans returns 4 plans with correct pricing
- GET /api/health returns healthy
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials (from problem statement)
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
DEMO_ACTIVE_EMAIL = "teste@teste.com"  # Already active user
DEMO_ACTIVE_PASSWORD = "12345"
DEMO_ONBOARDING_EMAIL = "teste1@teste.com"
DEMO_ONBOARDING_PASSWORD = "12345"


class TestHealthCheck:
    """Test GET /api/health returns healthy"""
    
    def test_health_returns_healthy(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        json_data = response.json()
        # Check for either wrapped or unwrapped format
        if "success" in json_data:
            assert json_data["success"] == True
            assert json_data["data"]["status"] == "healthy"
        else:
            assert json_data["status"] == "healthy"
        print("PASS: Health check returns healthy")


class TestOnboardingPlans:
    """Test GET /api/onboarding/plans returns 4 plans with correct pricing"""
    
    def test_plans_returns_four_plans_with_correct_pricing(self):
        """GET /api/onboarding/plans returns Core=$79, Flow=$149, Sync=$299, OS=$499"""
        response = requests.get(f"{BASE_URL}/api/onboarding/plans")
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        plans = json_data["data"]["plans"]
        assert len(plans) == 4, f"Expected 4 plans, got {len(plans)}"
        
        # Build dict for easy lookup
        plans_dict = {p["id"]: p for p in plans}
        
        # Verify all 4 plans exist
        assert "core" in plans_dict, "Missing 'core' plan"
        assert "flow" in plans_dict, "Missing 'flow' plan"
        assert "sync" in plans_dict, "Missing 'sync' plan"
        assert "os" in plans_dict, "Missing 'os' plan"
        
        # Verify correct pricing (official prices)
        assert plans_dict["core"]["price"] == 79.0, f"Core price expected 79, got {plans_dict['core']['price']}"
        assert plans_dict["flow"]["price"] == 149.0, f"Flow price expected 149, got {plans_dict['flow']['price']}"
        assert plans_dict["sync"]["price"] == 299.0, f"Sync price expected 299, got {plans_dict['sync']['price']}"
        assert plans_dict["os"]["price"] == 499.0, f"OS price expected 499, got {plans_dict['os']['price']}"
        
        print("PASS: 4 plans returned with correct pricing")


class TestLoginReturnsTokens:
    """Test POST /api/auth/login still returns access_token and refresh_token"""
    
    def test_login_returns_access_and_refresh_tokens(self):
        """Login returns both access_token and refresh_token in response"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        
        # Verify access_token exists
        assert "access_token" in data, "Missing access_token"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 50
        
        # Verify refresh_token exists
        assert "refresh_token" in data, "Missing refresh_token"
        assert isinstance(data["refresh_token"], str)
        assert len(data["refresh_token"]) > 50
        
        # Verify token_type
        assert data["token_type"] == "bearer"
        
        print("PASS: Login returns both access_token and refresh_token")


class TestRefreshTokenStillWorks:
    """Test POST /api/auth/refresh-token still works correctly"""
    
    def test_refresh_token_returns_new_pair(self):
        """POST /api/auth/refresh-token returns new access_token + new refresh_token"""
        # Login first
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_ACTIVE_EMAIL, "password": DEMO_ACTIVE_PASSWORD}
        )
        tokens = login_response.json()["data"]
        old_refresh_token = tokens["refresh_token"]
        
        # Small delay
        time.sleep(1)
        
        # Refresh
        response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": old_refresh_token}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "access_token" in data
        assert "refresh_token" in data
        
        # Verify new refresh token is different (rotation)
        assert data["refresh_token"] != old_refresh_token, "Refresh token should be rotated"
        
        print("PASS: Refresh token endpoint still works correctly")


class TestVerifyPaymentNoAuth:
    """Test POST /api/auth/verify-payment with no auth token returns 401"""
    
    def test_verify_payment_without_auth_returns_401(self):
        """POST /api/auth/verify-payment without auth token returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-payment",
            json={"session_id": "cs_test_123"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        
        json_data = response.json()
        assert json_data["success"] == False
        assert "UNAUTHORIZED" in json_data["error"]["code"] or "authenticated" in json_data["error"]["message"].lower()
        
        print("PASS: verify-payment without auth returns 401")


class TestVerifyPaymentMissingSessionId:
    """Test POST /api/auth/verify-payment with missing session_id returns 400"""
    
    @pytest.fixture
    def auth_token(self):
        """Login and return access token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["data"]["access_token"]
    
    def test_verify_payment_missing_session_id_returns_400(self, auth_token):
        """POST /api/auth/verify-payment with missing session_id returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-payment",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        json_data = response.json()
        assert json_data["success"] == False
        assert "session_id" in json_data["error"]["message"].lower() or "required" in json_data["error"]["message"].lower()
        
        print("PASS: verify-payment with missing session_id returns 400")
    
    def test_verify_payment_empty_session_id_returns_400(self, auth_token):
        """POST /api/auth/verify-payment with empty session_id returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-payment",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"session_id": ""}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        json_data = response.json()
        assert json_data["success"] == False
        
        print("PASS: verify-payment with empty session_id returns 400")
    
    def test_verify_payment_whitespace_session_id_returns_400(self, auth_token):
        """POST /api/auth/verify-payment with whitespace session_id returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-payment",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"session_id": "   "}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        json_data = response.json()
        assert json_data["success"] == False
        
        print("PASS: verify-payment with whitespace session_id returns 400")


class TestVerifyPaymentActiveUserIdempotent:
    """Test POST /api/auth/verify-payment for already-active user returns idempotent success"""
    
    @pytest.fixture
    def active_user_token(self):
        """Login as already-active user and return access token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_ACTIVE_EMAIL, "password": DEMO_ACTIVE_PASSWORD}
        )
        return response.json()["data"]["access_token"]
    
    def test_active_user_verify_payment_returns_already_active_true(self, active_user_token):
        """Active user verify-payment returns {activated: true, already_active: true} without hitting Stripe"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-payment",
            headers={"Authorization": f"Bearer {active_user_token}"},
            json={"session_id": "cs_fake_does_not_matter_for_active_user"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert data["activated"] == True, "Expected activated=true"
        assert data["already_active"] == True, "Expected already_active=true"
        assert data["status"] == "active", f"Expected status=active, got {data['status']}"
        
        print("PASS: Active user verify-payment returns idempotent success with already_active=true")
    
    def test_active_user_any_session_id_returns_success(self, active_user_token):
        """Active user can pass any session_id and still get success"""
        # Try with various session IDs
        for session_id in ["cs_123", "random_string", "invalid_session_abc"]:
            response = requests.post(
                f"{BASE_URL}/api/auth/verify-payment",
                headers={"Authorization": f"Bearer {active_user_token}"},
                json={"session_id": session_id}
            )
            assert response.status_code == 200, f"Expected 200 for session_id={session_id}, got {response.status_code}"
            
            data = response.json()["data"]
            assert data["activated"] == True
            assert data["already_active"] == True
        
        print("PASS: Active user returns success with any session_id")


class TestSignupCreatesPendingPaymentUser:
    """Test POST /api/auth/signup creates user with status=pending_payment"""
    
    def test_signup_creates_pending_payment_user(self):
        """Signup creates user with status=pending_payment"""
        # Generate unique email
        unique_email = f"TEST_signup_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test Signup User",
                "email": unique_email,
                "password": "TestPassword123!",
                "plan_id": "core",
                "origin_url": "https://test.example.com"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        
        # Verify user has pending_payment status
        assert data["user"]["status"] == "pending_payment", f"Expected status=pending_payment, got {data['user']['status']}"
        
        # Verify tokens are returned
        assert "access_token" in data, "Missing access_token"
        assert "refresh_token" in data, "Missing refresh_token"
        
        # Verify next route is /payment
        assert data["next"]["route"] == "/payment", f"Expected next.route=/payment, got {data['next']['route']}"
        
        # Cleanup: Delete test user
        try:
            user_id = data["user"]["id"]
            delete_response = requests.delete(
                f"{BASE_URL}/api/auth/users/{user_id}",
                headers={"Authorization": f"Bearer {data['access_token']}"}
            )
            print(f"Cleanup: Deleted test user {unique_email}")
        except Exception as e:
            print(f"Warning: Could not delete test user: {e}")
        
        print("PASS: Signup creates user with status=pending_payment")


class TestPermissionsRequiresPaymentFlag:
    """Test GET /api/auth/permissions flags.requires_payment=true for pending_payment user"""
    
    def test_pending_payment_user_has_requires_payment_flag(self):
        """Pending payment user has flags.requires_payment=true"""
        # Create a new user with pending_payment status
        unique_email = f"TEST_perms_{uuid.uuid4().hex[:8]}@example.com"
        
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test Permissions User",
                "email": unique_email,
                "password": "TestPassword123!",
                "plan_id": "flow",
                "origin_url": "https://test.example.com"
            }
        )
        assert signup_response.status_code == 200
        
        tokens = signup_response.json()["data"]
        access_token = tokens["access_token"]
        user_id = tokens["user"]["id"]
        
        # Get permissions
        perm_response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert perm_response.status_code == 200
        
        perm_data = perm_response.json()["data"]
        
        # Verify status is pending_payment
        assert perm_data["status"] == "pending_payment", f"Expected status=pending_payment, got {perm_data['status']}"
        
        # Verify flags.requires_payment=true
        assert perm_data["flags"]["requires_payment"] == True, f"Expected requires_payment=true, got {perm_data['flags']['requires_payment']}"
        
        # Verify flags.is_active=false (since not a demo user and pending_payment)
        assert perm_data["flags"]["is_active"] == False, f"Expected is_active=false, got {perm_data['flags']['is_active']}"
        
        # Cleanup
        try:
            delete_response = requests.delete(
                f"{BASE_URL}/api/auth/users/{user_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            print(f"Cleanup: Deleted test user {unique_email}")
        except Exception:
            pass
        
        print("PASS: Pending payment user has flags.requires_payment=true")


class TestVerifyPaymentInvalidSessionForPendingUser:
    """Test POST /api/auth/verify-payment with invalid session_id returns 400 for pending_payment user"""
    
    def test_invalid_stripe_session_returns_400(self):
        """Invalid Stripe session_id returns 400 for pending_payment user"""
        # Create a new user with pending_payment status
        unique_email = f"TEST_verify_{uuid.uuid4().hex[:8]}@example.com"
        
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test Verify User",
                "email": unique_email,
                "password": "TestPassword123!",
                "plan_id": "core",
                "origin_url": "https://test.example.com"
            }
        )
        assert signup_response.status_code == 200
        
        tokens = signup_response.json()["data"]
        access_token = tokens["access_token"]
        user_id = tokens["user"]["id"]
        
        # Try to verify with invalid session_id
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-payment",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"session_id": "cs_invalid_fake_session_12345"}
        )
        
        # Should return 400 because Stripe verification fails
        assert verify_response.status_code == 400, f"Expected 400, got {verify_response.status_code}: {verify_response.text}"
        
        json_data = verify_response.json()
        assert json_data["success"] == False
        assert "stripe" in json_data["error"]["message"].lower() or "verify" in json_data["error"]["message"].lower() or "invalid" in json_data["error"]["message"].lower()
        
        # Cleanup
        try:
            delete_response = requests.delete(
                f"{BASE_URL}/api/auth/users/{user_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            print(f"Cleanup: Deleted test user {unique_email}")
        except Exception:
            pass
        
        print("PASS: Invalid Stripe session_id returns 400 for pending_payment user")


class TestAfterFailedVerifyPaymentStatusUnchanged:
    """Test after failed verify-payment, GET /api/auth/me still shows pending_payment"""
    
    def test_failed_verify_payment_does_not_change_status(self):
        """After failed verify-payment, user status remains pending_payment"""
        # Create a new user with pending_payment status
        unique_email = f"TEST_status_{uuid.uuid4().hex[:8]}@example.com"
        
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "Test Status User",
                "email": unique_email,
                "password": "TestPassword123!",
                "plan_id": "core",
                "origin_url": "https://test.example.com"
            }
        )
        assert signup_response.status_code == 200
        
        tokens = signup_response.json()["data"]
        access_token = tokens["access_token"]
        user_id = tokens["user"]["id"]
        
        # Verify initial status is pending_payment via /me
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert me_response.status_code == 200
        assert me_response.json()["data"]["status"] == "pending_payment"
        
        # Try to verify payment with invalid session (should fail)
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/verify-payment",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"session_id": "cs_invalid_session_xyz"}
        )
        assert verify_response.status_code == 400, "Expected 400 for invalid session"
        
        # Verify status is STILL pending_payment after failed verify-payment
        me_response_after = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert me_response_after.status_code == 200
        assert me_response_after.json()["data"]["status"] == "pending_payment", \
            f"Expected status still pending_payment, got {me_response_after.json()['data']['status']}"
        
        # Cleanup
        try:
            delete_response = requests.delete(
                f"{BASE_URL}/api/auth/users/{user_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            print(f"Cleanup: Deleted test user {unique_email}")
        except Exception:
            pass
        
        print("PASS: After failed verify-payment, status remains pending_payment")


class TestDemoUserBypassPaywall:
    """Verify demo users still bypass paywall (regression test)"""
    
    def test_demo_user_is_active_despite_status(self):
        """Demo user (teste@teste.com) has is_active=true via permissions endpoint"""
        # Login as demo user
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_ACTIVE_EMAIL, "password": DEMO_ACTIVE_PASSWORD}
        )
        assert login_response.status_code == 200
        
        access_token = login_response.json()["data"]["access_token"]
        
        # Get permissions
        perm_response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert perm_response.status_code == 200
        
        data = perm_response.json()["data"]
        
        # Demo user should have is_demo=true and is_active=true
        assert data["is_demo"] == True, "Demo user should have is_demo=true"
        assert data["flags"]["is_active"] == True, "Demo user should have is_active=true"
        
        print("PASS: Demo user bypasses paywall with is_active=true")


# Run tests when script is executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
