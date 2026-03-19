"""
Iteration 62: Refresh Token System Tests
Tests for the new refresh token flow:
- POST /api/auth/login returns access_token + refresh_token
- POST /api/auth/refresh-token exchanges refresh_token for new pair
- Refresh token rotation: old refresh_token revoked after use
- Invalid/missing refresh_token returns 401/400
- POST /api/auth/logout with refresh_token in body revokes it
- After logout, revoked refresh_token cannot be used
- GET /api/auth/permissions works with new access_token from refresh
- GET /api/auth/me works with new access_token from refresh
- GET /api/onboarding/plans returns 4 plans (Core/Flow/Sync/OS) with correct pricing
- GET /api/health returns healthy
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials (from problem statement)
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
DEMO_EMAIL = "teste@teste.com"
DEMO_PASSWORD = "12345"
DEMO_ONBOARDING_EMAIL = "teste1@teste.com"
DEMO_ONBOARDING_PASSWORD = "12345"


class TestHealthCheck:
    """Test GET /api/health returns healthy"""
    
    def test_health_returns_healthy(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        json_data = response.json()
        # Health endpoint is not wrapped in middleware (returns raw response)
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
        
        # Verify correct names
        assert plans_dict["core"]["name"] == "Spet Core"
        assert plans_dict["flow"]["name"] == "Spet Flow"
        assert plans_dict["sync"]["name"] == "Spet Sync"
        assert plans_dict["os"]["name"] == "Spet OS"
        
        # Verify correct pricing (official prices)
        assert plans_dict["core"]["price"] == 79.0, f"Core price expected 79, got {plans_dict['core']['price']}"
        assert plans_dict["flow"]["price"] == 149.0, f"Flow price expected 149, got {plans_dict['flow']['price']}"
        assert plans_dict["sync"]["price"] == 299.0, f"Sync price expected 299, got {plans_dict['sync']['price']}"
        assert plans_dict["os"]["price"] == 499.0, f"OS price expected 499, got {plans_dict['os']['price']}"
        
        print("PASS: 4 plans returned with correct pricing (Core=$79, Flow=$149, Sync=$299, OS=$499)")


class TestLoginReturnsRefreshToken:
    """Test POST /api/auth/login returns both access_token and refresh_token"""
    
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
        assert len(data["access_token"]) > 50  # JWT tokens are long
        
        # Verify refresh_token exists
        assert "refresh_token" in data, "Missing refresh_token"
        assert isinstance(data["refresh_token"], str)
        assert len(data["refresh_token"]) > 50  # Secure tokens are long
        
        # Verify token_type
        assert data["token_type"] == "bearer"
        
        print("PASS: Login returns both access_token and refresh_token")
    
    def test_login_demo_user_returns_refresh_token(self):
        """Demo user login also returns refresh_token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
        )
        assert response.status_code == 200
        
        data = response.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data
        
        print("PASS: Demo user login returns refresh_token")


class TestRefreshTokenEndpoint:
    """Test POST /api/auth/refresh-token exchanges refresh_token for new pair"""
    
    @pytest.fixture
    def login_tokens(self):
        """Login and return tokens"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        return response.json()["data"]
    
    def test_refresh_token_returns_new_pair(self, login_tokens):
        """POST /api/auth/refresh-token returns new access_token + new refresh_token"""
        old_refresh_token = login_tokens["refresh_token"]
        old_access_token = login_tokens["access_token"]
        
        # Small delay to ensure different token timestamp
        time.sleep(1.1)
        
        response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": old_refresh_token}
        )
        assert response.status_code == 200
        
        json_data = response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        
        # Verify new tokens returned
        assert "access_token" in data, "Missing access_token in refresh response"
        assert "refresh_token" in data, "Missing refresh_token in refresh response"
        
        # Verify tokens are different from original
        new_access_token = data["access_token"]
        new_refresh_token = data["refresh_token"]
        
        # New refresh token should be different (rotation)
        assert new_refresh_token != old_refresh_token, "Refresh token should be rotated"
        
        # New access token should be different (freshly generated with new expiration)
        # Note: JWT tokens with same payload and same exp timestamp will be identical
        # With 1 second delay, the exp should be different
        assert new_access_token != old_access_token, "Access token should be new (different expiration)"
        
        # Verify user object also returned
        assert "user" in data
        assert data["user"]["email"] == CEO_EMAIL
        
        print("PASS: Refresh token endpoint returns new token pair")
    
    def test_refresh_token_missing_returns_400(self):
        """POST /api/auth/refresh-token without refresh_token returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={}
        )
        assert response.status_code == 400
        
        json_data = response.json()
        assert json_data["success"] == False
        assert "refresh_token is required" in json_data["error"]["message"].lower() or "required" in json_data["error"]["message"].lower()
        
        print("PASS: Missing refresh_token returns 400")
    
    def test_refresh_token_invalid_returns_401(self):
        """POST /api/auth/refresh-token with invalid token returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": "invalid_token_abc123"}
        )
        assert response.status_code == 401
        
        json_data = response.json()
        assert json_data["success"] == False
        
        print("PASS: Invalid refresh_token returns 401")


class TestRefreshTokenRotation:
    """Test refresh token rotation: old refresh_token is revoked after use"""
    
    def test_old_refresh_token_cannot_be_reused(self):
        """After using refresh_token, the old one is revoked and cannot be reused"""
        # Step 1: Login to get tokens
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        first_refresh_token = login_response.json()["data"]["refresh_token"]
        
        # Step 2: Use refresh token to get new pair
        refresh_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": first_refresh_token}
        )
        assert refresh_response.status_code == 200, "First refresh should succeed"
        
        # Step 3: Try to reuse the same refresh token (should fail - rotation)
        reuse_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": first_refresh_token}
        )
        assert reuse_response.status_code == 401, "Reusing old refresh token should fail"
        
        json_data = reuse_response.json()
        assert json_data["success"] == False
        assert "revoked" in json_data["error"]["message"].lower() or "invalid" in json_data["error"]["message"].lower()
        
        print("PASS: Refresh token rotation works - old token revoked after use")


class TestLogoutWithRefreshToken:
    """Test POST /api/auth/logout with refresh_token in body revokes it"""
    
    def test_logout_with_refresh_token_revokes_it(self):
        """POST /api/auth/logout with refresh_token in body revokes that refresh_token"""
        # Step 1: Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        tokens = login_response.json()["data"]
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]
        
        # Step 2: Logout with refresh_token in body
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"refresh_token": refresh_token}
        )
        assert logout_response.status_code == 200
        assert logout_response.json()["success"] == True
        
        # Step 3: Try to use the revoked refresh_token (should fail)
        refresh_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": refresh_token}
        )
        assert refresh_response.status_code == 401, "Revoked refresh token should fail"
        
        json_data = refresh_response.json()
        assert json_data["success"] == False
        
        print("PASS: Logout with refresh_token revokes it, cannot be reused")
    
    def test_logout_without_refresh_token_still_works(self):
        """POST /api/auth/logout without refresh_token still logs out successfully"""
        # Step 1: Login as demo user (to avoid token collisions with previous tests)
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
        )
        access_token = login_response.json()["data"]["access_token"]
        
        # Step 2: Logout without refresh_token in body
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert logout_response.status_code == 200
        assert logout_response.json()["success"] == True
        
        print("PASS: Logout without refresh_token still works")


class TestNewAccessTokenWorksWithProtectedEndpoints:
    """Test that new access_token from refresh works with protected endpoints"""
    
    def test_refreshed_access_token_works_with_permissions(self):
        """GET /api/auth/permissions works with new access_token from refresh"""
        # Step 1: Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        assert login_response.status_code == 200
        tokens = login_response.json()["data"]
        
        # Step 2: Refresh to get new access token
        refresh_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200
        new_access_token = refresh_response.json()["data"]["access_token"]
        
        # Small delay to ensure token is ready
        time.sleep(0.2)
        
        # Step 3: Use new access token for permissions endpoint
        perm_response = requests.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {new_access_token}"}
        )
        assert perm_response.status_code == 200, f"Expected 200, got {perm_response.status_code}: {perm_response.text}"
        
        json_data = perm_response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "user_id" in data
        assert "email" in data
        assert data["email"] == CEO_EMAIL
        assert "flags" in data
        
        print("PASS: Refreshed access_token works with /api/auth/permissions")
    
    def test_refreshed_access_token_works_with_me(self):
        """GET /api/auth/me works with new access_token from refresh"""
        # Step 1: Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        tokens = login_response.json()["data"]
        
        # Step 2: Refresh to get new access token
        refresh_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens["refresh_token"]}
        )
        new_access_token = refresh_response.json()["data"]["access_token"]
        
        # Step 3: Use new access token for /me endpoint
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {new_access_token}"}
        )
        assert me_response.status_code == 200
        
        json_data = me_response.json()
        assert json_data["success"] == True
        
        data = json_data["data"]
        assert "id" in data
        assert "email" in data
        assert data["email"] == CEO_EMAIL
        assert "roles" in data
        assert "venues" in data
        
        print("PASS: Refreshed access_token works with /api/auth/me")


class TestMultipleRefreshCycles:
    """Test that multiple refresh cycles work correctly"""
    
    def test_chain_of_refresh_tokens(self):
        """Can do multiple refresh cycles: login -> refresh -> refresh -> use"""
        # Step 1: Login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        tokens = login_response.json()["data"]
        
        # Step 2: First refresh
        refresh1_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh1_response.status_code == 200
        tokens2 = refresh1_response.json()["data"]
        
        # Step 3: Second refresh using new refresh token
        refresh2_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens2["refresh_token"]}
        )
        assert refresh2_response.status_code == 200
        tokens3 = refresh2_response.json()["data"]
        
        # Step 4: Verify final access token works
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {tokens3['access_token']}"}
        )
        assert me_response.status_code == 200
        assert me_response.json()["data"]["email"] == CEO_EMAIL
        
        # Step 5: Verify middle refresh tokens are revoked
        reuse_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens["refresh_token"]}  # Original token
        )
        assert reuse_response.status_code == 401, "Original refresh token should be revoked"
        
        reuse_response2 = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens2["refresh_token"]}  # First refresh token
        )
        assert reuse_response2.status_code == 401, "Middle refresh token should be revoked"
        
        print("PASS: Multiple refresh cycles work, old tokens properly revoked")


class TestRefreshTokenWithDemoUser:
    """Test refresh token flow with demo user"""
    
    def test_demo_user_refresh_token_flow(self):
        """Demo user can use refresh token flow"""
        # Step 1: Login as demo user
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
        )
        assert login_response.status_code == 200
        tokens = login_response.json()["data"]
        
        assert "refresh_token" in tokens
        
        # Step 2: Refresh
        refresh_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200
        
        new_tokens = refresh_response.json()["data"]
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        
        # Step 3: Verify new token works
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {new_tokens['access_token']}"}
        )
        assert me_response.status_code == 200
        assert me_response.json()["data"]["email"] == DEMO_EMAIL
        
        print("PASS: Demo user refresh token flow works")


class TestRefreshTokenOnboardingUser:
    """Test refresh token flow with onboarding demo user"""
    
    def test_onboarding_user_refresh_token_flow(self):
        """Onboarding demo user can use refresh token flow"""
        # Step 1: Login as onboarding demo user
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_ONBOARDING_EMAIL, "password": DEMO_ONBOARDING_PASSWORD}
        )
        assert login_response.status_code == 200
        tokens = login_response.json()["data"]
        
        assert "refresh_token" in tokens
        
        # Step 2: Refresh
        refresh_response = requests.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": tokens["refresh_token"]}
        )
        assert refresh_response.status_code == 200
        
        new_tokens = refresh_response.json()["data"]
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
        
        print("PASS: Onboarding user refresh token flow works")


# Run tests when script is executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
