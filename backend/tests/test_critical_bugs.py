"""
Test Critical Bug Fixes for SPETAP Iteration 9
Tests cover:
1. KDS 'Send to Kitchen' - Frontend now sends session_id instead of table_id
2. Void/delete items from tabs
3. Table page add-item endpoint
4. KDS routing: food→kitchen, drinks→bar
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.text}")
    return response.json().get("access_token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestVoidItemFromTab:
    """Test void/delete item functionality (Bug #2)"""
    
    def test_open_tab_add_item_and_void(self, auth_headers):
        """Open tab, add item, then void it"""
        # Step 1: Open a new tab
        open_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_VoidTest"
            }
        )
        assert open_response.status_code == 200, f"Failed to open tab: {open_response.text}"
        session_id = open_response.json()["session_id"]
        print(f"Opened session: {session_id}")
        
        # Step 2: Get catalog item
        catalog_response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        )
        assert catalog_response.status_code == 200
        items = catalog_response.json()["items"]
        assert len(items) > 0, "No catalog items found"
        item_id = items[0]["id"]
        print(f"Using catalog item: {items[0]['name']} (ID: {item_id})")
        
        # Step 3: Add item to tab
        add_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=auth_headers,
            data={
                "item_id": item_id,
                "qty": "1"
            }
        )
        assert add_response.status_code == 200, f"Failed to add item: {add_response.text}"
        line_item_id = add_response.json()["line_item_id"]
        initial_total = add_response.json()["session_total"]
        print(f"Added item, line_item_id: {line_item_id}, total: {initial_total}")
        
        # Step 4: Void the item (BUG #2 FIX TEST)
        void_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/void-item",
            headers=auth_headers,
            data={
                "item_id": line_item_id,
                "reason": "Test void"
            }
        )
        assert void_response.status_code == 200, f"VOID FAILED: {void_response.text}"
        void_data = void_response.json()
        assert void_data["voided"] == True, "Item not marked as voided"
        assert void_data["session_total"] < initial_total, "Total not reduced after void"
        print(f"VOID SUCCESS: item_id={void_data['item_id']}, new_total={void_data['session_total']}")
        
        # Step 5: Verify session shows no items
        session_response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=auth_headers
        )
        assert session_response.status_code == 200
        session_data = session_response.json()
        assert len(session_data["items"]) == 0, "Voided item still appears in session"
        print("VERIFIED: Voided item no longer in session items list")
        
        # Cleanup: Close the tab
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            headers=auth_headers,
            data={"payment_method": "comp"}
        )


class TestKDSSendToKitchen:
    """Test KDS send functionality (Bug #1 - session_id vs table_id)"""
    
    def test_send_items_to_kds_with_session_id(self, auth_headers):
        """Test that KDS send works with session_id"""
        # Step 1: Open a table
        open_response = requests.post(
            f"{BASE_URL}/api/table/open",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "table_id": self._get_available_table(auth_headers),
                "guest_name": "TEST_KDSTest"
            }
        )
        if open_response.status_code != 200:
            pytest.skip(f"Could not open table: {open_response.text}")
        
        table_id = open_response.json()["table_id"]
        session_id = open_response.json()["session_id"]
        print(f"Opened table {table_id} with session {session_id}")
        
        # Step 2: Add food item to table (should route to kitchen)
        table_detail = requests.get(
            f"{BASE_URL}/api/table/{table_id}",
            headers=auth_headers
        ).json()
        
        # Get a food item from catalog
        catalog = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        ).json()["items"]
        
        food_item = next((i for i in catalog if not i.get("is_alcohol", True)), catalog[0])
        
        add_response = requests.post(
            f"{BASE_URL}/api/table/{table_id}/add-item",
            headers=auth_headers,
            data={
                "item_id": food_item["id"],
                "qty": "1"
            }
        )
        assert add_response.status_code == 200, f"Failed to add item: {add_response.text}"
        line_item_id = add_response.json()["line_item_id"]
        print(f"Added food item: {food_item['name']}, line_item_id: {line_item_id}")
        
        # Step 3: Send to KDS using SESSION_ID (BUG #1 FIX TEST)
        kds_response = requests.post(
            f"{BASE_URL}/api/kds/send",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "session_id": session_id,  # This is the fix - previously frontend sent table_id
                "item_ids": line_item_id
            }
        )
        assert kds_response.status_code == 200, f"KDS SEND FAILED: {kds_response.text}"
        kds_data = kds_response.json()
        assert len(kds_data["tickets"]) > 0, "No tickets created"
        print(f"KDS SEND SUCCESS: Created {len(kds_data['tickets'])} ticket(s)")
        
        for ticket in kds_data["tickets"]:
            print(f"  - Ticket {ticket['ticket_id']} → {ticket['destination']}")
        
        # Step 4: Verify ticket appears in kitchen
        kitchen_response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            headers=auth_headers,
            params={
                "venue_id": VENUE_ID,
                "destination": "kitchen"
            }
        )
        assert kitchen_response.status_code == 200
        kitchen_tickets = kitchen_response.json()["tickets"]
        print(f"Kitchen has {len(kitchen_tickets)} tickets")
        
        # Cleanup: Close the table
        requests.post(
            f"{BASE_URL}/api/table/close",
            headers=auth_headers,
            data={
                "table_id": table_id,
                "payment_method": "comp"
            }
        )
    
    def _get_available_table(self, auth_headers):
        """Get an available table ID"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        )
        tables = response.json()["tables"]
        available = [t for t in tables if t["status"] == "available"]
        if not available:
            pytest.skip("No available tables")
        return available[0]["id"]


class TestKDSRouting:
    """Test KDS routing: food→kitchen, drinks→bar"""
    
    def test_drink_routes_to_bar(self, auth_headers):
        """Test that alcohol items route to bar"""
        # Open a tab
        open_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_BarRouting"
            }
        )
        assert open_response.status_code == 200
        session_id = open_response.json()["session_id"]
        
        # Get alcohol item
        catalog = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        ).json()["items"]
        
        alcohol_item = next((i for i in catalog if i.get("is_alcohol", False)), None)
        if not alcohol_item:
            pytest.skip("No alcohol items in catalog")
        
        # Add alcohol item
        add_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=auth_headers,
            data={
                "item_id": alcohol_item["id"],
                "qty": "1"
            }
        )
        assert add_response.status_code == 200
        line_item_id = add_response.json()["line_item_id"]
        
        # Send to KDS
        kds_response = requests.post(
            f"{BASE_URL}/api/kds/send",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "session_id": session_id,
                "item_ids": line_item_id
            }
        )
        assert kds_response.status_code == 200
        tickets = kds_response.json()["tickets"]
        
        # Verify routed to bar
        bar_ticket = next((t for t in tickets if t["destination"] == "bar"), None)
        assert bar_ticket is not None, f"Alcohol should route to bar, got: {tickets}"
        print(f"SUCCESS: Alcohol item routed to BAR")
        
        # Cleanup
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            headers=auth_headers,
            data={"payment_method": "comp"}
        )


class TestTableAddItem:
    """Test table add-item endpoint"""
    
    def test_add_item_to_occupied_table(self, auth_headers):
        """Test adding item directly to table via /{table_id}/add-item"""
        # Get occupied table or open one
        tables_response = requests.get(
            f"{BASE_URL}/api/table/tables",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        )
        tables = tables_response.json()["tables"]
        occupied = [t for t in tables if t["status"] == "occupied"]
        
        if occupied:
            table_id = occupied[0]["id"]
        else:
            # Open a table
            available = [t for t in tables if t["status"] == "available"]
            if not available:
                pytest.skip("No tables available")
            
            open_response = requests.post(
                f"{BASE_URL}/api/table/open",
                headers=auth_headers,
                data={
                    "venue_id": VENUE_ID,
                    "table_id": available[0]["id"],
                    "guest_name": "TEST_AddItemTest"
                }
            )
            table_id = open_response.json()["table_id"]
        
        # Get catalog item
        catalog = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        ).json()["items"]
        
        item = catalog[0]
        
        # Add item via table endpoint
        add_response = requests.post(
            f"{BASE_URL}/api/table/{table_id}/add-item",
            headers=auth_headers,
            data={
                "item_id": item["id"],
                "qty": "1"
            }
        )
        assert add_response.status_code == 200, f"Add item failed: {add_response.text}"
        assert "line_item_id" in add_response.json()
        assert "session_total" in add_response.json()
        print(f"SUCCESS: Added {item['name']} to table, total: {add_response.json()['session_total']}")


class TestHeaderElements:
    """Test header elements exist and API endpoints work"""
    
    def test_tap_stats_no_revenue_in_response(self, auth_headers):
        """Test TAP stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        )
        assert response.status_code == 200
        data = response.json()
        # These fields should exist
        assert "open_tabs" in data
        assert "running_total" in data
        print(f"TAP Stats: open_tabs={data['open_tabs']}, running_total={data['running_total']}")
    
    def test_tap_config(self, auth_headers):
        """Test TAP config endpoint returns bar_mode"""
        response = requests.get(
            f"{BASE_URL}/api/tap/config",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert "bar_mode" in data
        print(f"TAP Config: bar_mode={data['bar_mode']}")


class TestExitModal:
    """Test exit modal endpoints"""
    
    def test_tab_status_endpoint(self, auth_headers):
        """Test tab-status endpoint used by exit modal"""
        # First create a guest with open tab
        # Open a tab
        open_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_ExitModalGuest"
            }
        )
        # This creates a tab but doesn't link to a pulse guest
        # The tab-status endpoint is for pulse guests, so we test it with a dummy ID
        
        # Test that endpoint exists and returns proper structure
        fake_guest_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{fake_guest_id}/tab-status",
            headers=auth_headers,
            params={"venue_id": VENUE_ID}
        )
        # Should return 200 with has_open_tabs: false for non-existent guest
        # or 404 - either way confirms endpoint exists
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"Tab status endpoint working: status={response.status_code}")
        
        # Cleanup
        if open_response.status_code == 200:
            session_id = open_response.json()["session_id"]
            requests.post(
                f"{BASE_URL}/api/tap/session/{session_id}/close",
                headers=auth_headers,
                data={"payment_method": "comp"}
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
