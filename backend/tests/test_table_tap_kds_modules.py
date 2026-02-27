"""
Test Suite: Table, TAP, and KDS Modules
Tests the complete flow for table management, TAP sessions, and kitchen display system.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for all tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


# ─── AUTH TESTS ──────────────────────────────────────────────────────────────

class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """POST /api/auth/login returns access_token and user info"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["next"]["route"] == "/pulse/entry"
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong password returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401


# ─── TABLE MODULE TESTS ──────────────────────────────────────────────────────

class TestTableModule:
    """Table management endpoint tests"""
    
    def test_list_tables(self, auth_headers):
        """GET /api/table/tables returns 9 tables for the venue"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "tables" in data
        assert "total" in data
        assert data["total"] == 9, f"Expected 9 tables, got {data['total']}"
        
        # Verify table structure
        if data["tables"]:
            table = data["tables"][0]
            assert "id" in table
            assert "table_number" in table
            assert "zone" in table
            assert "capacity" in table
            assert "status" in table
    
    def test_list_tables_requires_auth(self):
        """GET /api/table/tables without auth returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID}
        )
        assert response.status_code == 401
    
    def test_open_close_table_flow(self, auth_headers):
        """Full table open → get detail → close flow"""
        # 1. List tables and find an available one
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        tables = response.json()["tables"]
        available_tables = [t for t in tables if t["status"] == "available"]
        
        if not available_tables:
            pytest.skip("No available tables for testing")
        
        test_table = available_tables[0]
        table_id = test_table["id"]
        
        # 2. Open the table (FormData)
        open_data = {
            "venue_id": VENUE_ID,
            "table_id": table_id,
            "guest_name": "TEST_TableFlowGuest",
            "covers": "2"
        }
        response = requests.post(
            f"{BASE_URL}/api/table/open",
            data=open_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Open table failed: {response.text}"
        open_result = response.json()
        assert open_result["status"] == "occupied"
        assert open_result["table_id"] == table_id
        session_id = open_result["session_id"]
        
        # 3. Get table detail
        response = requests.get(
            f"{BASE_URL}/api/table/{table_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        detail = response.json()
        assert detail["status"] == "occupied"
        assert detail["session"] is not None
        assert detail["session"]["guest_name"] == "TEST_TableFlowGuest"
        
        # 4. Close the table (FormData)
        close_data = {
            "table_id": table_id,
            "payment_method": "card"
        }
        response = requests.post(
            f"{BASE_URL}/api/table/close",
            data=close_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Close table failed: {response.text}"
        close_result = response.json()
        assert close_result["status"] == "available"
        assert close_result["payment_method"] == "card"
        
        # 5. Verify table is now available
        response = requests.get(
            f"{BASE_URL}/api/table/{table_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "available"
        assert response.json()["session"] is None
    
    def test_open_already_occupied_table_fails(self, auth_headers):
        """POST /api/table/open on occupied table returns 400"""
        # Find an available table first
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        tables = response.json()["tables"]
        available_tables = [t for t in tables if t["status"] == "available"]
        
        if not available_tables:
            pytest.skip("No available tables for testing")
        
        test_table = available_tables[0]
        table_id = test_table["id"]
        
        # Open the table
        open_data = {"venue_id": VENUE_ID, "table_id": table_id, "guest_name": "TEST_OccupiedTest"}
        response = requests.post(f"{BASE_URL}/api/table/open", data=open_data, headers=auth_headers)
        assert response.status_code == 200
        
        try:
            # Try opening again - should fail
            response = requests.post(f"{BASE_URL}/api/table/open", data=open_data, headers=auth_headers)
            assert response.status_code == 400
            assert "occupied" in response.json()["detail"].lower()
        finally:
            # Clean up - close the table
            close_data = {"table_id": table_id, "payment_method": "card"}
            requests.post(f"{BASE_URL}/api/table/close", data=close_data, headers=auth_headers)
    
    def test_get_nonexistent_table(self, auth_headers):
        """GET /api/table/{invalid_id} returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/table/00000000-0000-0000-0000-000000000000",
            headers=auth_headers
        )
        assert response.status_code == 404


# ─── TAP MODULE TESTS ────────────────────────────────────────────────────────

class TestTapModule:
    """TAP session and item management tests"""
    
    def test_get_catalog(self, auth_headers):
        """GET /api/tap/catalog returns 12 items"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 12, f"Expected 12 items, got {len(data['items'])}"
        
        # Verify item structure
        item = data["items"][0]
        assert "id" in item
        assert "name" in item
        assert "price" in item
        assert "category" in item
        assert "is_alcohol" in item
    
    def test_get_stats(self, auth_headers):
        """GET /api/tap/stats returns stats object"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "open_tabs" in data
        assert "running_total" in data
        assert "closed_today" in data
        assert "revenue_today" in data
    
    def test_get_config(self, auth_headers):
        """GET /api/tap/config returns venue config"""
        response = requests.get(
            f"{BASE_URL}/api/tap/config",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "venue_id" in data
        assert "bar_mode" in data
    
    def test_full_tap_session_flow(self, auth_headers):
        """Full TAP flow: open session → add items → close session"""
        # 1. Open session
        open_data = {
            "venue_id": VENUE_ID,
            "guest_name": "TEST_TapFlowGuest",
            "session_type": "tap"
        }
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=open_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Open session failed: {response.text}"
        session = response.json()
        session_id = session["session_id"]
        assert session["guest_name"] == "TEST_TapFlowGuest"
        assert session["status"] == "open"
        
        # 2. Get catalog and pick an item
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        catalog = response.json()["items"]
        test_item = catalog[0]  # Pick first item
        
        # 3. Add item to session
        add_data = {
            "item_id": test_item["id"],
            "qty": "2"
        }
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            data=add_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Add item failed: {response.text}"
        add_result = response.json()
        assert add_result["name"] == test_item["name"]
        assert add_result["qty"] == 2
        expected_total = test_item["price"] * 2
        assert add_result["line_total"] == expected_total
        
        # 4. Get session details
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        detail = response.json()
        assert detail["status"] == "open"
        assert len(detail["items"]) == 1
        assert detail["total"] == expected_total
        
        # 5. Close session
        close_data = {"payment_method": "card"}
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data=close_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Close session failed: {response.text}"
        close_result = response.json()
        assert close_result["status"] == "closed"
        assert close_result["total"] == expected_total
        assert close_result["payment_method"] == "card"
        
        # 6. Verify session is closed
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "closed"
    
    def test_list_sessions(self, auth_headers):
        """GET /api/tap/sessions returns sessions array"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID, "status": "open"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
    
    def test_add_to_closed_session_fails(self, auth_headers):
        """POST /api/tap/session/{closed_id}/add returns 400"""
        # Open and immediately close a session
        open_data = {"venue_id": VENUE_ID, "guest_name": "TEST_ClosedSessionTest"}
        response = requests.post(f"{BASE_URL}/api/tap/session/open", data=open_data, headers=auth_headers)
        session_id = response.json()["session_id"]
        
        close_data = {"payment_method": "card"}
        requests.post(f"{BASE_URL}/api/tap/session/{session_id}/close", data=close_data, headers=auth_headers)
        
        # Try adding to closed session
        response = requests.get(f"{BASE_URL}/api/tap/catalog", params={"venue_id": VENUE_ID}, headers=auth_headers)
        item = response.json()["items"][0]
        
        add_data = {"item_id": item["id"], "qty": "1"}
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            data=add_data,
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "closed" in response.json()["detail"].lower()


# ─── KDS MODULE TESTS ────────────────────────────────────────────────────────

class TestKdsModule:
    """Kitchen Display System tests"""
    
    def test_list_kitchen_tickets(self, auth_headers):
        """GET /api/kds/tickets with destination=kitchen returns tickets array"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        assert "total" in data
    
    def test_list_bar_tickets(self, auth_headers):
        """GET /api/kds/tickets with destination=bar returns tickets array"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "bar"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        assert "total" in data
    
    def test_kds_requires_auth(self):
        """GET /api/kds/tickets without auth returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"}
        )
        assert response.status_code == 401
    
    def test_full_kds_flow(self, auth_headers):
        """Full KDS flow: open table → add items → send to KDS → update status"""
        # 1. Get available table
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        tables = response.json()["tables"]
        available = [t for t in tables if t["status"] == "available"]
        if not available:
            pytest.skip("No available tables for KDS test")
        
        table_id = available[0]["id"]
        
        # 2. Open table
        open_data = {"venue_id": VENUE_ID, "table_id": table_id, "guest_name": "TEST_KdsFlowGuest"}
        response = requests.post(f"{BASE_URL}/api/table/open", data=open_data, headers=auth_headers)
        assert response.status_code == 200
        session_id = response.json()["session_id"]
        
        try:
            # 3. Get catalog - pick food item and drink item
            response = requests.get(
                f"{BASE_URL}/api/tap/catalog",
                params={"venue_id": VENUE_ID},
                headers=auth_headers
            )
            catalog = response.json()["items"]
            food_items = [i for i in catalog if not i["is_alcohol"]]
            drink_items = [i for i in catalog if i["is_alcohol"]]
            
            if not food_items or not drink_items:
                pytest.skip("Need both food and drink items in catalog")
            
            food_item = food_items[0]
            drink_item = drink_items[0]
            
            # 4. Add food item
            add_data = {"item_id": food_item["id"], "qty": "1"}
            response = requests.post(
                f"{BASE_URL}/api/tap/session/{session_id}/add",
                data=add_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            food_line_id = response.json()["line_item_id"]
            
            # 5. Add drink item
            add_data = {"item_id": drink_item["id"], "qty": "1"}
            response = requests.post(
                f"{BASE_URL}/api/tap/session/{session_id}/add",
                data=add_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            drink_line_id = response.json()["line_item_id"]
            
            # 6. Send to KDS - should route food to kitchen and drink to bar
            send_data = {
                "venue_id": VENUE_ID,
                "session_id": session_id,
                "item_ids": f"{food_line_id},{drink_line_id}"
            }
            response = requests.post(
                f"{BASE_URL}/api/kds/send",
                data=send_data,
                headers=auth_headers
            )
            assert response.status_code == 200, f"Send to KDS failed: {response.text}"
            tickets = response.json()["tickets"]
            assert len(tickets) == 2, f"Expected 2 tickets (kitchen+bar), got {len(tickets)}"
            
            # Verify routing
            destinations = [t["destination"] for t in tickets]
            assert "kitchen" in destinations, "Food should route to kitchen"
            assert "bar" in destinations, "Drink should route to bar"
            
            # 7. Get kitchen tickets and find our ticket
            response = requests.get(
                f"{BASE_URL}/api/kds/tickets",
                params={"venue_id": VENUE_ID, "destination": "kitchen"},
                headers=auth_headers
            )
            kitchen_tickets = response.json()["tickets"]
            our_kitchen_ticket = next((t for t in kitchen_tickets if t["session_id"] == session_id), None)
            assert our_kitchen_ticket is not None, "Should find our kitchen ticket"
            
            kitchen_ticket_id = our_kitchen_ticket["id"]
            assert our_kitchen_ticket["status"] == "pending"
            
            # 8. Update status: pending → preparing
            status_data = {"status": "preparing"}
            response = requests.post(
                f"{BASE_URL}/api/kds/ticket/{kitchen_ticket_id}/status",
                data=status_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            assert response.json()["status"] == "preparing"
            
            # 9. Update status: preparing → ready
            status_data = {"status": "ready"}
            response = requests.post(
                f"{BASE_URL}/api/kds/ticket/{kitchen_ticket_id}/status",
                data=status_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            assert response.json()["status"] == "ready"
            
            # 10. Update status: ready → completed
            status_data = {"status": "completed"}
            response = requests.post(
                f"{BASE_URL}/api/kds/ticket/{kitchen_ticket_id}/status",
                data=status_data,
                headers=auth_headers
            )
            assert response.status_code == 200
            assert response.json()["status"] == "completed"
            
            # 11. Verify completed ticket is excluded from default list
            response = requests.get(
                f"{BASE_URL}/api/kds/tickets",
                params={"venue_id": VENUE_ID, "destination": "kitchen"},
                headers=auth_headers
            )
            kitchen_tickets = response.json()["tickets"]
            completed_in_list = any(t["id"] == kitchen_ticket_id for t in kitchen_tickets)
            assert not completed_in_list, "Completed tickets should be excluded from default list"
            
        finally:
            # Clean up - close the table
            close_data = {"table_id": table_id, "payment_method": "card"}
            requests.post(f"{BASE_URL}/api/table/close", data=close_data, headers=auth_headers)
    
    def test_kds_entitlement_check(self, auth_headers):
        """KDS endpoints check user permissions (kds:true required)"""
        # The test user has kds=true, so this should work
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"},
            headers=auth_headers
        )
        assert response.status_code == 200  # User has kds permission
    
    def test_send_empty_items_fails(self, auth_headers):
        """POST /api/kds/send with empty item_ids returns 400"""
        # Create a session first
        open_data = {"venue_id": VENUE_ID, "guest_name": "TEST_EmptyKdsTest"}
        response = requests.post(f"{BASE_URL}/api/tap/session/open", data=open_data, headers=auth_headers)
        session_id = response.json()["session_id"]
        
        try:
            send_data = {"venue_id": VENUE_ID, "session_id": session_id, "item_ids": ""}
            response = requests.post(
                f"{BASE_URL}/api/kds/send",
                data=send_data,
                headers=auth_headers
            )
            assert response.status_code == 400
        finally:
            # Clean up
            close_data = {"payment_method": "card"}
            requests.post(f"{BASE_URL}/api/tap/session/{session_id}/close", data=close_data, headers=auth_headers)
    
    def test_update_invalid_status_fails(self, auth_headers):
        """POST /api/kds/ticket/{id}/status with invalid status returns 400"""
        # First need to create a ticket
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        tables = response.json()["tables"]
        available = [t for t in tables if t["status"] == "available"]
        if not available:
            pytest.skip("No available tables")
        
        table_id = available[0]["id"]
        
        # Open table
        open_data = {"venue_id": VENUE_ID, "table_id": table_id, "guest_name": "TEST_InvalidStatusTest"}
        response = requests.post(f"{BASE_URL}/api/table/open", data=open_data, headers=auth_headers)
        session_id = response.json()["session_id"]
        
        try:
            # Add an item
            response = requests.get(f"{BASE_URL}/api/tap/catalog", params={"venue_id": VENUE_ID}, headers=auth_headers)
            item = response.json()["items"][0]
            
            add_data = {"item_id": item["id"], "qty": "1"}
            response = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/add", data=add_data, headers=auth_headers)
            line_id = response.json()["line_item_id"]
            
            # Send to KDS
            send_data = {"venue_id": VENUE_ID, "session_id": session_id, "item_ids": line_id}
            response = requests.post(f"{BASE_URL}/api/kds/send", data=send_data, headers=auth_headers)
            ticket_id = response.json()["tickets"][0]["ticket_id"]
            
            # Try invalid status
            status_data = {"status": "invalid_status"}
            response = requests.post(
                f"{BASE_URL}/api/kds/ticket/{ticket_id}/status",
                data=status_data,
                headers=auth_headers
            )
            assert response.status_code == 400
            
        finally:
            # Clean up
            close_data = {"table_id": table_id, "payment_method": "card"}
            requests.post(f"{BASE_URL}/api/table/close", data=close_data, headers=auth_headers)


# ─── REGRESSION TESTS (PULSE) ────────────────────────────────────────────────

class TestPulseRegression:
    """Basic regression tests for Pulse module"""
    
    def test_pulse_entry_today(self, auth_headers):
        """GET /api/pulse/entries/today returns entries array"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
    
    def test_pulse_inside(self, auth_headers):
        """GET /api/pulse/inside returns guests array"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "guests" in data
    
    def test_pulse_venue_config(self, auth_headers):
        """GET /api/pulse/venue/config returns venue config"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/venue/config",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
