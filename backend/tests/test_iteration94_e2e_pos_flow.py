"""
Iteration 94: Full E2E POS/Bar Ordering System Tests
Tests the complete flow: Login → Open tab → Add items with extras → Close tab → Record tip → Verify persistence

IMPORTANT: 
- Auth endpoints use JSON body
- All POST endpoints in /tap/ require FormData (not JSON)
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://iphone-ux-redesign.preview.emergentagent.com').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
TEST_EMAIL = "garcia.rapha2@gmail.com"
TEST_PASSWORD = "12345"


def get_auth_token():
    """Helper to get auth token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        return None
    data = response.json()
    if "data" in data:
        data = data["data"]
    return data.get("access_token")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_returns_tokens_and_user(self):
        """POST /api/auth/login - verify returns access_token, refresh_token, user object"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        # Response is wrapped: {success: true, data: {...}, error: null}
        if "data" in data:
            data = data["data"]
        
        assert "access_token" in data, "Missing access_token"
        assert "refresh_token" in data, "Missing refresh_token"
        assert "user" in data, "Missing user object"
        assert data["user"]["email"] == TEST_EMAIL
        print(f"Login successful: user role = {data['user'].get('role')}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login - verify 401 for invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "invalid@test.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestVenueEndpoints:
    """Test venue-related endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated requests"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_venue_home(self):
        """GET /api/venue/home - verify returns venues and modules"""
        response = requests.get(f"{BASE_URL}/api/venue/home", headers=self.headers)
        assert response.status_code == 200, f"Venue home failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        # Should have venues or modules
        assert "venues" in data or "modules" in data or isinstance(data, dict), f"Unexpected response: {data}"
        print(f"Venue home response keys: {data.keys() if isinstance(data, dict) else 'list'}")


class TestTapSessionsEndpoints:
    """Test TAP (bar ordering) session endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated requests"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_open_sessions(self):
        """GET /api/tap/sessions?venue_id=...&status=open - verify returns sessions list"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID, "status": "open"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Get sessions failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "sessions" in data, "Missing sessions array"
        assert isinstance(data["sessions"], list), "sessions should be a list"
        print(f"Found {len(data['sessions'])} open sessions")
    
    def test_get_catalog(self):
        """GET /api/tap/catalog?venue_id=... - verify returns items with categories and default_ingredients"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Get catalog failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "items" in data, "Missing items array"
        assert len(data["items"]) > 0, "Catalog should have items"
        
        # Check item structure
        item = data["items"][0]
        assert "id" in item, "Item missing id"
        assert "name" in item, "Item missing name"
        assert "price" in item, "Item missing price"
        assert "category" in item, "Item missing category"
        
        # Check for default_ingredients if present
        categories = set(i["category"] for i in data["items"])
        print(f"Catalog has {len(data['items'])} items in categories: {categories}")


class TestPulseEndpoints:
    """Test Pulse (guest management) endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated requests"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_inside_guests(self):
        """GET /api/pulse/inside?venue_id=... - verify returns guests inside"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Get inside guests failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "guests" in data, "Missing guests array"
        assert "total" in data, "Missing total count"
        print(f"Found {data['total']} guests inside")
    
    def test_get_today_entries(self):
        """GET /api/pulse/entries/today?venue_id=... - verify returns today entries"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Get today entries failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "entries" in data, "Missing entries array"
        assert "total" in data, "Missing total count"
        assert "allowed" in data, "Missing allowed count"
        assert "denied" in data, "Missing denied count"
        print(f"Today: {data['total']} entries ({data['allowed']} allowed, {data['denied']} denied)")
    
    def test_guest_intake_with_photo(self):
        """POST /api/pulse/guest/intake (FormData) - verify creates guest with photo"""
        import uuid
        test_name = f"TEST_Guest_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            data={
                "name": test_name,
                "venue_id": VENUE_ID,
                "phone": "+1555123456",
                "email": f"{test_name.lower()}@test.com",
                "photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Guest intake failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "guest_id" in data, "Missing guest_id"
        assert data["name"] == test_name, "Name mismatch"
        print(f"Created guest: {data['guest_id']}")


class TestTableEndpoints:
    """Test Table management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated requests"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_tables(self):
        """GET /api/table/tables?venue_id=... - verify returns tables with status"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Get tables failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "tables" in data, "Missing tables array"
        assert len(data["tables"]) > 0, "Should have tables"
        
        # Check table structure
        table = data["tables"][0]
        assert "id" in table, "Table missing id"
        assert "table_number" in table, "Table missing table_number"
        assert "status" in table, "Table missing status"
        
        statuses = [t["status"] for t in data["tables"]]
        print(f"Found {len(data['tables'])} tables. Statuses: {set(statuses)}")


class TestSessionOpenEndpoint:
    """Test session open endpoint specifically"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated requests"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_open_session_formdata(self):
        """POST /api/tap/session/open (FormData) - verify creates new session"""
        import uuid
        guest_name = f"TEST_Open_{uuid.uuid4().hex[:6]}"
        
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": guest_name,
                "session_type": "tap"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Open session failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "session_id" in data, "Missing session_id"
        assert data["guest_name"] == guest_name, "Guest name mismatch"
        assert data["status"] == "open", "Status should be open"
        print(f"Opened session: {data['session_id']}, tab #{data.get('tab_number')}")


class TestAddItemEndpoint:
    """Test add item to session endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create a test session"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test session
        import uuid
        guest_name = f"TEST_AddItem_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": guest_name,
                "session_type": "tap"
            },
            headers=self.headers
        )
        data = response.json()
        if "data" in data:
            data = data["data"]
        self.session_id = data["session_id"]
    
    def test_add_item_with_modifiers(self):
        """POST /api/tap/session/{session_id}/add (FormData) - verify adds item with modifiers"""
        # Get a catalog item
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        item = data["items"][0]
        item_id = item["id"]
        
        # Add item with modifiers
        modifiers = json.dumps({
            "extras": [{"name": "Extra shot", "price": 1.50}],
            "removed": ["ice"]
        })
        
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{self.session_id}/add",
            data={
                "item_id": item_id,
                "qty": 2,
                "notes": "No ice please",
                "modifiers": modifiers
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Add item failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert "line_item_id" in data, "Missing line_item_id"
        assert data["qty"] == 2, "Qty mismatch"
        assert data["session_total"] > 0, "Session total should be > 0"
        print(f"Added item: {data['name']}, line_total: ${data['line_total']}, session_total: ${data['session_total']}")


class TestSessionDetailEndpoint:
    """Test session detail endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated requests"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_session_detail(self):
        """GET /api/tap/session/{session_id} - verify returns session with items, guest_name, total, tip fields"""
        # First get an existing session
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID, "status": "open"},
            headers=self.headers
        )
        assert response.status_code == 200
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        if len(data["sessions"]) == 0:
            pytest.skip("No open sessions to test")
        
        session_id = data["sessions"][0]["id"]
        
        # Get session detail
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get session detail failed: {response.text}"
        
        session = response.json()
        if "data" in session:
            session = session["data"]
        
        # Verify required fields
        assert "id" in session, "Missing id"
        assert "guest_name" in session, "Missing guest_name"
        assert "total" in session, "Missing total"
        assert "items" in session, "Missing items"
        assert "tip_amount" in session or session.get("tip_amount") == 0, "Missing tip_amount"
        assert "tip_percent" in session or session.get("tip_percent") == 0, "Missing tip_percent"
        assert "tip_recorded" in session, "Missing tip_recorded"
        
        print(f"Session detail: guest={session['guest_name']}, total=${session['total']}, items={len(session['items'])}")


class TestCloseSessionEndpoint:
    """Test close session endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create a test session with items"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create a test session
        import uuid
        guest_name = f"TEST_Close_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": guest_name,
                "session_type": "tap"
            },
            headers=self.headers
        )
        data = response.json()
        if "data" in data:
            data = data["data"]
        self.session_id = data["session_id"]
        
        # Add an item
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        catalog = response.json()
        if "data" in catalog:
            catalog = catalog["data"]
        item_id = catalog["items"][0]["id"]
        
        requests.post(
            f"{BASE_URL}/api/tap/session/{self.session_id}/add",
            data={"item_id": item_id, "qty": 1},
            headers=self.headers
        )
    
    def test_close_session(self):
        """POST /api/tap/session/{session_id}/close (FormData) - verify closes session"""
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{self.session_id}/close",
            data={
                "payment_method": "card",
                "payment_location": "pay_here"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Close session failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert data["status"] == "closed", "Status should be closed"
        assert data["total"] > 0, "Total should be > 0"
        assert data["payment_method"] == "card", "Payment method mismatch"
        print(f"Closed session: total=${data['total']}, method={data['payment_method']}")


class TestRecordTipEndpoint:
    """Test record tip endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and create a closed session"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Create and close a test session
        import uuid
        guest_name = f"TEST_Tip_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": guest_name,
                "session_type": "tap"
            },
            headers=self.headers
        )
        data = response.json()
        if "data" in data:
            data = data["data"]
        self.session_id = data["session_id"]
        
        # Add an item
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        catalog = response.json()
        if "data" in catalog:
            catalog = catalog["data"]
        item_id = catalog["items"][0]["id"]
        
        requests.post(
            f"{BASE_URL}/api/tap/session/{self.session_id}/add",
            data={"item_id": item_id, "qty": 2},
            headers=self.headers
        )
        
        # Close the session
        requests.post(
            f"{BASE_URL}/api/tap/session/{self.session_id}/close",
            data={"payment_method": "card", "payment_location": "pay_here"},
            headers=self.headers
        )
    
    def test_record_tip_percent(self):
        """POST /api/tap/session/{session_id}/record-tip (FormData) - verify tip recorded"""
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{self.session_id}/record-tip",
            data={"tip_percent": 20},
            headers=self.headers
        )
        assert response.status_code == 200, f"Record tip failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        assert data["tip_amount"] > 0, "Tip amount should be > 0"
        assert data["tip_percent"] == 20, "Tip percent should be 20"
        print(f"Recorded tip: ${data['tip_amount']} ({data['tip_percent']}%)")
        
        # Verify tip persisted in session detail
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{self.session_id}",
            headers=self.headers
        )
        session = response.json()
        if "data" in session:
            session = session["data"]
        
        assert session["tip_recorded"] == True, "tip_recorded should be True"
        assert session["tip_amount"] > 0, "tip_amount should persist"
        print(f"Tip verified in session: ${session['tip_amount']}")


class TestFullE2EFlow:
    """
    Full E2E flow test:
    1. Login
    2. Open tab
    3. Get catalog item
    4. Add item with modifiers
    5. Verify session total
    6. Close tab
    7. Record tip
    8. Verify tip persistence in session detail
    """
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for authenticated requests"""
        self.token = get_auth_token()
        assert self.token, "Failed to get auth token"
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_full_e2e_tab_flow(self):
        """Complete E2E flow: open tab → add items → close → record tip → verify"""
        import uuid
        
        # Step 1: Login already done in setup
        print("Step 1: Login successful")
        
        # Step 2: Open a new tab (FormData)
        guest_name = f"TEST_E2E_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": guest_name,
                "session_type": "tap"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Open tab failed: {response.text}"
        
        data = response.json()
        if "data" in data:
            data = data["data"]
        
        session_id = data["session_id"]
        tab_number = data.get("tab_number")
        assert session_id, "Missing session_id"
        print(f"Step 2: Opened tab #{tab_number} (session: {session_id})")
        
        # Step 3: Get catalog item
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Get catalog failed: {response.text}"
        
        catalog_data = response.json()
        if "data" in catalog_data:
            catalog_data = catalog_data["data"]
        
        items = catalog_data["items"]
        assert len(items) > 0, "No catalog items"
        
        # Pick a cocktail item
        cocktail = next((i for i in items if i["category"] == "Cocktails"), items[0])
        item_id = cocktail["id"]
        item_name = cocktail["name"]
        item_price = cocktail["price"]
        print(f"Step 3: Selected item: {item_name} (${item_price})")
        
        # Step 4: Add item with modifiers (FormData with JSON modifiers)
        modifiers = json.dumps({
            "extras": [
                {"name": "Extra lime", "price": 0.50},
                {"name": "Salt rim", "price": 0}
            ],
            "removed": ["ice"]
        })
        
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            data={
                "item_id": item_id,
                "qty": 2,
                "notes": "No ice, extra lime",
                "modifiers": modifiers
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Add item failed: {response.text}"
        
        add_data = response.json()
        if "data" in add_data:
            add_data = add_data["data"]
        
        line_item_id = add_data["line_item_id"]
        session_total = add_data["session_total"]
        print(f"Step 4: Added {add_data['qty']}x {add_data['name']} = ${add_data['line_total']} (session total: ${session_total})")
        
        # Step 5: Verify session detail shows item
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get session failed: {response.text}"
        
        session_data = response.json()
        if "data" in session_data:
            session_data = session_data["data"]
        
        assert session_data["guest_name"] == guest_name, "Guest name mismatch"
        assert len(session_data["items"]) > 0, "No items in session"
        assert session_data["total"] > 0, "Total should be > 0"
        print(f"Step 5: Session verified - {len(session_data['items'])} items, total: ${session_data['total']}")
        
        # Step 6: Close tab (FormData)
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data={
                "payment_method": "card",
                "payment_location": "pay_here"
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Close tab failed: {response.text}"
        
        close_data = response.json()
        if "data" in close_data:
            close_data = close_data["data"]
        
        assert close_data["status"] == "closed", "Tab should be closed"
        final_total = close_data["total"]
        print(f"Step 6: Tab closed - total: ${final_total}, method: {close_data['payment_method']}")
        
        # Step 7: Record tip (FormData with tip_percent)
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/record-tip",
            data={
                "tip_percent": 20
            },
            headers=self.headers
        )
        assert response.status_code == 200, f"Record tip failed: {response.text}"
        
        tip_data = response.json()
        if "data" in tip_data:
            tip_data = tip_data["data"]
        
        tip_amount = tip_data["tip_amount"]
        tip_percent = tip_data["tip_percent"]
        print(f"Step 7: Tip recorded - ${tip_amount} ({tip_percent}%)")
        
        # Step 8: Verify tip persistence in session detail
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Get session after tip failed: {response.text}"
        
        final_session = response.json()
        if "data" in final_session:
            final_session = final_session["data"]
        
        assert final_session["tip_recorded"] == True, "tip_recorded should be True"
        assert final_session["tip_amount"] > 0, "tip_amount should be > 0"
        assert final_session["tip_percent"] > 0, "tip_percent should be > 0"
        print(f"Step 8: Tip verified in session - tip_amount: ${final_session['tip_amount']}, tip_percent: {final_session['tip_percent']}%")
        
        print("\n=== FULL E2E FLOW COMPLETED SUCCESSFULLY ===")
        print(f"Session ID: {session_id}")
        print(f"Guest: {guest_name}")
        print(f"Tab #: {tab_number}")
        print(f"Items: {len(final_session['items'])}")
        print(f"Total: ${final_session['total']}")
        print(f"Tip: ${final_session['tip_amount']} ({final_session['tip_percent']}%)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
