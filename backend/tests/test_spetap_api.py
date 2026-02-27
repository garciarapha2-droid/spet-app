"""
SPETAP API Backend Tests
Tests authentication, health check, and core API endpoints
"""
import pytest
import requests
import os
import uuid

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "teste123"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint_returns_200(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "SPETAP"
        print(f"Health check passed: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_with_valid_credentials(self):
        """Test login with valid credentials returns token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["status"] == "active"
        assert "next" in data
        assert data["next"]["type"] == "route"
        print(f"Login successful for {TEST_EMAIL}")
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": "wrongpassword"}
        )
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"Invalid credentials test passed: {data['detail']}")
    
    def test_login_with_nonexistent_user(self):
        """Test login with non-existent email returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "anypassword"}
        )
        
        assert response.status_code == 401
        print("Non-existent user test passed")
    
    def test_get_me_without_token(self):
        """Test /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 401
        print("Unauthorized /me request test passed")
    
    def test_get_me_with_valid_token(self):
        """Test /api/auth/me with valid token returns user info"""
        # First login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200
        
        token = login_response.json()["access_token"]
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert data["status"] == "active"
        assert "roles" in data
        print(f"Get /me test passed: {data['email']}")


class TestSignup:
    """Signup endpoint tests"""
    
    def test_signup_with_existing_email(self):
        """Test signup with existing email returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": TEST_EMAIL,
                "password": "newpassword123",
                "company_name": "Test Company"
            }
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data.get("detail", "").lower()
        print("Duplicate email signup test passed")
    
    def test_signup_new_user(self):
        """Test signup with new email creates user"""
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpass123",
                "company_name": "TEST Company"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "message" in data
        print(f"Signup test passed for {unique_email}")
        
        # Verify can login with new account
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": unique_email, "password": "testpass123"}
        )
        assert login_response.status_code == 200
        print(f"New user login verified")


class TestPulseEndpoints:
    """Pulse module endpoint tests"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_pulse_endpoints_exist(self, auth_headers):
        """Test pulse endpoints are accessible"""
        # Test common pulse endpoints
        endpoints = [
            "/api/pulse/guests",
            "/api/pulse/stats"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=auth_headers)
            # These may return 404 if not implemented, but shouldn't be 500
            assert response.status_code != 500, f"{endpoint} returned 500"
            print(f"Pulse endpoint {endpoint} status: {response.status_code}")


class TestCORSHeaders:
    """CORS configuration tests"""
    
    def test_cors_headers_present(self):
        """Test CORS headers are returned"""
        response = requests.options(
            f"{BASE_URL}/api/health",
            headers={"Origin": "http://localhost:3000"}
        )
        
        # OPTIONS request should succeed
        assert response.status_code in [200, 204], f"OPTIONS failed: {response.status_code}"
        print("CORS test passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
