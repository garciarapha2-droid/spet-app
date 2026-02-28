"""
Iteration 25: Demo Tables + Non-Regression Testing

Tests:
1. Login with teste@teste.com / 12345
2. GET /api/table/tables returns 8 tables
3. 3 tables occupied (Table #2, #3, #7) with guest names and tab numbers
4. 5 tables available (Table #1, #4, #5, #6, #8)
5. Owner Dashboard view switcher works (Business/Venue/Events)
6. Owner People & Ops drill-down works
7. Manager Guests sorted by spend with profile modal
8. Home page event preview (non-regression)
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
    """Get auth token for all tests."""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    token = data.get("access_token")
    assert token, "No access_token in response"
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


class TestLogin:
    """Test login functionality."""
    
    def test_login_success(self):
        """Login with teste@teste.com / 12345 works."""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("email") == TEST_EMAIL


class TestDemoTables:
    """Test demo table data - Primary focus of this iteration."""
    
    def test_get_tables_returns_8_tables(self, auth_headers):
        """GET /api/table/tables returns 8 tables with demo data."""
        response = requests.get(
            f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("total") == 8, f"Expected 8 tables, got {data.get('total')}"
        assert len(data.get("tables", [])) == 8
    
    def test_occupied_tables_have_correct_data(self, auth_headers):
        """3 occupied tables: Table #2 (Maria Santos), #3 (Ricardo Almeida), #7 (Fernando VIP)."""
        response = requests.get(
            f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        tables = response.json().get("tables", [])
        
        occupied = [t for t in tables if t["status"] == "occupied"]
        assert len(occupied) == 3, f"Expected 3 occupied tables, got {len(occupied)}"
        
        # Check Table #2 - Maria Santos
        table2 = next((t for t in tables if t["table_number"] == "2"), None)
        assert table2, "Table #2 not found"
        assert table2["status"] == "occupied"
        assert table2["session_guest"] == "Maria Santos"
        assert table2["tab_number"] == 201
        assert table2["server_name"] == "Carlos Silva"
        
        # Check Table #3 - Ricardo Almeida
        table3 = next((t for t in tables if t["table_number"] == "3"), None)
        assert table3, "Table #3 not found"
        assert table3["status"] == "occupied"
        assert table3["session_guest"] == "Ricardo Almeida"
        assert table3["tab_number"] == 305
        assert table3["server_name"] == "Ana Perez"
        
        # Check Table #7 - Fernando VIP
        table7 = next((t for t in tables if t["table_number"] == "7"), None)
        assert table7, "Table #7 not found"
        assert table7["status"] == "occupied"
        assert table7["session_guest"] == "Fernando VIP"
        assert table7["tab_number"] == 701
        assert table7["server_name"] == "Marco Rossi"
    
    def test_available_tables(self, auth_headers):
        """5 tables are available: Table #1, #4, #5, #6, #8."""
        response = requests.get(
            f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        tables = response.json().get("tables", [])
        
        available = [t for t in tables if t["status"] == "available"]
        assert len(available) == 5, f"Expected 5 available tables, got {len(available)}"
        
        available_numbers = sorted([t["table_number"] for t in available])
        expected_available = ["1", "4", "5", "6", "8"]
        assert available_numbers == expected_available, f"Expected available tables {expected_available}, got {available_numbers}"
    
    def test_get_table_detail_occupied(self, auth_headers):
        """GET table detail for occupied table shows session info."""
        # First get all tables to find an occupied one
        response = requests.get(
            f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        tables = response.json().get("tables", [])
        table2 = next((t for t in tables if t["table_number"] == "2"), None)
        
        # Get detail
        detail_response = requests.get(
            f"{BASE_URL}/api/table/{table2['id']}",
            headers=auth_headers
        )
        assert detail_response.status_code == 200
        detail = detail_response.json()
        
        assert detail["status"] == "occupied"
        assert detail["session"] is not None
        assert detail["session"]["guest_name"] == "Maria Santos"
        assert detail["session"]["tab_number"] == 201
        assert detail["session"]["server_name"] == "Carlos Silva"


class TestOwnerDashboard:
    """Non-regression: Owner Dashboard view switcher still works."""
    
    def test_owner_dashboard_business_view(self, auth_headers):
        """GET /api/owner/dashboard?view=business returns KPIs."""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard?view=business",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "kpis" in data
        kpis = data["kpis"]
        assert "revenue_today" in kpis
        assert "revenue_mtd" in kpis
    
    def test_owner_dashboard_venue_view(self, auth_headers):
        """GET /api/owner/dashboard?view=venue returns per-venue data."""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard?view=venue",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "venues" in data
    
    def test_owner_dashboard_events_view(self, auth_headers):
        """GET /api/owner/dashboard?view=events returns per-event data."""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard?view=events",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "events" in data


class TestOwnerPeopleOps:
    """Non-regression: Owner People & Ops clickable cards with drill-down."""
    
    def test_owner_people_returns_venues(self, auth_headers):
        """GET /api/owner/people returns venues array."""
        response = requests.get(
            f"{BASE_URL}/api/owner/people",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "venues" in data
        assert isinstance(data["venues"], list)
    
    def test_owner_venue_staff_drilldown(self, auth_headers):
        """GET /api/owner/people/{venue_id}/staff returns staff list."""
        response = requests.get(
            f"{BASE_URL}/api/owner/people/{VENUE_ID}/staff",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "staff" in data


class TestManagerGuests:
    """Non-regression: Manager Guests sorted by spend with profile modal."""
    
    def test_manager_guests_sorted_by_spend(self, auth_headers):
        """GET /api/manager/guests returns guests sorted by spend_total desc."""
        response = requests.get(
            f"{BASE_URL}/api/manager/guests?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "guests" in data
        guests = data["guests"]
        
        # Verify sorted by spend_total descending
        if len(guests) > 1:
            for i in range(len(guests) - 1):
                assert guests[i].get("spend_total", 0) >= guests[i + 1].get("spend_total", 0), \
                    f"Guests not sorted by spend: {guests[i]['spend_total']} < {guests[i+1]['spend_total']}"


class TestCatalogItems:
    """Non-regression: Catalog items display in center column."""
    
    def test_get_catalog_returns_items(self, auth_headers):
        """GET /api/tap/catalog returns catalog items."""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        items = data["items"]
        assert len(items) > 0, "No catalog items returned"
        
        # Check categories exist
        categories = set(item.get("category") for item in items)
        # At least some of: Beers, Cocktails, Spirits, etc.
        assert len(categories) > 0


class TestHomePageEvents:
    """Non-regression: Home page shows active events."""
    
    def test_venue_events_list(self, auth_headers):
        """GET /api/venue/events returns venue events."""
        response = requests.get(
            f"{BASE_URL}/api/venue/events?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Just ensure the endpoint works
        assert isinstance(data, dict)


class TestHealthCheck:
    """Basic API health check."""
    
    def test_health_endpoint(self):
        """GET /api/health returns healthy status."""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
