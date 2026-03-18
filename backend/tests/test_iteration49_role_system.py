"""
Iteration 49: User Role System Tests
Tests for:
1. Login with test accounts returns correct role (USER vs CEO)
2. /api/auth/me returns role field
3. CEO endpoints return 403 for non-CEO users
4. CEO endpoints work for CEO users
5. System accounts cannot be deleted
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserRoleSystem:
    """Test role-based access control and protected accounts"""
    
    # Test credentials
    TEST_USER_EMAIL = "teste@teste.com"
    TEST_USER_PASSWORD = "12345"
    CEO_USER_EMAIL = "garcia.rapha2@gmail.com"
    CEO_USER_PASSWORD = "12345"
    
    @pytest.fixture
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture
    def test_user_token(self, api_client):
        """Get token for regular test user (role=USER)"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.TEST_USER_EMAIL,
            "password": self.TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Test user login failed: {response.status_code}")
        return response.json().get("access_token")
    
    @pytest.fixture
    def test_user_id(self, api_client):
        """Get user ID for regular test user"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.TEST_USER_EMAIL,
            "password": self.TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Test user login failed: {response.status_code}")
        return response.json().get("user", {}).get("id")
    
    @pytest.fixture
    def ceo_user_token(self, api_client):
        """Get token for CEO user (role=CEO)"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.CEO_USER_EMAIL,
            "password": self.CEO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"CEO user login failed: {response.status_code}")
        return response.json().get("access_token")
    
    @pytest.fixture
    def ceo_user_id(self, api_client):
        """Get user ID for CEO user"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.CEO_USER_EMAIL,
            "password": self.CEO_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"CEO user login failed: {response.status_code}")
        return response.json().get("user", {}).get("id")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 1: Login with TEST user returns role: USER
    # ═══════════════════════════════════════════════════════════════════
    def test_login_test_user_returns_user_role(self, api_client):
        """Login with teste@teste.com should return role: USER"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.TEST_USER_EMAIL,
            "password": self.TEST_USER_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify token is returned
        assert "access_token" in data, "No access_token in response"
        assert len(data["access_token"]) > 0, "Empty access_token"
        
        # Verify user object has role
        assert "user" in data, "No user object in response"
        user = data["user"]
        assert "role" in user, f"No role field in user object: {user}"
        assert user["role"] == "USER", f"Expected role 'USER', got '{user['role']}'"
        
        print(f"✅ Test user login returns role: {user['role']}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 2: Login with CEO user returns role: CEO
    # ═══════════════════════════════════════════════════════════════════
    def test_login_ceo_user_returns_ceo_role(self, api_client):
        """Login with garcia.rapha2@gmail.com should return role: CEO"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.CEO_USER_EMAIL,
            "password": self.CEO_USER_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify token is returned
        assert "access_token" in data, "No access_token in response"
        assert len(data["access_token"]) > 0, "Empty access_token"
        
        # Verify user object has role
        assert "user" in data, "No user object in response"
        user = data["user"]
        assert "role" in user, f"No role field in user object: {user}"
        assert user["role"] == "CEO", f"Expected role 'CEO', got '{user['role']}'"
        
        print(f"✅ CEO user login returns role: {user['role']}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 3: GET /api/auth/me returns role field for TEST user
    # ═══════════════════════════════════════════════════════════════════
    def test_auth_me_returns_role_for_test_user(self, api_client, test_user_token):
        """GET /api/auth/me should return role field for regular user"""
        api_client.headers.update({"Authorization": f"Bearer {test_user_token}"})
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200, f"GET /me failed: {response.text}"
        data = response.json()
        
        assert "role" in data, f"No role field in /me response: {data}"
        assert data["role"] == "USER", f"Expected role 'USER', got '{data['role']}'"
        assert data["email"] == self.TEST_USER_EMAIL
        
        print(f"✅ /api/auth/me returns role: {data['role']} for test user")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 4: GET /api/auth/me returns role field for CEO user
    # ═══════════════════════════════════════════════════════════════════
    def test_auth_me_returns_role_for_ceo_user(self, api_client, ceo_user_token):
        """GET /api/auth/me should return role field for CEO user"""
        api_client.headers.update({"Authorization": f"Bearer {ceo_user_token}"})
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        
        assert response.status_code == 200, f"GET /me failed: {response.text}"
        data = response.json()
        
        assert "role" in data, f"No role field in /me response: {data}"
        assert data["role"] == "CEO", f"Expected role 'CEO', got '{data['role']}'"
        assert data["email"] == self.CEO_USER_EMAIL
        
        print(f"✅ /api/auth/me returns role: {data['role']} for CEO user")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 5: CEO endpoint returns 403 for regular user
    # ═══════════════════════════════════════════════════════════════════
    def test_ceo_health_returns_403_for_regular_user(self, api_client, test_user_token):
        """GET /api/ceo/health should return 403 for non-CEO user"""
        api_client.headers.update({"Authorization": f"Bearer {test_user_token}"})
        response = api_client.get(f"{BASE_URL}/api/ceo/health")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "CEO access required" in data.get("detail", ""), f"Unexpected error message: {data}"
        
        print(f"✅ /api/ceo/health returns 403 for non-CEO user: {data.get('detail')}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 6: CEO endpoint returns 200 for CEO user
    # ═══════════════════════════════════════════════════════════════════
    def test_ceo_health_returns_200_for_ceo_user(self, api_client, ceo_user_token):
        """GET /api/ceo/health should return 200 with data for CEO user"""
        api_client.headers.update({"Authorization": f"Bearer {ceo_user_token}"})
        response = api_client.get(f"{BASE_URL}/api/ceo/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "kpis" in data, f"No 'kpis' in response: {data}"
        
        print(f"✅ /api/ceo/health returns 200 for CEO user with KPIs")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 7: DELETE test user account returns 403 (system account protection)
    # ═══════════════════════════════════════════════════════════════════
    def test_delete_test_user_returns_403(self, api_client, ceo_user_token, test_user_id):
        """DELETE /api/auth/users/{test_user_id} should return 403 for system account"""
        api_client.headers.update({"Authorization": f"Bearer {ceo_user_token}"})
        response = api_client.delete(f"{BASE_URL}/api/auth/users/{test_user_id}")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "System account cannot be deleted" in data.get("detail", ""), f"Unexpected error: {data}"
        
        print(f"✅ DELETE test user returns 403: {data.get('detail')}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 8: DELETE CEO user account returns 403 (system account protection)
    # ═══════════════════════════════════════════════════════════════════
    def test_delete_ceo_user_returns_403(self, api_client, ceo_user_token, ceo_user_id):
        """DELETE /api/auth/users/{ceo_user_id} should return 403 for system account"""
        api_client.headers.update({"Authorization": f"Bearer {ceo_user_token}"})
        response = api_client.delete(f"{BASE_URL}/api/auth/users/{ceo_user_id}")
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "System account cannot be deleted" in data.get("detail", ""), f"Unexpected error: {data}"
        
        print(f"✅ DELETE CEO user returns 403: {data.get('detail')}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 9: Multiple CEO endpoints return 403 for regular user
    # ═══════════════════════════════════════════════════════════════════
    def test_multiple_ceo_endpoints_blocked_for_regular_user(self, api_client, test_user_token):
        """Multiple CEO endpoints should return 403 for non-CEO user"""
        api_client.headers.update({"Authorization": f"Bearer {test_user_token}"})
        
        ceo_endpoints = [
            "/api/ceo/health",
            "/api/ceo/kpi-breakdown?kpi=mrr",
            "/api/ceo/revenue",
            "/api/ceo/targets",
            "/api/ceo/companies",
            "/api/ceo/modules",
            "/api/ceo/alerts",
            "/api/ceo/pipeline",
            "/api/ceo/users",
        ]
        
        blocked_count = 0
        for endpoint in ceo_endpoints:
            response = api_client.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 403:
                blocked_count += 1
                print(f"  ✅ {endpoint}: 403 Forbidden")
            else:
                print(f"  ❌ {endpoint}: {response.status_code} (expected 403)")
        
        assert blocked_count == len(ceo_endpoints), f"Only {blocked_count}/{len(ceo_endpoints)} endpoints blocked"
        print(f"✅ All {len(ceo_endpoints)} CEO endpoints blocked for regular user")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 10: Multiple CEO endpoints work for CEO user
    # ═══════════════════════════════════════════════════════════════════
    def test_multiple_ceo_endpoints_work_for_ceo_user(self, api_client, ceo_user_token):
        """Multiple CEO endpoints should return 200 for CEO user"""
        api_client.headers.update({"Authorization": f"Bearer {ceo_user_token}"})
        
        ceo_endpoints = [
            "/api/ceo/health",
            "/api/ceo/kpi-breakdown?kpi=mrr",
            "/api/ceo/revenue",
            "/api/ceo/targets",
            "/api/ceo/companies",
            "/api/ceo/modules",
            "/api/ceo/alerts",
            "/api/ceo/pipeline",
            "/api/ceo/users",
        ]
        
        success_count = 0
        for endpoint in ceo_endpoints:
            response = api_client.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 200:
                success_count += 1
                print(f"  ✅ {endpoint}: 200 OK")
            else:
                print(f"  ❌ {endpoint}: {response.status_code} (expected 200)")
        
        assert success_count == len(ceo_endpoints), f"Only {success_count}/{len(ceo_endpoints)} endpoints accessible"
        print(f"✅ All {len(ceo_endpoints)} CEO endpoints accessible for CEO user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
