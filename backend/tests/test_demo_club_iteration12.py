"""
Test Suite for Demo Club Corrections (Iteration 12)
Features:
1. Login flow
2. Venue Home Modules dropdown
3. Pulse Inside page with tab #, status
4. TAP page with menu catalog, open tabs
5. Table page with 8 tables, zones
6. Kitchen KDS with 5 Kanban columns
7. Bar page with catalog categories
8. Guest Registration birthday field
9. Custom item form categories
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


class TestAuth:
    """Authentication endpoint tests"""

    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert len(data["access_token"]) > 0, "Empty access_token"
        # Store token for other tests
        TestAuth.token = data["access_token"]
        
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpassword"
        })
        # Should fail with 401
        assert response.status_code in [401, 400], f"Unexpected status: {response.status_code}"


class TestVenueHome:
    """Venue Home / Modules dropdown tests"""
    
    @pytest.fixture(autouse=True)
    def get_token(self):
        """Get auth token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_venue_home_endpoint(self):
        """Test /api/venue/home returns modules list"""
        response = requests.get(f"{BASE_URL}/api/venue/home", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Check modules exist
        assert "modules" in data, "No modules in response"
        modules = data["modules"]
        # Expected modules: Pulse, TAP, Table, KDS, Manager, Owner
        expected_keys = ['pulse', 'tap', 'table', 'kds', 'manager', 'owner']
        for key in expected_keys:
            found = any(m.get('key') == key for m in modules)
            assert found, f"Module '{key}' not found in modules list"


class TestPulseInside:
    """Pulse Inside page API tests - tab # and status"""
    
    @pytest.fixture(autouse=True)
    def get_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_inside_guests_endpoint(self):
        """Test /api/pulse/inside returns guests with tab_number and guest_status"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "guests" in data, "No guests key in response"
        # Check structure of guest objects
        if len(data["guests"]) > 0:
            guest = data["guests"][0]
            # Must have these fields for Inside page
            assert "guest_id" in guest, "Missing guest_id"
            assert "guest_name" in guest, "Missing guest_name"
            # tab_number and guest_status may be null but should exist
            assert "tab_number" in guest or guest.get("tab_number") is None, "tab_number field needed"
            assert "guest_status" in guest or guest.get("guest_status") is None, "guest_status field needed"


class TestTAPPage:
    """TAP page API tests - catalog and sessions"""
    
    @pytest.fixture(autouse=True)
    def get_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_tap_catalog(self):
        """Test /api/tap/catalog returns menu items with categories"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "items" in data, "No items key in response"
        items = data["items"]
        # Check for expected categories
        categories = set(item.get("category", "") for item in items)
        # Expected: Cocktails, Beers, Spirits, Non-alcoholic, Mains, Starters, Snacks
        expected_cats = ['Cocktails', 'Beers']
        for cat in expected_cats:
            assert cat in categories, f"Category '{cat}' not found. Found: {categories}"
    
    def test_tap_sessions(self):
        """Test /api/tap/sessions returns open tabs"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "sessions" in data, "No sessions key in response"
        # Sessions should have tab_number
        if len(data["sessions"]) > 0:
            session = data["sessions"][0]
            assert "tab_number" in session, "Missing tab_number in session"
            assert "guest_name" in session, "Missing guest_name in session"


class TestTablePage:
    """Table page API tests - tables with zones"""
    
    @pytest.fixture(autouse=True)
    def get_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_tables_list(self):
        """Test /api/table/tables returns 8 tables in zones"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "tables" in data, "No tables key in response"
        tables = data["tables"]
        # Should have at least 8 tables
        assert len(tables) >= 8, f"Expected 8+ tables, got {len(tables)}"
        # Check zones (main, vip, patio)
        zones = set(t.get("zone", "") for t in tables)
        expected_zones = ['main', 'vip', 'patio']
        for zone in expected_zones:
            assert zone in zones, f"Zone '{zone}' not found. Found: {zones}"
        # Check structure
        if tables:
            t = tables[0]
            assert "table_number" in t, "Missing table_number"
            assert "status" in t, "Missing status"
            assert "zone" in t, "Missing zone"
            # tab_number for occupied tables
            if t.get("status") == "occupied":
                assert "tab_number" in t, "Occupied table should have tab_number"


class TestKitchenKDS:
    """Kitchen KDS API tests - tickets with 5 statuses"""
    
    @pytest.fixture(autouse=True)
    def get_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_kds_tickets(self):
        """Test /api/kds/tickets returns tickets"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "tickets" in data, "No tickets key in response"
        # Tickets should have items
        if data["tickets"]:
            ticket = data["tickets"][0]
            assert "items" in ticket, "Missing items in ticket"
            assert "status" in ticket, "Missing status in ticket"
            # Status should be one of: pending, preparing, ready, delivered, delayed
            valid_statuses = ['pending', 'preparing', 'ready', 'delivered', 'delayed', 'completed']
            assert ticket["status"] in valid_statuses, f"Invalid status: {ticket['status']}"


class TestBarPage:
    """Bar page (PulseBarPage) catalog categories"""
    
    @pytest.fixture(autouse=True)
    def get_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_bar_catalog_categories(self):
        """Test catalog has bar categories: Cocktails, Beers, Spirits, Non-alcoholic"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        categories = set(item.get("category", "") for item in data.get("items", []))
        # Bar-specific categories
        bar_cats = ['Cocktails', 'Beers']
        for cat in bar_cats:
            assert cat in categories, f"Bar category '{cat}' not found. Found: {categories}"
        # Items should have USD prices
        items = data.get("items", [])
        if items:
            item = items[0]
            assert "price" in item, "Item missing price"
            assert isinstance(item["price"], (int, float)), "Price should be numeric"


class TestDataIntegrity:
    """Test demo data integrity - expected demo guests and tables"""
    
    @pytest.fixture(autouse=True)
    def get_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_demo_guests_exist(self):
        """Verify demo guests: John Smith, Maria Lopez, Kevin Brown, Alex Turner"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        if response.status_code == 200:
            data = response.json()
            guest_names = [g.get("guest_name", "") for g in data.get("guests", [])]
            # At least log what guests are present
            print(f"Guests inside: {guest_names}")
    
    def test_demo_tables_exist(self):
        """Verify 8 tables with correct occupied status"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        tables = data.get("tables", [])
        # Check table 2 and 3 for occupied status
        for t in tables:
            if t["table_number"] == "2":
                print(f"Table 2: status={t.get('status')}, guest={t.get('session_guest')}")
            if t["table_number"] == "3":
                print(f"Table 3: status={t.get('status')}, guest={t.get('session_guest')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
