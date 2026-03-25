"""
Iteration 93: Mobile Backend API Tests
Tests backend endpoints consumed by the iPhone mobile app:
- Health check
- Authentication (login)
- Tap sessions
- Tap catalog
- Pulse entries
- Tables
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for CEO user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("data", {}).get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestHealthCheck:
    """Health endpoint tests"""
    
    def test_health_returns_healthy(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("service") == "SPETAP"
        print(f"✓ Health check passed: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_with_valid_credentials(self):
        """POST /api/auth/login with valid CEO credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data.get("success") is True
        assert "data" in data
        
        login_data = data["data"]
        assert "access_token" in login_data
        assert "refresh_token" in login_data
        assert "user" in login_data
        
        user = login_data["user"]
        assert user["email"] == CEO_EMAIL
        assert user["role"] == "CEO"
        assert user["status"] == "active"
        print(f"✓ Login successful for {user['email']} with role {user['role']}")
    
    def test_login_with_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")


class TestTapSessions:
    """Tap sessions endpoint tests - used by Tabs/Bar module"""
    
    def test_get_sessions_requires_auth(self):
        """GET /api/tap/sessions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}")
        assert response.status_code == 401
        print("✓ Sessions endpoint correctly requires auth")
    
    def test_get_sessions_returns_data(self, auth_headers):
        """GET /api/tap/sessions returns session data"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "data" in data
        
        sessions_data = data["data"]
        assert "sessions" in sessions_data
        assert "total" in sessions_data
        assert isinstance(sessions_data["sessions"], list)
        
        # Verify session structure if sessions exist
        if sessions_data["sessions"]:
            session = sessions_data["sessions"][0]
            assert "id" in session
            assert "status" in session
            assert "session_type" in session
            print(f"✓ Sessions returned: {sessions_data['total']} sessions")
        else:
            print("✓ Sessions endpoint working (no active sessions)")


class TestTapCatalog:
    """Tap catalog endpoint tests - used by POS ordering"""
    
    def test_get_catalog_requires_auth(self):
        """GET /api/tap/catalog requires authentication"""
        response = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}")
        assert response.status_code == 401
        print("✓ Catalog endpoint correctly requires auth")
    
    def test_get_catalog_returns_items(self, auth_headers):
        """GET /api/tap/catalog returns catalog items"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "data" in data
        
        catalog_data = data["data"]
        assert "items" in catalog_data
        assert isinstance(catalog_data["items"], list)
        assert len(catalog_data["items"]) > 0, "Catalog should have items"
        
        # Verify item structure
        item = catalog_data["items"][0]
        assert "id" in item
        assert "name" in item
        assert "category" in item
        assert "price" in item
        assert "is_alcohol" in item
        
        # Count categories
        categories = set(i["category"] for i in catalog_data["items"])
        print(f"✓ Catalog returned: {len(catalog_data['items'])} items in {len(categories)} categories")


class TestPulseEntries:
    """Pulse entries endpoint tests - used by Entry module"""
    
    def test_get_entries_today_requires_auth(self):
        """GET /api/pulse/entries/today requires authentication"""
        response = requests.get(f"{BASE_URL}/api/pulse/entries/today?venue_id={VENUE_ID}")
        assert response.status_code == 401
        print("✓ Entries endpoint correctly requires auth")
    
    def test_get_entries_today_returns_data(self, auth_headers):
        """GET /api/pulse/entries/today returns entry data"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "data" in data
        
        entries_data = data["data"]
        assert "entries" in entries_data
        assert "total" in entries_data
        assert "allowed" in entries_data
        assert "denied" in entries_data
        assert isinstance(entries_data["entries"], list)
        
        print(f"✓ Entries today: {entries_data['total']} total, {entries_data['allowed']} allowed, {entries_data['denied']} denied")


class TestTables:
    """Tables endpoint tests - used by Tables module"""
    
    def test_get_tables_requires_auth(self):
        """GET /api/table/tables requires authentication"""
        response = requests.get(f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}")
        assert response.status_code == 401
        print("✓ Tables endpoint correctly requires auth")
    
    def test_get_tables_returns_data(self, auth_headers):
        """GET /api/table/tables returns table data"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") is True
        assert "data" in data
        
        tables_data = data["data"]
        assert "tables" in tables_data
        assert "total" in tables_data
        assert isinstance(tables_data["tables"], list)
        assert len(tables_data["tables"]) > 0, "Should have tables"
        
        # Verify table structure
        table = tables_data["tables"][0]
        assert "id" in table
        assert "table_number" in table
        assert "zone" in table
        assert "capacity" in table
        assert "status" in table
        
        # Count by status
        statuses = {}
        for t in tables_data["tables"]:
            s = t["status"]
            statuses[s] = statuses.get(s, 0) + 1
        
        print(f"✓ Tables returned: {tables_data['total']} tables - {statuses}")


class TestWebAppLanding:
    """Web app landing page test"""
    
    def test_landing_page_loads(self):
        """GET / returns 200"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        print("✓ Web app landing page loads correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
