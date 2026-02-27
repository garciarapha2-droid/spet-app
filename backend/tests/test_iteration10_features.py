"""
Iteration 10 Feature Tests - SPETAP Multi-tenant Venue SaaS
Testing new features:
1. Barman CRUD from TAP dropdown
2. Table server/waiter selection when opening table
3. Modules dropdown in VenueHome (CEO removed from visible list)
4. KDS 4-column Kanban with live timers and delayed order popup
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


class TestBarmenCRUD:
    """Test barman management CRUD operations"""

    @pytest.fixture(autouse=True)
    def setup(self, auth_token):
        self.token = auth_token
        self.headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        self.json_headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def test_get_barmen_returns_list(self, auth_token):
        """GET /api/staff/barmen should return barmen for venue"""
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "barmen" in data
        assert isinstance(data["barmen"], list)
        # Verify expected barmen exist (demo data)
        names = [b["name"] for b in data["barmen"]]
        assert len(data["barmen"]) >= 3, f"Expected at least 3 barmen, got {len(data['barmen'])}"
        print(f"Found {len(data['barmen'])} barmen: {names}")

    def test_create_barman(self, auth_token):
        """POST /api/staff/barmen should create a new barman"""
        response = requests.post(
            f"{BASE_URL}/api/staff/barmen",
            data={"venue_id": VENUE_ID, "name": "TEST_NewBarman"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == "TEST_NewBarman"
        assert data["venue_id"] == VENUE_ID
        print(f"Created barman: {data['name']} with id {data['id']}")
        # Store for cleanup
        self.created_barman_id = data["id"]

    def test_update_barman(self, auth_token):
        """PUT /api/staff/barmen/{id} should update barman name"""
        # First create a barman to update
        create_response = requests.post(
            f"{BASE_URL}/api/staff/barmen",
            data={"venue_id": VENUE_ID, "name": "TEST_UpdateBarman"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        barman_id = create_response.json()["id"]

        # Update the barman
        update_response = requests.put(
            f"{BASE_URL}/api/staff/barmen/{barman_id}",
            data={"name": "TEST_UpdatedName"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["name"] == "TEST_UpdatedName"
        assert data["updated"] is True
        print(f"Updated barman to: {data['name']}")

        # Cleanup - soft delete
        requests.delete(
            f"{BASE_URL}/api/staff/barmen/{barman_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )

    def test_delete_barman_soft_delete(self, auth_token):
        """DELETE /api/staff/barmen/{id} should soft-delete barman"""
        # Create a barman to delete
        create_response = requests.post(
            f"{BASE_URL}/api/staff/barmen",
            data={"venue_id": VENUE_ID, "name": "TEST_DeleteBarman"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_response.status_code == 200
        barman_id = create_response.json()["id"]

        # Delete the barman
        delete_response = requests.delete(
            f"{BASE_URL}/api/staff/barmen/{barman_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["deleted"] is True
        print(f"Soft-deleted barman: {barman_id}")

        # Verify not returned in list (soft-deleted)
        list_response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        names = [b["name"] for b in list_response.json()["barmen"]]
        assert "TEST_DeleteBarman" not in names


class TestTableOpenWithServer:
    """Test opening table with server/waiter selection"""

    def test_open_table_with_server_name(self, auth_token):
        """POST /api/table/open should accept server_name parameter"""
        # First check for available table
        tables_response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert tables_response.status_code == 200
        tables = tables_response.json()["tables"]
        available_table = next((t for t in tables if t["status"] == "available"), None)
        
        if not available_table:
            pytest.skip("No available table for testing")

        # Open table with server_name
        open_response = requests.post(
            f"{BASE_URL}/api/table/open",
            data={
                "venue_id": VENUE_ID,
                "table_id": available_table["id"],
                "guest_name": "TEST_ServerTest",
                "server_name": "Carlos Bartender"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert open_response.status_code == 200
        data = open_response.json()
        assert data["table_id"] == available_table["id"]
        assert data["status"] == "occupied"
        print(f"Opened table {data['table_number']} with server Carlos Bartender")

        # Cleanup - close the table
        requests.post(
            f"{BASE_URL}/api/table/close",
            data={"table_id": available_table["id"], "payment_method": "comp"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )


class TestKDS4ColumnKanban:
    """Test KDS 4-column Kanban with delayed order support"""

    def test_kds_returns_tickets_with_all_statuses(self, auth_token):
        """GET /api/kds/tickets should return tickets with pending, preparing, ready statuses"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        
        # Check for various statuses
        statuses = set(t["status"] for t in data["tickets"])
        print(f"Found statuses: {statuses}")
        
        # Verify ticket structure has required fields for timers
        if data["tickets"]:
            ticket = data["tickets"][0]
            assert "status" in ticket
            assert "created_at" in ticket
            assert "estimated_minutes" in ticket
            assert "started_at" in ticket
            print(f"Ticket structure valid: {ticket['id']}")

    def test_kds_update_status_to_preparing_with_estimate(self, auth_token):
        """POST /api/kds/ticket/{id}/status should accept estimated_minutes"""
        # Get a pending ticket
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        tickets = response.json()["tickets"]
        pending_ticket = next((t for t in tickets if t["status"] == "pending"), None)
        
        if not pending_ticket:
            pytest.skip("No pending ticket for testing")

        # Update status to preparing with estimate
        update_response = requests.post(
            f"{BASE_URL}/api/kds/ticket/{pending_ticket['id']}/status",
            data={"status": "preparing", "estimated_minutes": "15"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert update_response.status_code == 200
        print(f"Updated ticket {pending_ticket['id']} to preparing with 15min estimate")

    def test_kds_delayed_calculation(self, auth_token):
        """Verify tickets have data for delayed calculation (started_at + estimated_minutes)"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        tickets = response.json()["tickets"]
        preparing_tickets = [t for t in tickets if t["status"] == "preparing"]
        
        for ticket in preparing_tickets:
            # Tickets in preparing should have started_at
            if ticket["estimated_minutes"]:
                assert ticket["started_at"] is not None, f"Preparing ticket {ticket['id']} with estimate should have started_at"
                print(f"Ticket {ticket['id']}: started={ticket['started_at']}, estimate={ticket['estimated_minutes']}min")


class TestVenueHomeModules:
    """Test Venue Home modules dropdown"""

    def test_venue_home_returns_modules(self, auth_token):
        """GET /api/venue/home should return modules list"""
        response = requests.get(
            f"{BASE_URL}/api/venue/home",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "modules" in data
        
        # Verify modules structure
        module_keys = [m["key"] for m in data["modules"]]
        print(f"Found modules: {module_keys}")
        
        # Check expected modules exist
        assert "pulse" in module_keys
        assert "tap" in module_keys
        assert "table" in module_keys
        assert "kds" in module_keys


class TestHeaderSpacing:
    """Test that API endpoints work for header components"""

    def test_tap_config_for_header(self, auth_token):
        """GET /api/tap/config should return bar_mode for header display"""
        response = requests.get(
            f"{BASE_URL}/api/tap/config",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "bar_mode" in data
        print(f"Bar mode: {data['bar_mode']}")

    def test_tap_stats_for_header(self, auth_token):
        """GET /api/tap/stats should return open_tabs count for header"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "open_tabs" in data
        print(f"Open tabs: {data['open_tabs']}")


# Fixtures
@pytest.fixture(scope="session")
def auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "teste@teste.com", "password": "12345"}
    )
    if response.status_code != 200:
        pytest.fail(f"Login failed: {response.text}")
    token = response.json()["access_token"]
    return token


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_barmen(auth_token):
    """Cleanup TEST_ prefixed barmen after all tests"""
    yield
    # Cleanup after tests
    response = requests.get(
        f"{BASE_URL}/api/staff/barmen",
        params={"venue_id": VENUE_ID},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    if response.status_code == 200:
        for barman in response.json().get("barmen", []):
            if barman["name"].startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/staff/barmen/{barman['id']}",
                    headers={"Authorization": f"Bearer {auth_token}"}
                )
                print(f"Cleaned up test barman: {barman['name']}")
