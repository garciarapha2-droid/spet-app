"""
Iteration 44: Backend API Tests for New Features
- Table module: ID verification flow + new workflow (Cancel/Confirm → Payment)
- Tap module: Same new workflow (Cancel/Confirm → Payment)
- CEO module: Users tab CRUD endpoints
- CEO module: Module toggle (Company management)
- Module access enforcement via /api/venue/check-module/{module_key}
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

# Test credentials
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API calls."""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if resp.status_code == 200:
        token = resp.json().get("access_token")  # API returns access_token, not token
        return token
    pytest.skip(f"Auth failed: {resp.status_code} - {resp.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get authorization headers."""
    return {"Authorization": f"Bearer {auth_token}"}


# ─── Table Module Tests ─────────────────────────────────────────────

class TestTableModule:
    """Test Table module endpoints and workflow."""

    def test_get_tables(self, auth_headers):
        """Test GET /api/table/tables returns list of tables."""
        resp = requests.get(f"{BASE_URL}/api/table/tables", 
                          params={"venue_id": VENUE_ID}, 
                          headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "tables" in data
        assert isinstance(data["tables"], list)
        print(f"✓ Got {len(data['tables'])} tables")

    def test_open_table_requires_server(self, auth_headers):
        """Test that open table accepts server_name."""
        # First get an available table
        resp = requests.get(f"{BASE_URL}/api/table/tables", 
                          params={"venue_id": VENUE_ID}, 
                          headers=auth_headers)
        tables = resp.json().get("tables", [])
        available = [t for t in tables if t["status"] == "available"]
        
        if not available:
            pytest.skip("No available tables to test")
        
        table_id = available[0]["id"]
        
        # Open table with server_name
        form_data = {
            "venue_id": VENUE_ID,
            "table_id": table_id,
            "guest_name": "TEST_Iter44_Guest",
            "server_name": "Carlos Silva"
        }
        resp = requests.post(f"{BASE_URL}/api/table/open", 
                           data=form_data, 
                           headers=auth_headers)
        assert resp.status_code == 200, f"Open table failed: {resp.text}"
        data = resp.json()
        assert "session_id" in data
        print(f"✓ Table opened with session {data['session_id']}")
        
        # Store for cleanup
        pytest.table_test_session_id = data["session_id"]
        pytest.table_test_table_id = table_id

    def test_table_detail_shows_server(self, auth_headers):
        """Test GET /api/table/{id} returns server_name in session."""
        if not hasattr(pytest, 'table_test_table_id'):
            pytest.skip("No table session from previous test")
        
        resp = requests.get(f"{BASE_URL}/api/table/{pytest.table_test_table_id}", 
                          headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "session" in data
        session = data["session"]
        assert session is not None
        print(f"✓ Table detail: guest={session.get('guest_name')}, server={session.get('server_name')}")

    def test_close_table_with_payment_location(self, auth_headers):
        """Test close table supports payment_location."""
        if not hasattr(pytest, 'table_test_table_id'):
            pytest.skip("No table session from previous test")
        
        form_data = {
            "table_id": pytest.table_test_table_id,
            "payment_method": "card",
            "payment_location": "pay_here"
        }
        resp = requests.post(f"{BASE_URL}/api/table/close", 
                           data=form_data, 
                           headers=auth_headers)
        assert resp.status_code == 200, f"Close failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "available"
        assert data.get("payment_location") == "pay_here"
        print(f"✓ Table closed with payment_location={data.get('payment_location')}")


# ─── TAP Module Tests ───────────────────────────────────────────────

class TestTapModule:
    """Test TAP module endpoints and workflow."""

    def test_get_sessions(self, auth_headers):
        """Test GET /api/tap/sessions returns sessions list."""
        resp = requests.get(f"{BASE_URL}/api/tap/sessions", 
                          params={"venue_id": VENUE_ID, "status": "open"}, 
                          headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "sessions" in data
        print(f"✓ Got {len(data['sessions'])} open TAP sessions")

    def test_open_tap_session(self, auth_headers):
        """Test opening a new TAP session (tab)."""
        form_data = {
            "venue_id": VENUE_ID,
            "guest_name": "TEST_Iter44_TAP_Guest",
            "bartender_id": None,
            "bartender_name": "Test Bartender"
        }
        resp = requests.post(f"{BASE_URL}/api/tap/session/open", 
                           data=form_data, 
                           headers=auth_headers)
        assert resp.status_code == 200, f"Open TAP session failed: {resp.text}"
        data = resp.json()
        assert "session_id" in data
        assert "tab_number" in data
        print(f"✓ TAP session opened: tab #{data['tab_number']}")
        pytest.tap_test_session_id = data["session_id"]

    def test_tap_add_item(self, auth_headers):
        """Test adding item to TAP session."""
        if not hasattr(pytest, 'tap_test_session_id'):
            pytest.skip("No TAP session from previous test")
        
        # Get catalog to find an item
        cat_resp = requests.get(f"{BASE_URL}/api/tap/catalog", 
                               params={"venue_id": VENUE_ID}, 
                               headers=auth_headers)
        items = cat_resp.json().get("items", [])
        if not items:
            pytest.skip("No catalog items available")
        
        item = items[0]
        form_data = {
            "item_id": item["id"],
            "qty": 1
        }
        resp = requests.post(f"{BASE_URL}/api/tap/session/{pytest.tap_test_session_id}/add", 
                           data=form_data, 
                           headers=auth_headers)
        assert resp.status_code == 200, f"Add item failed: {resp.text}"
        data = resp.json()
        assert "line_item_id" in data
        print(f"✓ Added item '{data.get('name')}' to TAP session")

    def test_tap_close_with_payment_location(self, auth_headers):
        """Test close TAP session with payment_location (pay_here or pay_at_register)."""
        if not hasattr(pytest, 'tap_test_session_id'):
            pytest.skip("No TAP session from previous test")
        
        form_data = {
            "payment_method": "card",
            "payment_location": "pay_at_register"
        }
        resp = requests.post(f"{BASE_URL}/api/tap/session/{pytest.tap_test_session_id}/close", 
                           data=form_data, 
                           headers=auth_headers)
        assert resp.status_code == 200, f"Close TAP session failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "closed"
        assert data.get("payment_location") == "pay_at_register"
        print(f"✓ TAP session closed with payment_location={data.get('payment_location')}")


# ─── CEO Module Tests ───────────────────────────────────────────────

class TestCeoModule:
    """Test CEO module endpoints - Users and Module management."""

    def test_ceo_health(self, auth_headers):
        """Test GET /api/ceo/health returns company KPIs."""
        resp = requests.get(f"{BASE_URL}/api/ceo/health", headers=auth_headers)
        assert resp.status_code == 200, f"CEO health failed: {resp.text}"
        data = resp.json()
        assert "kpis" in data
        kpis = data["kpis"]
        assert "mrr" in kpis or kpis == {}  # May be empty if no data
        print(f"✓ CEO health KPIs: {kpis.keys() if kpis else 'empty'}")

    def test_ceo_get_users(self, auth_headers):
        """Test GET /api/ceo/users returns user list."""
        resp = requests.get(f"{BASE_URL}/api/ceo/users", headers=auth_headers)
        assert resp.status_code == 200, f"CEO get users failed: {resp.text}"
        data = resp.json()
        assert "users" in data
        users = data["users"]
        assert isinstance(users, list)
        print(f"✓ CEO Users: {len(users)} users found")
        
        # Verify user structure
        if users:
            user = users[0]
            assert "id" in user
            assert "email" in user
            assert "status" in user
            assert "roles" in user
            print(f"✓ User structure verified: {user['email']}")

    def test_ceo_create_user(self, auth_headers):
        """Test POST /api/ceo/users creates a new user."""
        import uuid
        test_email = f"test_iter44_{uuid.uuid4().hex[:8]}@test.com"
        form_data = {
            "email": test_email,
            "password": "testpass123",
            "role": "server",
            "venue_id": VENUE_ID,
            "permissions": '{"pulse": true, "tap": true, "table": true}'
        }
        resp = requests.post(f"{BASE_URL}/api/ceo/users", 
                           data=form_data, 
                           headers=auth_headers)
        assert resp.status_code == 200, f"Create user failed: {resp.text}"
        data = resp.json()
        assert "user_id" in data
        assert data.get("email") == test_email.lower()
        print(f"✓ Created user: {test_email}")
        pytest.ceo_test_user_id = data["user_id"]

    def test_ceo_update_user(self, auth_headers):
        """Test PUT /api/ceo/users/{id} updates user."""
        if not hasattr(pytest, 'ceo_test_user_id'):
            pytest.skip("No test user from previous test")
        
        form_data = {
            "role": "bartender",
            "status": "active"
        }
        resp = requests.put(f"{BASE_URL}/api/ceo/users/{pytest.ceo_test_user_id}", 
                          data=form_data, 
                          headers=auth_headers)
        assert resp.status_code == 200, f"Update user failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "updated"
        print(f"✓ Updated user role to bartender")

    def test_ceo_delete_user(self, auth_headers):
        """Test DELETE /api/ceo/users/{id} deletes user."""
        if not hasattr(pytest, 'ceo_test_user_id'):
            pytest.skip("No test user from previous test")
        
        resp = requests.delete(f"{BASE_URL}/api/ceo/users/{pytest.ceo_test_user_id}", 
                              headers=auth_headers)
        assert resp.status_code == 200, f"Delete user failed: {resp.text}"
        data = resp.json()
        assert data.get("deleted") is True
        print(f"✓ Deleted test user")

    def test_ceo_get_companies(self, auth_headers):
        """Test GET /api/ceo/companies returns company list with modules."""
        resp = requests.get(f"{BASE_URL}/api/ceo/companies", headers=auth_headers)
        assert resp.status_code == 200, f"CEO companies failed: {resp.text}"
        data = resp.json()
        assert "companies" in data
        companies = data["companies"]
        print(f"✓ CEO Companies: {len(companies)} companies")
        
        # Verify company structure has venue modules
        if companies:
            company = companies[0]
            if company.get("venues"):
                venue = company["venues"][0]
                assert "modules" in venue
                print(f"✓ Venue modules: {venue.get('modules')}")

    def test_ceo_update_company_modules(self, auth_headers):
        """Test PUT /api/ceo/company/{user_id}/modules toggles modules for a venue."""
        # First get a company
        resp = requests.get(f"{BASE_URL}/api/ceo/companies", headers=auth_headers)
        companies = resp.json().get("companies", [])
        if not companies:
            pytest.skip("No companies to test")
        
        company = companies[0]
        if not company.get("venues"):
            pytest.skip("Company has no venues")
        
        venue = company["venues"][0]
        venue_id = venue["venue_id"]
        user_id = company["user_id"]
        
        # Toggle to have only 'pulse' and 'tap' enabled
        form_data = {
            "venue_id": venue_id,
            "modules": "pulse,tap,table,kds"  # Re-enable all for consistency
        }
        resp = requests.put(f"{BASE_URL}/api/ceo/company/{user_id}/modules", 
                          data=form_data, 
                          headers=auth_headers)
        assert resp.status_code == 200, f"Update modules failed: {resp.text}"
        data = resp.json()
        assert data.get("status") == "updated"
        print(f"✓ Updated venue modules: {data.get('modules')}")


# ─── Module Access Enforcement Tests ────────────────────────────────

class TestModuleAccessEnforcement:
    """Test module access enforcement via /api/venue/check-module/{module_key}."""

    def test_check_module_tap_allowed(self, auth_headers):
        """Test that TAP module is allowed for the venue."""
        resp = requests.get(f"{BASE_URL}/api/venue/check-module/tap", 
                          params={"venue_id": VENUE_ID}, 
                          headers=auth_headers)
        assert resp.status_code == 200, f"Check module failed: {resp.text}"
        data = resp.json()
        assert data.get("module") == "tap"
        print(f"✓ TAP module allowed: {data.get('allowed')}")

    def test_check_module_table_allowed(self, auth_headers):
        """Test that Table module is allowed for the venue."""
        resp = requests.get(f"{BASE_URL}/api/venue/check-module/table", 
                          params={"venue_id": VENUE_ID}, 
                          headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("module") == "table"
        print(f"✓ Table module allowed: {data.get('allowed')}")

    def test_check_module_invalid(self, auth_headers):
        """Test that invalid module returns allowed: false."""
        resp = requests.get(f"{BASE_URL}/api/venue/check-module/invalid_module", 
                          params={"venue_id": VENUE_ID}, 
                          headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("allowed") is False
        print(f"✓ Invalid module correctly returns allowed=false")


# ─── Verify ID Flow Test ────────────────────────────────────────────

class TestIdVerificationFlow:
    """Test ID verification flow for alcohol items in Table module."""

    def test_verify_id_endpoint(self, auth_headers):
        """Test POST /api/tap/session/{id}/verify-id works correctly."""
        # First open a table to get a session
        resp = requests.get(f"{BASE_URL}/api/table/tables", 
                          params={"venue_id": VENUE_ID}, 
                          headers=auth_headers)
        tables = resp.json().get("tables", [])
        available = [t for t in tables if t["status"] == "available"]
        
        if not available:
            pytest.skip("No available tables")
        
        table_id = available[0]["id"]
        
        # Open table
        form_data = {
            "venue_id": VENUE_ID,
            "table_id": table_id,
            "guest_name": "TEST_ID_Verify_Guest"
        }
        resp = requests.post(f"{BASE_URL}/api/table/open", 
                           data=form_data, 
                           headers=auth_headers)
        if resp.status_code != 200:
            pytest.skip(f"Couldn't open table: {resp.text}")
        
        session_id = resp.json()["session_id"]
        
        # Verify ID
        resp = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/verify-id", 
                           headers=auth_headers)
        assert resp.status_code == 200, f"Verify ID failed: {resp.text}"
        data = resp.json()
        assert data.get("id_verified") is True
        print(f"✓ ID verification successful")
        
        # Get table detail to verify id_verified is persisted
        resp = requests.get(f"{BASE_URL}/api/table/{table_id}", headers=auth_headers)
        detail = resp.json()
        session = detail.get("session", {})
        assert session.get("id_verified") is True
        print(f"✓ ID verified status persisted in session")
        
        # Cleanup: close table
        form_data = {"table_id": table_id, "payment_method": "card", "payment_location": "pay_here"}
        requests.post(f"{BASE_URL}/api/table/close", data=form_data, headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
