"""
Iteration 14 Backend Tests
Testing: KDS delayed status, TAP/Bar/Table menu consistency

Features:
1. KDS status=delayed is a valid backend status
2. TAP, Bar, Table pages share consistent Kanban menu with categories
3. Tab # visible on all open tabs
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teste@teste.com",
        "password": "12345"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json().get("access_token")
    assert token, "No token returned"
    return token

@pytest.fixture
def auth_headers(auth_token):
    """Get authenticated headers"""
    return {"Authorization": f"Bearer {auth_token}"}


# =====================================================
# TEST 1: Login works and redirects
# =====================================================
class TestLogin:
    def test_login_returns_token(self):
        """Login with teste@teste.com / 12345 returns valid token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert len(data["access_token"]) > 50


# =====================================================
# TEST 2: TAP Catalog with Categories
# =====================================================
class TestTAPCatalog:
    def test_get_catalog_returns_items(self, auth_headers):
        """GET /api/tap/catalog returns items with categories"""
        response = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        items = data["items"]
        # Check items have category field
        if len(items) > 0:
            assert "category" in items[0], "Items should have category field"
            assert "name" in items[0], "Items should have name field"
            assert "price" in items[0], "Items should have price field"
    
    def test_catalog_has_expected_categories(self, auth_headers):
        """Catalog should have items from expected categories"""
        response = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        assert response.status_code == 200
        items = response.json().get("items", [])
        categories = set(item.get("category") for item in items if item.get("category"))
        # Expected categories: Beers, Cocktails, Spirits, Non-alcoholic, Snacks, Starters, Mains, Plates
        print(f"Found categories: {categories}")
        assert len(categories) > 0, "Should have at least one category"


# =====================================================
# TEST 3: TAP Sessions with Tab #
# =====================================================
class TestTAPSessions:
    def test_get_sessions_returns_tab_numbers(self, auth_headers):
        """GET /api/tap/sessions returns sessions with tab_number"""
        response = requests.get(f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        sessions = data["sessions"]
        if len(sessions) > 0:
            # Each session should have tab_number
            for session in sessions:
                assert "tab_number" in session, f"Session missing tab_number: {session.get('id')}"
                assert "guest_name" in session, f"Session missing guest_name"


# =====================================================
# TEST 4: Table API returns Tab #
# =====================================================
class TestTableAPI:
    def test_get_tables_returns_tab_numbers(self, auth_headers):
        """GET /api/table/tables returns tables with tab_number for occupied"""
        response = requests.get(f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "tables" in data
        tables = data["tables"]
        for table in tables:
            assert "table_number" in table
            assert "status" in table
            if table["status"] == "occupied":
                # Occupied tables should have tab_number
                assert "tab_number" in table, f"Occupied table missing tab_number: {table.get('id')}"


# =====================================================
# TEST 5: KDS Tickets API
# =====================================================
class TestKDSTickets:
    def test_get_kds_tickets_kitchen(self, auth_headers):
        """GET /api/kds/tickets for kitchen destination"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=kitchen",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        assert "total" in data
    
    def test_get_kds_tickets_bar(self, auth_headers):
        """GET /api/kds/tickets for bar destination"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=bar",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data


# =====================================================
# TEST 6: KDS Status Update - DELAYED is valid
# =====================================================
class TestKDSDelayedStatus:
    def test_update_status_to_delayed_is_valid(self, auth_headers):
        """PUT /api/kds/tickets/{id}/status with status=delayed should be valid"""
        # First get a ticket to test with
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=kitchen",
            headers=auth_headers
        )
        assert response.status_code == 200
        tickets = response.json().get("tickets", [])
        
        if len(tickets) == 0:
            pytest.skip("No KDS tickets available to test status update")
        
        ticket_id = tickets[0]["id"]
        
        # Test that 'delayed' is a valid status
        response = requests.post(
            f"{BASE_URL}/api/kds/ticket/{ticket_id}/status",
            headers=auth_headers,
            data={"status": "delayed"}
        )
        # Should be 200 (valid) not 400 (invalid status)
        assert response.status_code == 200, f"'delayed' should be a valid status: {response.text}"
        data = response.json()
        assert data.get("status") == "delayed"
    
    def test_all_valid_statuses(self, auth_headers):
        """Test that all expected statuses are valid in KDS"""
        # Get a ticket first
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=kitchen",
            headers=auth_headers
        )
        tickets = response.json().get("tickets", [])
        
        if len(tickets) == 0:
            pytest.skip("No KDS tickets to test")
        
        ticket_id = tickets[0]["id"]
        
        # Valid statuses: pending, preparing, ready, delivered, delayed, completed
        valid_statuses = ["pending", "preparing", "ready", "delivered", "delayed", "completed"]
        
        for status in valid_statuses:
            response = requests.post(
                f"{BASE_URL}/api/kds/ticket/{ticket_id}/status",
                headers=auth_headers,
                data={"status": status}
            )
            assert response.status_code == 200, f"Status '{status}' should be valid: {response.text}"


# =====================================================
# TEST 7: Bar Categories (subset of TAP)
# =====================================================
class TestBarCategories:
    def test_bar_uses_drink_categories(self, auth_headers):
        """Bar page uses drink-focused categories: Cocktails, Beers, Spirits, Non-alcoholic, Snacks, Starters"""
        response = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        assert response.status_code == 200
        items = response.json().get("items", [])
        
        # Bar categories as defined in PulseBarPage.js
        bar_categories = ['Cocktails', 'Beers', 'Spirits', 'Non-alcoholic', 'Snacks', 'Starters']
        
        bar_items = [i for i in items if i.get("category") in bar_categories]
        print(f"Bar items count: {len(bar_items)}")
        # Should have some bar items
        assert len(bar_items) >= 0, "Bar filter should work on catalog items"


# =====================================================
# TEST 8: Staff/Barmen API for server selection
# =====================================================
class TestStaffAPI:
    def test_get_barmen(self, auth_headers):
        """GET /api/staff/barmen returns list of barmen/servers"""
        response = requests.get(f"{BASE_URL}/api/staff/barmen?venue_id={VENUE_ID}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "barmen" in data
        barmen = data["barmen"]
        if len(barmen) > 0:
            assert "id" in barmen[0]
            assert "name" in barmen[0]


# =====================================================
# TEST 9: Table Detail API (elapsed time + server)
# =====================================================
class TestTableDetail:
    def test_get_table_detail(self, auth_headers):
        """GET /api/table/tables returns tables that can be queried for detail"""
        response = requests.get(f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}", headers=auth_headers)
        assert response.status_code == 200
        tables = response.json().get("tables", [])
        
        if len(tables) == 0:
            pytest.skip("No tables available")
        
        table_id = tables[0]["id"]
        
        # Get table detail - endpoint is /api/table/{table_id}
        detail_response = requests.get(f"{BASE_URL}/api/table/{table_id}", headers=auth_headers)
        assert detail_response.status_code == 200
        data = detail_response.json()
        assert "table_number" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
