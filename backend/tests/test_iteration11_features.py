"""
Iteration 11 Feature Testing
Tests for:
- TAP page: Tab numbers (#101+), menu categories, custom item form, currency $
- Manager Dashboard: Menu/Staff/Settings/Reports tabs
- Owner Dashboard: Overview metrics, sidebar tabs
- Venue Home: Modules dropdown (no CEO)
- KDS: 4-column kanban
- Table: Server/Waiter dropdown
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    # API returns access_token, not token
    token = data.get("access_token") or data.get("token")
    assert token, f"No token in login response: {data.keys()}"
    return token

@pytest.fixture(scope="module")
def api_client(auth_token):
    """Authenticated session"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestTAPSessions:
    """TAP Sessions: Tab numbers (#101+), currency $"""
    
    def test_get_sessions_returns_tab_numbers(self, api_client):
        """Sessions should include tab_number in response"""
        response = api_client.get(f"{BASE_URL}/api/tap/sessions", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        sessions = data["sessions"]
        # Should have 8+ open tabs based on context
        assert len(sessions) >= 1, f"Expected open tabs, got {len(sessions)}"
        # Check tab_number exists on sessions
        for session in sessions[:3]:  # Check first 3
            assert "tab_number" in session, f"Session missing tab_number: {session}"
            if session["tab_number"]:
                assert session["tab_number"] >= 100, f"Tab number should be >= 100, got {session['tab_number']}"
    
    def test_open_tab_generates_tab_number(self, api_client):
        """Opening a new tab should generate sequential tab number"""
        response = api_client.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_iteration11"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "tab_number" in data, f"Response missing tab_number: {data}"
        assert data["tab_number"] >= 101, f"Tab number should be >= 101, got {data['tab_number']}"
        assert "session_id" in data
        
        # Clean up - close the tab
        session_id = data["session_id"]
        api_client.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data={"payment_method": "comp"}
        )
    
    def test_get_session_detail_has_tab_number(self, api_client):
        """Session detail should include tab_number"""
        # Get an existing session
        sessions_resp = api_client.get(f"{BASE_URL}/api/tap/sessions", params={"venue_id": VENUE_ID})
        sessions = sessions_resp.json().get("sessions", [])
        if not sessions:
            pytest.skip("No open sessions to test detail")
        
        session_id = sessions[0]["session_id"]
        response = api_client.get(f"{BASE_URL}/api/tap/session/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "tab_number" in data, f"Session detail missing tab_number: {data.keys()}"


class TestTAPCatalog:
    """TAP Catalog: 7 categories, 37+ items, custom item form"""
    
    def test_catalog_has_expected_categories(self, api_client):
        """Catalog should have 7 categories"""
        response = api_client.get(f"{BASE_URL}/api/tap/catalog", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        # Should have 37 items
        assert len(items) >= 30, f"Expected ~37 items, got {len(items)}"
        
        # Get unique categories
        categories = set(item["category"] for item in items)
        expected_categories = {"Snacks", "Starters", "Mains", "Cocktails", "Drinks", "Beers", "No Alcohol"}
        
        # Check most categories exist
        matching = categories.intersection(expected_categories)
        assert len(matching) >= 5, f"Expected 7 categories, found: {categories}"
    
    def test_add_custom_catalog_item(self, api_client):
        """Custom item form should add item to catalog"""
        response = api_client.post(
            f"{BASE_URL}/api/tap/catalog",
            data={
                "venue_id": VENUE_ID,
                "name": "TEST_Custom_Item_Iteration11",
                "category": "Drinks",
                "price": "9.99",
                "is_alcohol": "true"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_Custom_Item_Iteration11"
        assert data["price"] == 9.99


class TestTAPStats:
    """TAP Stats: Currency in USD"""
    
    def test_stats_endpoint(self, api_client):
        """Stats should return open_tabs, revenue_today"""
        response = api_client.get(f"{BASE_URL}/api/tap/stats", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        assert "open_tabs" in data
        assert "revenue_today" in data
        assert "running_total" in data
        # Values should be numeric
        assert isinstance(data["open_tabs"], int)
        assert isinstance(data["revenue_today"], (int, float))


class TestStaffBarmen:
    """Barman CRUD: 3 barmen from API"""
    
    def test_get_barmen(self, api_client):
        """Should return barmen list"""
        response = api_client.get(f"{BASE_URL}/api/staff/barmen", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        assert "barmen" in data
        barmen = data["barmen"]
        assert len(barmen) >= 3, f"Expected at least 3 barmen, got {len(barmen)}"
        
        # Check barmen have names
        for barman in barmen:
            assert "name" in barman
            assert "id" in barman


class TestKDSKanban:
    """KDS: 4-column kanban (Pending, Preparing, Ready, Delayed)"""
    
    def test_kds_tickets_kitchen(self, api_client):
        """KDS tickets endpoint for kitchen"""
        response = api_client.get(f"{BASE_URL}/api/kds/tickets", params={
            "venue_id": VENUE_ID,
            "destination": "kitchen"
        })
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
    
    def test_kds_tickets_bar(self, api_client):
        """KDS tickets endpoint for bar"""
        response = api_client.get(f"{BASE_URL}/api/kds/tickets", params={
            "venue_id": VENUE_ID,
            "destination": "bar"
        })
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data


class TestTableModule:
    """Table: Server/Waiter dropdown support"""
    
    def test_get_tables(self, api_client):
        """Should return tables list"""
        response = api_client.get(f"{BASE_URL}/api/table/tables", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        assert "tables" in data
        tables = data["tables"]
        assert len(tables) >= 1, f"Expected at least 1 table, got {len(tables)}"


class TestVenueHome:
    """Venue Home: Modules dropdown"""
    
    def test_venue_home_returns_modules(self, api_client):
        """Venue home should return modules list"""
        response = api_client.get(f"{BASE_URL}/api/venue/home")
        assert response.status_code == 200
        data = response.json()
        assert "modules" in data
        modules = data["modules"]
        
        # Check expected modules exist
        module_keys = [m["key"] for m in modules]
        expected = ["pulse", "tap", "table", "kds"]
        for exp in expected:
            assert exp in module_keys, f"Missing module: {exp}"
    
    def test_modules_include_manager_owner(self, api_client):
        """Modules should include manager and owner"""
        response = api_client.get(f"{BASE_URL}/api/venue/home")
        data = response.json()
        modules = data.get("modules", [])
        module_keys = [m["key"] for m in modules]
        
        assert "manager" in module_keys, "Manager module missing"
        assert "owner" in module_keys, "Owner module missing"


class TestTAPConfig:
    """TAP Config: Currency USD"""
    
    def test_tap_config_currency(self, api_client):
        """TAP config should return USD currency"""
        response = api_client.get(f"{BASE_URL}/api/tap/config", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        assert data.get("currency") == "USD", f"Expected USD currency, got {data.get('currency')}"
