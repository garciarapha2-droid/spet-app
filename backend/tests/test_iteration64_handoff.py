"""
Iteration 64: Handoff System Tests
Tests for POST /api/auth/handoff/create and POST /api/auth/handoff/exchange

Features to test:
- POST /api/auth/handoff/create returns code with expires_in=60
- POST /api/auth/handoff/create requires auth (401 without token)
- POST /api/auth/handoff/exchange returns access_token AND refresh_token
- POST /api/auth/handoff/exchange returns user object with email, role, status, onboarding_completed
- Handoff code is single-use: second exchange with same code returns 401
- Invalid/fake code returns 401
- Missing code in body returns 400
- access_token from handoff exchange works with GET /api/auth/me
- access_token from handoff exchange works with GET /api/auth/permissions
- refresh_token from handoff exchange works with POST /api/auth/refresh-token
- Regression: POST /api/auth/verify-payment still works
- Regression: POST /api/auth/login still returns access_token and refresh_token
- GET /api/health returns healthy
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
DEMO_EMAIL = "teste@teste.com"
DEMO_PASSWORD = "12345"
DEMO_ONBOARDING_EMAIL = "teste1@teste.com"
DEMO_ONBOARDING_PASSWORD = "12345"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def login(api_client, email, password):
    """Helper to login and return tokens"""
    response = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    if "data" in data:
        return data["data"]
    return data


class TestHealthEndpoint:
    """Health check - run first"""
    
    def test_health_returns_healthy(self, api_client):
        """GET /api/health returns healthy"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        # Check for wrapped response
        if "data" in data:
            assert data["data"].get("status") == "healthy" or "healthy" in str(data["data"])
        else:
            assert data.get("status") == "healthy" or "healthy" in str(data)
        print("✓ Health endpoint working")


class TestLoginRegression:
    """Regression: Login still returns access_token and refresh_token"""
    
    def test_login_returns_both_tokens(self, api_client):
        """POST /api/auth/login returns access_token AND refresh_token"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "access_token" in data, "access_token missing from login response"
        assert "refresh_token" in data, "refresh_token missing from login response"
        assert len(data["access_token"]) > 0
        assert len(data["refresh_token"]) > 0
        print(f"✓ Login returns both tokens - access_token={data['access_token'][:20]}... refresh_token={data['refresh_token'][:20]}...")


class TestHandoffCreateAuth:
    """Test POST /api/auth/handoff/create requires authentication"""
    
    def test_handoff_create_requires_auth(self, api_client):
        """POST /api/auth/handoff/create returns 401 without token"""
        response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Handoff create requires authentication (401 without token)")
    
    def test_handoff_create_invalid_token(self, api_client):
        """POST /api/auth/handoff/create returns 401 with invalid token"""
        api_client.headers.update({"Authorization": "Bearer invalid_fake_token_12345"})
        response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        del api_client.headers["Authorization"]
        print("✓ Handoff create rejects invalid token (401)")


class TestHandoffCreateWithAuth:
    """Test POST /api/auth/handoff/create with valid authentication"""
    
    def test_handoff_create_returns_code_and_expires(self, api_client):
        """POST /api/auth/handoff/create returns code with expires_in=60"""
        # Login first
        login_data = login(api_client, DEMO_EMAIL, DEMO_PASSWORD)
        access_token = login_data["access_token"]
        
        # Create handoff
        api_client.headers.update({"Authorization": f"Bearer {access_token}"})
        response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert response.status_code == 200, f"Handoff create failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "code" in data, "code missing from handoff create response"
        assert "expires_in" in data, "expires_in missing from handoff create response"
        assert data["expires_in"] == 60, f"Expected expires_in=60, got {data['expires_in']}"
        assert len(data["code"]) > 20, "Code too short - expected secure token"
        
        del api_client.headers["Authorization"]
        print(f"✓ Handoff create returns code={data['code'][:20]}... expires_in={data['expires_in']}")
    
    def test_handoff_create_with_ceo_account(self, api_client):
        """POST /api/auth/handoff/create works with CEO account"""
        login_data = login(api_client, CEO_EMAIL, CEO_PASSWORD)
        access_token = login_data["access_token"]
        
        api_client.headers.update({"Authorization": f"Bearer {access_token}"})
        response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert response.status_code == 200, f"Handoff create failed for CEO: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "code" in data
        assert data["expires_in"] == 60
        del api_client.headers["Authorization"]
        print(f"✓ Handoff create works for CEO account")


class TestHandoffExchangeErrors:
    """Test POST /api/auth/handoff/exchange error cases"""
    
    def test_handoff_exchange_missing_code_returns_400(self, api_client):
        """POST /api/auth/handoff/exchange returns 400 when code is missing"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Handoff exchange returns 400 for missing code")
    
    def test_handoff_exchange_invalid_code_returns_401(self, api_client):
        """POST /api/auth/handoff/exchange returns 401 for invalid/fake code"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": "invalid_fake_code_that_does_not_exist_123456789"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        print(f"✓ Handoff exchange returns 401 for invalid code: {data}")


class TestHandoffExchangeSuccess:
    """Test POST /api/auth/handoff/exchange successful flow"""
    
    def test_handoff_exchange_returns_tokens_and_user(self, api_client):
        """POST /api/auth/handoff/exchange returns access_token, refresh_token, and user object"""
        # Step 1: Login to create handoff
        login_data = login(api_client, DEMO_EMAIL, DEMO_PASSWORD)
        access_token = login_data["access_token"]
        
        # Step 2: Create handoff code
        api_client.headers.update({"Authorization": f"Bearer {access_token}"})
        create_response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert create_response.status_code == 200
        
        create_data = create_response.json()
        if "data" in create_data:
            create_data = create_data["data"]
        handoff_code = create_data["code"]
        
        # Remove auth header for exchange (simulates different app)
        del api_client.headers["Authorization"]
        
        # Step 3: Exchange code for tokens
        exchange_response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        assert exchange_response.status_code == 200, f"Exchange failed: {exchange_response.text}"
        
        exchange_data = exchange_response.json()
        if "data" in exchange_data:
            exchange_data = exchange_data["data"]
        
        # Verify tokens are returned
        assert "access_token" in exchange_data, "access_token missing from exchange response"
        assert "refresh_token" in exchange_data, "refresh_token missing from exchange response"
        assert len(exchange_data["access_token"]) > 0
        assert len(exchange_data["refresh_token"]) > 0
        
        # Verify user object
        assert "user" in exchange_data, "user object missing from exchange response"
        user = exchange_data["user"]
        assert "email" in user, "email missing from user object"
        assert "role" in user, "role missing from user object"
        assert "status" in user, "status missing from user object"
        assert "onboarding_completed" in user, "onboarding_completed missing from user object"
        
        # Verify user data matches
        assert user["email"] == DEMO_EMAIL
        
        print(f"✓ Handoff exchange returns access_token={exchange_data['access_token'][:20]}...")
        print(f"  refresh_token={exchange_data['refresh_token'][:20]}...")
        print(f"  user={user}")


class TestHandoffSingleUse:
    """Test that handoff codes are single-use"""
    
    def test_second_exchange_returns_401(self, api_client):
        """Handoff code is single-use: second exchange with same code returns 401"""
        # Login and create handoff
        login_data = login(api_client, DEMO_EMAIL, DEMO_PASSWORD)
        access_token = login_data["access_token"]
        
        api_client.headers.update({"Authorization": f"Bearer {access_token}"})
        create_response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert create_response.status_code == 200
        
        create_data = create_response.json()
        if "data" in create_data:
            create_data = create_data["data"]
        handoff_code = create_data["code"]
        
        del api_client.headers["Authorization"]
        
        # First exchange - should succeed
        first_exchange = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        assert first_exchange.status_code == 200, f"First exchange failed: {first_exchange.text}"
        print("✓ First exchange succeeded")
        
        # Second exchange with same code - should fail with 401
        second_exchange = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        assert second_exchange.status_code == 401, f"Expected 401 on second exchange, got {second_exchange.status_code}"
        
        data = second_exchange.json()
        print(f"✓ Second exchange returns 401 (single-use confirmed): {data}")


class TestHandoffTokensWork:
    """Test that tokens from handoff exchange work with protected endpoints"""
    
    def test_access_token_works_with_me_endpoint(self, api_client):
        """access_token from handoff exchange works with GET /api/auth/me"""
        # Create handoff and exchange
        login_data = login(api_client, DEMO_EMAIL, DEMO_PASSWORD)
        api_client.headers.update({"Authorization": f"Bearer {login_data['access_token']}"})
        
        create_response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        create_data = create_response.json()
        if "data" in create_data:
            create_data = create_data["data"]
        handoff_code = create_data["code"]
        
        del api_client.headers["Authorization"]
        
        exchange_response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        exchange_data = exchange_response.json()
        if "data" in exchange_data:
            exchange_data = exchange_data["data"]
        
        # Use the access_token from exchange to call /me
        handoff_access_token = exchange_data["access_token"]
        api_client.headers.update({"Authorization": f"Bearer {handoff_access_token}"})
        
        me_response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200, f"GET /api/auth/me failed: {me_response.text}"
        
        me_data = me_response.json()
        if "data" in me_data:
            me_data = me_data["data"]
        
        assert me_data["email"] == DEMO_EMAIL
        del api_client.headers["Authorization"]
        print(f"✓ Handoff access_token works with GET /api/auth/me: {me_data['email']}")
    
    def test_access_token_works_with_permissions_endpoint(self, api_client):
        """access_token from handoff exchange works with GET /api/auth/permissions"""
        # Create handoff and exchange
        login_data = login(api_client, DEMO_EMAIL, DEMO_PASSWORD)
        api_client.headers.update({"Authorization": f"Bearer {login_data['access_token']}"})
        
        create_response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        create_data = create_response.json()
        if "data" in create_data:
            create_data = create_data["data"]
        handoff_code = create_data["code"]
        
        del api_client.headers["Authorization"]
        
        exchange_response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        exchange_data = exchange_response.json()
        if "data" in exchange_data:
            exchange_data = exchange_data["data"]
        
        # Use the access_token from exchange to call /permissions
        handoff_access_token = exchange_data["access_token"]
        api_client.headers.update({"Authorization": f"Bearer {handoff_access_token}"})
        
        perm_response = api_client.get(f"{BASE_URL}/api/auth/permissions")
        assert perm_response.status_code == 200, f"GET /api/auth/permissions failed: {perm_response.text}"
        
        perm_data = perm_response.json()
        if "data" in perm_data:
            perm_data = perm_data["data"]
        
        assert perm_data["email"] == DEMO_EMAIL
        assert "status" in perm_data
        assert "flags" in perm_data
        del api_client.headers["Authorization"]
        print(f"✓ Handoff access_token works with GET /api/auth/permissions")
    
    def test_refresh_token_works_from_handoff(self, api_client):
        """refresh_token from handoff exchange works with POST /api/auth/refresh-token"""
        # Create handoff and exchange
        login_data = login(api_client, DEMO_EMAIL, DEMO_PASSWORD)
        api_client.headers.update({"Authorization": f"Bearer {login_data['access_token']}"})
        
        create_response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        create_data = create_response.json()
        if "data" in create_data:
            create_data = create_data["data"]
        handoff_code = create_data["code"]
        
        del api_client.headers["Authorization"]
        
        exchange_response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        exchange_data = exchange_response.json()
        if "data" in exchange_data:
            exchange_data = exchange_data["data"]
        
        # Use the refresh_token from exchange
        handoff_refresh_token = exchange_data["refresh_token"]
        
        refresh_response = api_client.post(
            f"{BASE_URL}/api/auth/refresh-token",
            json={"refresh_token": handoff_refresh_token}
        )
        assert refresh_response.status_code == 200, f"Refresh-token failed: {refresh_response.text}"
        
        refresh_data = refresh_response.json()
        if "data" in refresh_data:
            refresh_data = refresh_data["data"]
        
        assert "access_token" in refresh_data
        assert "refresh_token" in refresh_data
        # New tokens should be different from old ones (rotation)
        assert refresh_data["refresh_token"] != handoff_refresh_token, "Refresh token should be rotated"
        
        print(f"✓ Handoff refresh_token works with POST /api/auth/refresh-token (rotation confirmed)")


class TestHandoffWithCEOAccount:
    """Test complete handoff flow with CEO account"""
    
    def test_ceo_handoff_full_flow(self, api_client):
        """Full handoff flow with CEO account works"""
        # Login as CEO
        login_data = login(api_client, CEO_EMAIL, CEO_PASSWORD)
        api_client.headers.update({"Authorization": f"Bearer {login_data['access_token']}"})
        
        # Create handoff
        create_response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert create_response.status_code == 200
        create_data = create_response.json()
        if "data" in create_data:
            create_data = create_data["data"]
        
        assert create_data["expires_in"] == 60
        handoff_code = create_data["code"]
        
        del api_client.headers["Authorization"]
        
        # Exchange
        exchange_response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        assert exchange_response.status_code == 200
        
        exchange_data = exchange_response.json()
        if "data" in exchange_data:
            exchange_data = exchange_data["data"]
        
        assert exchange_data["user"]["email"] == CEO_EMAIL
        assert "access_token" in exchange_data
        assert "refresh_token" in exchange_data
        
        # Use token
        api_client.headers.update({"Authorization": f"Bearer {exchange_data['access_token']}"})
        me_response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        me_data = me_response.json()
        if "data" in me_data:
            me_data = me_data["data"]
        assert me_data["email"] == CEO_EMAIL
        
        del api_client.headers["Authorization"]
        print(f"✓ CEO handoff full flow works - email={me_data['email']}")


class TestHandoffWithOnboardingUser:
    """Test handoff with user who needs onboarding"""
    
    def test_onboarding_user_handoff(self, api_client):
        """Handoff for user with onboarding_completed=False includes correct flag"""
        login_data = login(api_client, DEMO_ONBOARDING_EMAIL, DEMO_ONBOARDING_PASSWORD)
        api_client.headers.update({"Authorization": f"Bearer {login_data['access_token']}"})
        
        create_response = api_client.post(f"{BASE_URL}/api/auth/handoff/create")
        assert create_response.status_code == 200
        create_data = create_response.json()
        if "data" in create_data:
            create_data = create_data["data"]
        
        handoff_code = create_data["code"]
        del api_client.headers["Authorization"]
        
        exchange_response = api_client.post(
            f"{BASE_URL}/api/auth/handoff/exchange",
            json={"code": handoff_code}
        )
        assert exchange_response.status_code == 200
        
        exchange_data = exchange_response.json()
        if "data" in exchange_data:
            exchange_data = exchange_data["data"]
        
        user = exchange_data["user"]
        assert user["email"] == DEMO_ONBOARDING_EMAIL
        # This user may have onboarding_completed=False
        assert "onboarding_completed" in user
        
        print(f"✓ Onboarding user handoff: email={user['email']}, onboarding_completed={user.get('onboarding_completed')}")


class TestVerifyPaymentRegression:
    """Regression: POST /api/auth/verify-payment still works"""
    
    def test_verify_payment_requires_auth(self, api_client):
        """POST /api/auth/verify-payment returns 401 without auth"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/verify-payment",
            json={"session_id": "test"}
        )
        assert response.status_code == 401
        print("✓ verify-payment requires auth (regression passed)")
    
    def test_verify_payment_requires_session_id(self, api_client):
        """POST /api/auth/verify-payment returns 400 for missing session_id"""
        login_data = login(api_client, DEMO_EMAIL, DEMO_PASSWORD)
        api_client.headers.update({"Authorization": f"Bearer {login_data['access_token']}"})
        
        response = api_client.post(
            f"{BASE_URL}/api/auth/verify-payment",
            json={}
        )
        assert response.status_code == 400
        del api_client.headers["Authorization"]
        print("✓ verify-payment requires session_id (regression passed)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
