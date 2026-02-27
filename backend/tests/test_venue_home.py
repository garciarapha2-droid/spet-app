"""
Test suite for Venue Home Page APIs
Tests login redirect, venue home endpoint, and module access
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLoginRedirect:
    """Tests for login redirect to /venue/home"""
    
    def test_login_returns_venue_home_redirect(self):
        """POST /api/auth/login should return next.route = '/venue/home'"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "next" in data, "Response missing 'next' field"
        assert data["next"]["type"] == "route", f"Expected type 'route', got {data['next']['type']}"
        assert data["next"]["route"] == "/venue/home", f"Expected '/venue/home', got {data['next']['route']}"
        print(f"✓ Login redirect correct: {data['next']['route']}")
    
    def test_login_returns_valid_token(self):
        """Login should return valid access token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data, "Response missing 'access_token'"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 50, "Token seems too short"
        print("✓ Access token returned correctly")


class TestVenueHomeAPI:
    """Tests for GET /api/venue/home endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["access_token"]
    
    def test_venue_home_requires_auth(self):
        """GET /api/venue/home should require authentication"""
        response = requests.get(f"{BASE_URL}/api/venue/home")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Venue home requires authentication")
    
    def test_venue_home_returns_venues(self, auth_token):
        """Venue home should return list of venues"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "venues" in data, "Response missing 'venues'"
        assert isinstance(data["venues"], list)
        assert len(data["venues"]) > 0, "Expected at least one venue"
        print(f"✓ Returned {len(data['venues'])} venue(s)")
    
    def test_venue_home_returns_active_venue(self, auth_token):
        """Venue home should return active venue with name"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "active_venue" in data, "Response missing 'active_venue'"
        assert data["active_venue"]["name"] == "Demo Club", f"Expected 'Demo Club', got {data['active_venue']['name']}"
        assert "id" in data["active_venue"], "active_venue missing 'id'"
        print(f"✓ Active venue: {data['active_venue']['name']}")
    
    def test_venue_home_returns_all_7_modules(self, auth_token):
        """Venue home should return exactly 7 modules"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "modules" in data, "Response missing 'modules'"
        assert len(data["modules"]) == 7, f"Expected 7 modules, got {len(data['modules'])}"
        
        expected_keys = ["pulse", "tap", "table", "kds", "manager", "owner", "ceo"]
        actual_keys = [m["key"] for m in data["modules"]]
        assert actual_keys == expected_keys, f"Module order incorrect: {actual_keys}"
        print(f"✓ All 7 modules in correct order: {actual_keys}")
    
    def test_venue_home_modules_structure(self, auth_token):
        """Each module should have key, name, description, enabled, locked_reason"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        for mod in data["modules"]:
            assert "key" in mod, f"Module missing 'key'"
            assert "name" in mod, f"Module missing 'name'"
            assert "description" in mod, f"Module missing 'description'"
            assert "enabled" in mod, f"Module missing 'enabled'"
            assert "locked_reason" in mod, f"Module missing 'locked_reason'"
        print("✓ All modules have correct structure")
    
    def test_super_admin_has_all_modules_enabled(self, auth_token):
        """Super admin user should have all 7 modules enabled"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_role"] == "super_admin", f"Expected super_admin, got {data['user_role']}"
        
        for mod in data["modules"]:
            assert mod["enabled"] == True, f"Module {mod['key']} should be enabled for super_admin"
            assert mod["locked_reason"] is None, f"Module {mod['key']} should not have locked_reason"
        print("✓ All 7 modules enabled for super_admin")
    
    def test_venue_home_returns_user_email(self, auth_token):
        """Venue home should return user email"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "user_email" in data, "Response missing 'user_email'"
        assert data["user_email"] == "teste@teste.com", f"Expected 'teste@teste.com', got {data['user_email']}"
        print(f"✓ User email: {data['user_email']}")
    
    def test_venue_home_returns_user_role(self, auth_token):
        """Venue home should return user role"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "user_role" in data, "Response missing 'user_role'"
        assert data["user_role"] == "super_admin", f"Expected 'super_admin', got {data['user_role']}"
        print(f"✓ User role: {data['user_role']}")
