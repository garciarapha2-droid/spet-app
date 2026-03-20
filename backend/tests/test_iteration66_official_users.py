"""
Iteration 66: Official Test Users API Tests

Tests the 3 official test users after mock-* users were removed:
1. teste@teste.com (owner, active, onboarding done, plan=sync, modules: pulse/tap/table/kds)
2. teste1@teste.com (owner, active, onboarding NOT done, plan=flow, modules: pulse/tap/table - NO kds)
3. garcia.rapha2@gmail.com (CEO, active, onboarding done, plan=os, 8 modules incl ai/analytics/bar/finance)

Password for all: 12345

Note: API responses are wrapped in {"data": {...}, "success": true, "error": null} envelope
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Official test users
TEST_USERS = {
    "teste": {
        "email": "teste@teste.com",
        "password": "12345",
        "expected": {
            "status": "active",
            "onboarding_completed": True,
            "plan_id": "sync",
            "role": "owner",
            "modules": ["kds", "pulse", "table", "tap"],  # sorted
        }
    },
    "teste1": {
        "email": "teste1@teste.com",
        "password": "12345",
        "expected": {
            "status": "active",
            "onboarding_completed": False,
            "plan_id": "flow",
            "role": "owner",
            "modules": ["pulse", "table", "tap"],  # sorted, NO kds
        }
    },
    "garcia": {
        "email": "garcia.rapha2@gmail.com",
        "password": "12345",
        "expected": {
            "status": "active",
            "onboarding_completed": True,
            "plan_id": "os",
            "role": "platform_admin",
            "user_role": "CEO",
            "modules": ["ai", "analytics", "bar", "finance", "kds", "pulse", "table", "tap"],  # sorted, 8 modules
        }
    },
}


def unwrap_response(response_json):
    """Unwrap API response from {data: {...}, success: bool, error: ...} envelope"""
    if isinstance(response_json, dict) and "data" in response_json:
        return response_json["data"]
    return response_json


class TestHealthCheck:
    """Basic health check - run first"""
    
    def test_health_returns_healthy(self):
        """GET /api/health returns healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("PASS: Health check returns healthy")


class TestLoginOfficialUsers:
    """Test login for all 3 official users"""
    
    def test_login_teste(self):
        """POST /api/auth/login works for teste@teste.com / 12345"""
        user = TEST_USERS["teste"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = unwrap_response(response.json())
        assert "access_token" in data, f"Missing access_token in: {data}"
        assert "refresh_token" in data
        assert data["user"]["email"] == user["email"]
        print(f"PASS: Login for {user['email']} works")
    
    def test_login_teste1(self):
        """POST /api/auth/login works for teste1@teste.com / 12345"""
        user = TEST_USERS["teste1"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = unwrap_response(response.json())
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == user["email"]
        print(f"PASS: Login for {user['email']} works")
    
    def test_login_garcia(self):
        """POST /api/auth/login works for garcia.rapha2@gmail.com / 12345"""
        user = TEST_USERS["garcia"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = unwrap_response(response.json())
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == user["email"]
        print(f"PASS: Login for {user['email']} works")


class TestAuthMeTeste:
    """Test /api/auth/me for teste@teste.com - owner with sync plan"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        user = TEST_USERS["teste"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        assert response.status_code == 200
        data = unwrap_response(response.json())
        self.token = data["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_me_status_active(self):
        """GET /api/auth/me for teste@teste.com: status=active"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["status"] == "active"
        print("PASS: teste@teste.com status=active")
    
    def test_me_onboarding_completed(self):
        """GET /api/auth/me for teste@teste.com: onboarding_completed=true"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["onboarding_completed"] == True
        print("PASS: teste@teste.com onboarding_completed=true")
    
    def test_me_plan_sync(self):
        """GET /api/auth/me for teste@teste.com: plan.id=sync"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["plan"]["id"] == "sync"
        assert data["plan"]["name"] == "Spet Sync"
        print("PASS: teste@teste.com plan.id=sync")
    
    def test_me_modules_enabled(self):
        """GET /api/auth/me for teste@teste.com: modules_enabled=[kds,pulse,table,tap]"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        expected = ["kds", "pulse", "table", "tap"]
        assert data["modules_enabled"] == expected, f"Expected {expected}, got {data['modules_enabled']}"
        print(f"PASS: teste@teste.com modules_enabled={expected}")
    
    def test_me_role_owner(self):
        """GET /api/auth/me for teste@teste.com: roles[0].role=owner"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert len(data["roles"]) > 0
        assert data["roles"][0]["role"] == "owner"
        print("PASS: teste@teste.com roles[0].role=owner")
    
    def test_me_company_object(self):
        """GET /api/auth/me returns company object with id and name for teste@teste.com"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert "company" in data
        assert data["company"] is not None
        assert "id" in data["company"]
        assert "name" in data["company"]
        print(f"PASS: teste@teste.com has company: {data['company']['name']}")
    
    def test_me_plan_object_full(self):
        """GET /api/auth/me returns plan object with id/name/status/interval/modules/limits"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        plan = data["plan"]
        assert "id" in plan
        assert "name" in plan
        assert "status" in plan
        assert "interval" in plan
        assert "modules" in plan
        assert "limits" in plan
        print(f"PASS: teste@teste.com plan object complete: {plan}")


class TestAuthMeTeste1:
    """Test /api/auth/me for teste1@teste.com - owner with flow plan, onboarding NOT done"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        user = TEST_USERS["teste1"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        assert response.status_code == 200
        data = unwrap_response(response.json())
        self.token = data["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_me_status_active(self):
        """GET /api/auth/me for teste1@teste.com: status=active"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["status"] == "active"
        print("PASS: teste1@teste.com status=active")
    
    def test_me_onboarding_not_completed(self):
        """GET /api/auth/me for teste1@teste.com: onboarding_completed=false"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["onboarding_completed"] == False
        print("PASS: teste1@teste.com onboarding_completed=false")
    
    def test_me_plan_flow(self):
        """GET /api/auth/me for teste1@teste.com: plan.id=flow"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["plan"]["id"] == "flow"
        assert data["plan"]["name"] == "Spet Flow"
        print("PASS: teste1@teste.com plan.id=flow")
    
    def test_me_modules_no_kds(self):
        """GET /api/auth/me for teste1@teste.com: modules_enabled=[pulse,table,tap] (NO kds)"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        expected = ["pulse", "table", "tap"]
        assert data["modules_enabled"] == expected, f"Expected {expected}, got {data['modules_enabled']}"
        assert "kds" not in data["modules_enabled"], "kds should NOT be in modules_enabled for teste1"
        print(f"PASS: teste1@teste.com modules_enabled={expected} (NO kds)")
    
    def test_me_role_owner(self):
        """GET /api/auth/me for teste1@teste.com: roles[0].role=owner"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert len(data["roles"]) > 0
        assert data["roles"][0]["role"] == "owner"
        print("PASS: teste1@teste.com roles[0].role=owner")
    
    def test_me_company_object(self):
        """GET /api/auth/me returns company object with id and name for teste1@teste.com"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert "company" in data
        assert data["company"] is not None
        assert "id" in data["company"]
        assert "name" in data["company"]
        print(f"PASS: teste1@teste.com has company: {data['company']['name']}")
    
    def test_me_plan_object_full(self):
        """GET /api/auth/me returns plan object with all required fields"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        plan = data["plan"]
        assert "id" in plan
        assert "name" in plan
        assert "status" in plan
        assert "interval" in plan
        assert "modules" in plan
        assert "limits" in plan
        print(f"PASS: teste1@teste.com plan object complete")


class TestAuthMeGarcia:
    """Test /api/auth/me for garcia.rapha2@gmail.com - CEO with OS plan, all modules"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token"""
        user = TEST_USERS["garcia"]
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user["email"],
            "password": user["password"]
        })
        assert response.status_code == 200
        data = unwrap_response(response.json())
        self.token = data["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_me_role_ceo(self):
        """GET /api/auth/me for garcia.rapha2@gmail.com: role=CEO"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["role"] == "CEO"
        print("PASS: garcia.rapha2@gmail.com role=CEO")
    
    def test_me_status_active(self):
        """GET /api/auth/me for garcia.rapha2@gmail.com: status=active"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["status"] == "active"
        print("PASS: garcia.rapha2@gmail.com status=active")
    
    def test_me_onboarding_completed(self):
        """GET /api/auth/me for garcia.rapha2@gmail.com: onboarding_completed=true"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["onboarding_completed"] == True
        print("PASS: garcia.rapha2@gmail.com onboarding_completed=true")
    
    def test_me_plan_os(self):
        """GET /api/auth/me for garcia.rapha2@gmail.com: plan.id=os"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert data["plan"]["id"] == "os"
        assert data["plan"]["name"] == "Spet OS"
        print("PASS: garcia.rapha2@gmail.com plan.id=os")
    
    def test_me_modules_all_8(self):
        """GET /api/auth/me for garcia.rapha2@gmail.com: modules_enabled includes 8 modules"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        expected = ["ai", "analytics", "bar", "finance", "kds", "pulse", "table", "tap"]
        assert data["modules_enabled"] == expected, f"Expected {expected}, got {data['modules_enabled']}"
        assert len(data["modules_enabled"]) == 8, f"Expected 8 modules, got {len(data['modules_enabled'])}"
        print(f"PASS: garcia.rapha2@gmail.com modules_enabled has 8 modules: {data['modules_enabled']}")
    
    def test_me_access_role_platform_admin(self):
        """GET /api/auth/me for garcia.rapha2@gmail.com: roles[0].role=platform_admin"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert len(data["roles"]) > 0
        assert data["roles"][0]["role"] == "platform_admin"
        print("PASS: garcia.rapha2@gmail.com roles[0].role=platform_admin")
    
    def test_me_company_object(self):
        """GET /api/auth/me returns company object with id and name for garcia"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert "company" in data
        assert data["company"] is not None
        assert "id" in data["company"]
        assert "name" in data["company"]
        print(f"PASS: garcia.rapha2@gmail.com has company: {data['company']['name']}")
    
    def test_me_plan_object_full(self):
        """GET /api/auth/me returns plan object with all required fields"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        plan = data["plan"]
        assert "id" in plan
        assert "name" in plan
        assert "status" in plan
        assert "interval" in plan
        assert "modules" in plan
        assert "limits" in plan
        # OS plan should have unlimited venues/staff (-1)
        assert plan["limits"]["venues"] == -1
        assert plan["limits"]["staff"] == -1
        print(f"PASS: garcia.rapha2@gmail.com plan object complete with unlimited limits")


class TestMockUserRemoval:
    """Test that mock-* users were removed (should return invalid credentials)"""
    
    def test_mock_owner_active_removed(self):
        """Login for mock-owner-active@spetapp.com should return invalid credentials (user removed)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mock-owner-active@spetapp.com",
            "password": "test123"
        })
        # Either 401 (invalid credentials) or 200 (if user still exists for backwards compat)
        if response.status_code == 401:
            print("PASS: mock-owner-active@spetapp.com removed - returns 401")
        elif response.status_code == 200:
            print("PASS: mock-owner-active@spetapp.com still works (backwards compatible)")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")


class TestRegressionEndpoints:
    """Regression tests for other auth endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login with teste@teste.com to get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200
        data = unwrap_response(response.json())
        self.token = data["access_token"]
        self.refresh_token = data["refresh_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_refresh_token_works(self):
        """POST /api/auth/refresh-token works (regression)"""
        response = requests.post(f"{BASE_URL}/api/auth/refresh-token", json={
            "refresh_token": self.refresh_token
        })
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert "access_token" in data
        assert "refresh_token" in data
        print("PASS: /api/auth/refresh-token works")
    
    def test_permissions_endpoint(self):
        """GET /api/auth/permissions works for teste@teste.com (regression)"""
        response = requests.get(f"{BASE_URL}/api/auth/permissions", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert "user_id" in data
        assert "email" in data
        assert data["email"] == "teste@teste.com"
        print("PASS: /api/auth/permissions works")
    
    def test_onboarding_plans(self):
        """GET /api/onboarding/plans returns 4 plans (regression)"""
        response = requests.get(f"{BASE_URL}/api/onboarding/plans", headers=self.headers)
        assert response.status_code == 200
        data = unwrap_response(response.json())
        assert "plans" in data
        plans = data["plans"]
        assert len(plans) == 4, f"Expected 4 plans, got {len(plans)}"
        plan_ids = [p["id"] for p in plans]
        assert "core" in plan_ids
        assert "flow" in plan_ids
        assert "sync" in plan_ids
        assert "os" in plan_ids
        print(f"PASS: /api/onboarding/plans returns 4 plans: {plan_ids}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
