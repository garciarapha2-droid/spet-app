"""
Iteration 55 Tests: ID Verification Flow and Item Modifier Extras with Pricing

Test cases:
1. TABLE flow: Open table → add alcohol item → verify ID → item added
2. TABLE flow: After ID verification, subsequent alcohol items add directly
3. TAP flow: Age verification for alcohol items
4. Item Customize Modal: Add extras with prices (name + price)
5. Backend API: PUT /api/tap/session/{sid}/item/{iid} recalculates line_total with extras
"""
import pytest
import requests
import os
import uuid
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://iphone-ux-redesign.preview.emergentagent.com').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


class TestAuthAndSetup:
    """Authentication and basic setup tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for CEO user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "garcia.rapha2@gmail.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        """Create authenticated session"""
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session

    def test_health_check(self):
        """Test health endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health check passed")

    def test_get_catalog_has_alcohol_items(self, api_client):
        """Verify catalog contains alcohol items for testing"""
        response = api_client.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}")
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        alcohol_items = [i for i in items if i.get("is_alcohol")]
        assert len(alcohol_items) > 0, "No alcohol items in catalog for testing"
        
        # Find beers and cocktails
        beers = [i for i in alcohol_items if i.get("category") == "Beers"]
        cocktails = [i for i in alcohol_items if i.get("category") == "Cocktails"]
        
        print(f"✅ Found {len(alcohol_items)} alcohol items: {len(beers)} beers, {len(cocktails)} cocktails")
        return alcohol_items[0]  # Return first alcohol item for later tests


class TestTableIDVerificationFlow:
    """Test TABLE: Complete ID verification flow"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "garcia.rapha2@gmail.com",
            "password": "12345"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def alcohol_item(self, api_client):
        """Get an alcohol item from catalog"""
        response = api_client.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}")
        items = response.json().get("items", [])
        alcohol = [i for i in items if i.get("is_alcohol")]
        assert len(alcohol) > 0, "No alcohol items for testing"
        return alcohol[0]
    
    @pytest.fixture(scope="class")
    def barmen(self, api_client):
        """Get barmen list"""
        response = api_client.get(f"{BASE_URL}/api/staff/barmen?venue_id={VENUE_ID}")
        assert response.status_code == 200
        barmen = response.json().get("barmen", [])
        assert len(barmen) > 0, "No barmen for testing"
        return barmen[0]
    
    def test_01_open_available_table(self, api_client, barmen):
        """Open an available table and create a session"""
        # Get available tables
        response = api_client.get(f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}")
        assert response.status_code == 200
        tables = response.json().get("tables", [])
        
        available_tables = [t for t in tables if t.get("status") == "available"]
        assert len(available_tables) > 0, "No available tables"
        
        table = available_tables[0]
        table_id = table["id"]
        
        # Open the table using multipart form data
        files = {
            'venue_id': (None, VENUE_ID),
            'table_id': (None, table_id),
            'guest_name': (None, f"Test_Guest_{uuid.uuid4().hex[:6]}"),
            'server_name': (None, barmen["name"]),
            'seats': (None, '2'),
            'bartender_id': (None, barmen["id"])
        }
        
        response = api_client.post(f"{BASE_URL}/api/table/open", files=files)
        assert response.status_code == 200, f"Failed to open table: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "No session_id in response"
        
        print(f"✅ Opened table #{table['table_number']} with session {data['session_id']}")
        
        # Store for next tests (use class attribute)
        TestTableIDVerificationFlow.table_id = table_id
        TestTableIDVerificationFlow.session_id = data["session_id"]
        return data
    
    def test_02_verify_session_not_id_verified(self, api_client):
        """Verify newly opened session has id_verified=False"""
        session_id = getattr(TestTableIDVerificationFlow, 'session_id', None)
        assert session_id, "No session from previous test"
        
        response = api_client.get(f"{BASE_URL}/api/tap/session/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("id_verified") == False, "New session should not be ID verified"
        
        print(f"✅ Session {session_id} has id_verified=False (as expected)")
    
    def test_03_verify_id_for_session(self, api_client):
        """Verify ID for the session"""
        session_id = getattr(TestTableIDVerificationFlow, 'session_id', None)
        assert session_id, "No session from previous test"
        
        response = api_client.post(f"{BASE_URL}/api/tap/session/{session_id}/verify-id")
        assert response.status_code == 200, f"ID verification failed: {response.text}"
        
        data = response.json()
        assert data.get("id_verified") == True, "ID should be verified"
        assert "id_verified_at" in data, "Should have verification timestamp"
        
        print(f"✅ ID verified for session {session_id}")
    
    def test_04_add_alcohol_item_after_verification(self, api_client, alcohol_item):
        """Add alcohol item after ID verification - should succeed"""
        session_id = getattr(TestTableIDVerificationFlow, 'session_id', None)
        assert session_id, "No session from previous test"
        
        files = {
            'item_id': (None, alcohol_item["id"]),
            'qty': (None, '1')
        }
        
        response = api_client.post(f"{BASE_URL}/api/tap/session/{session_id}/add", files=files)
        assert response.status_code == 200, f"Failed to add item: {response.text}"
        
        data = response.json()
        assert data.get("name") == alcohol_item["name"], "Item name mismatch"
        assert data.get("line_total") == alcohol_item["price"], "Line total mismatch"
        
        print(f"✅ Added alcohol item '{alcohol_item['name']}' (${alcohol_item['price']}) after ID verification")
        
        # Store item for extras test
        TestTableIDVerificationFlow.item_id = data["line_item_id"]
    
    def test_05_session_shows_id_verified(self, api_client):
        """Verify session detail shows id_verified=True"""
        session_id = getattr(TestTableIDVerificationFlow, 'session_id', None)
        assert session_id, "No session from previous test"
        
        response = api_client.get(f"{BASE_URL}/api/tap/session/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("id_verified") == True, "Session should be ID verified"
        
        items = data.get("items", [])
        assert len(items) > 0, "Session should have items"
        
        print(f"✅ Session shows id_verified=True with {len(items)} items")
    
    def test_99_cleanup_close_table(self, api_client):
        """Cleanup: Close the table session"""
        table_id = getattr(TestTableIDVerificationFlow, 'table_id', None)
        if not table_id:
            pytest.skip("No table to close")
        
        files = {
            'table_id': (None, table_id),
            'payment_method': (None, 'card'),
            'payment_location': (None, 'pay_here')
        }
        
        response = api_client.post(f"{BASE_URL}/api/table/close", files=files)
        # Don't fail on cleanup
        print(f"✅ Cleanup: Table close status {response.status_code}")


class TestItemExtrasWithPricing:
    """Test Item Customize Modal: Add extras with prices"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "garcia.rapha2@gmail.com",
            "password": "12345"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture(scope="class")
    def test_session_with_item(self, api_client):
        """Create a test session with an item for testing extras"""
        # Open a new tab
        files = {
            'venue_id': (None, VENUE_ID),
            'guest_name': (None, f"Extras_Test_{uuid.uuid4().hex[:6]}")
        }
        response = api_client.post(f"{BASE_URL}/api/tap/session/open", files=files)
        assert response.status_code == 200, f"Failed to open tab: {response.text}"
        session_id = response.json()["session_id"]
        
        # Get a catalog item (non-alcohol for simplicity)
        response = api_client.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}")
        items = response.json().get("items", [])
        item = next((i for i in items if i.get("category") == "Beers"), items[0])
        
        # Add item to session
        files = {
            'item_id': (None, item["id"]),
            'qty': (None, '1')
        }
        response = api_client.post(f"{BASE_URL}/api/tap/session/{session_id}/add", files=files)
        assert response.status_code == 200, f"Failed to add item: {response.text}"
        
        item_data = response.json()
        
        return {
            "session_id": session_id,
            "item_id": item_data["line_item_id"],
            "base_price": item["price"],
            "item_name": item["name"]
        }
    
    def test_01_add_extras_with_prices(self, api_client, test_session_with_item):
        """Test adding extras with prices via PUT endpoint"""
        session_id = test_session_with_item["session_id"]
        item_id = test_session_with_item["item_id"]
        base_price = test_session_with_item["base_price"]
        
        # Add extras with prices
        modifiers = {
            "extras": [
                {"name": "Extra shot", "price": 5.00},
                {"name": "Lime", "price": 1.50}
            ],
            "removed": []
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/tap/session/{session_id}/item/{item_id}",
            json={
                "modifiers": modifiers,
                "notes": "Test extras with pricing"
            }
        )
        assert response.status_code == 200, f"Failed to update item: {response.text}"
        
        data = response.json()
        
        # Verify extras_total is calculated
        expected_extras_total = 5.00 + 1.50
        assert abs(data.get("extras_total", 0) - expected_extras_total) < 0.01, \
            f"Extras total should be {expected_extras_total}, got {data.get('extras_total')}"
        
        # Verify line_total includes extras
        expected_line_total = base_price + expected_extras_total
        assert abs(data.get("line_total", 0) - expected_line_total) < 0.01, \
            f"Line total should be {expected_line_total}, got {data.get('line_total')}"
        
        print(f"✅ Extras pricing works: base ${base_price} + extras ${expected_extras_total} = ${expected_line_total}")
    
    def test_02_verify_session_total_includes_extras(self, api_client, test_session_with_item):
        """Verify session total reflects extras cost"""
        session_id = test_session_with_item["session_id"]
        base_price = test_session_with_item["base_price"]
        extras_total = 6.50  # From previous test
        
        response = api_client.get(f"{BASE_URL}/api/tap/session/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        session_total = data.get("total", 0)
        expected_total = base_price + extras_total
        
        assert abs(session_total - expected_total) < 0.01, \
            f"Session total should be {expected_total}, got {session_total}"
        
        # Verify item modifiers are stored correctly
        items = data.get("items", [])
        assert len(items) > 0, "Session should have items"
        
        item = items[0]
        mods = item.get("modifiers", {})
        extras = mods.get("extras", [])
        
        assert len(extras) == 2, f"Should have 2 extras, got {len(extras)}"
        
        # Check extra format includes price
        for extra in extras:
            assert "name" in extra, "Extra should have name"
            assert "price" in extra, "Extra should have price"
        
        print(f"✅ Session total ${session_total} correctly includes extras")
    
    def test_03_update_extra_price(self, api_client, test_session_with_item):
        """Test updating an extra's price"""
        session_id = test_session_with_item["session_id"]
        item_id = test_session_with_item["item_id"]
        base_price = test_session_with_item["base_price"]
        
        # Update extras - change Extra shot price from $5 to $3
        modifiers = {
            "extras": [
                {"name": "Extra shot", "price": 3.00},  # Reduced price
                {"name": "Lime", "price": 1.50}
            ],
            "removed": []
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/tap/session/{session_id}/item/{item_id}",
            json={"modifiers": modifiers}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify new totals
        expected_extras_total = 3.00 + 1.50
        expected_line_total = base_price + expected_extras_total
        
        assert abs(data.get("extras_total", 0) - expected_extras_total) < 0.01
        assert abs(data.get("line_total", 0) - expected_line_total) < 0.01
        
        print(f"✅ Extra price update works: new total ${expected_line_total}")
    
    def test_04_remove_extras(self, api_client, test_session_with_item):
        """Test removing all extras returns to base price"""
        session_id = test_session_with_item["session_id"]
        item_id = test_session_with_item["item_id"]
        base_price = test_session_with_item["base_price"]
        
        # Remove all extras
        response = api_client.put(
            f"{BASE_URL}/api/tap/session/{session_id}/item/{item_id}",
            json={"modifiers": {"extras": [], "removed": []}}
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify back to base price
        assert abs(data.get("extras_total", 0)) < 0.01, "Extras total should be 0"
        assert abs(data.get("line_total", 0) - base_price) < 0.01, \
            f"Line total should be base price {base_price}"
        
        print(f"✅ Removing extras returns to base price ${base_price}")
    
    def test_99_cleanup_close_session(self, api_client, test_session_with_item):
        """Cleanup: Close the test session"""
        session_id = test_session_with_item["session_id"]
        
        files = {
            'payment_method': (None, 'card'),
            'payment_location': (None, 'pay_here')
        }
        
        response = api_client.post(f"{BASE_URL}/api/tap/session/{session_id}/close", files=files)
        print(f"✅ Cleanup: Session close status {response.status_code}")


class TestTapAgeVerificationFlow:
    """Test TAP page age verification for alcohol items"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "garcia.rapha2@gmail.com",
            "password": "12345"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def api_client(self, auth_token):
        session = requests.Session()
        session.headers.update({
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        })
        return session
    
    def test_catalog_alcohol_items_marked(self, api_client):
        """Verify catalog items have is_alcohol flag"""
        response = api_client.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}")
        assert response.status_code == 200
        
        items = response.json().get("items", [])
        
        # Check that beer/cocktail categories have is_alcohol=True
        beers = [i for i in items if i.get("category") == "Beers"]
        cocktails = [i for i in items if i.get("category") == "Cocktails"]
        
        for item in beers:
            assert item.get("is_alcohol") == True, \
                f"Beer '{item.get('name')}' should have is_alcohol=True"
        
        for item in cocktails:
            assert item.get("is_alcohol") == True, \
                f"Cocktail '{item.get('name')}' should have is_alcohol=True"
        
        print(f"✅ {len(beers)} beers and {len(cocktails)} cocktails marked as alcohol")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
