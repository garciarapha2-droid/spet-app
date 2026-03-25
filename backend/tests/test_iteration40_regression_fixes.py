"""
Iteration 40: Regression Fixes Testing
- FIX 1: Staff Earnings tip attribution - tips attributed to specific staff member
- FIX 2: Bar Inside shows ALL guests including closed tabs
- Regression: Protected accounts login
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dark-light-theme-5.preview.emergentagent.com')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
CARLOS_SILVA_ID = "b5f31a05-6a8c-406e-84ec-26454411aca4"


class TestRegressionProtectedAccounts:
    """Regression: Protected accounts can still login"""
    
    def test_01_protected_account_teste_login(self):
        """teste@teste.com should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert len(data["access_token"]) > 0
        print(f"PASS: teste@teste.com login successful")
    
    def test_02_protected_account_ceo_login(self):
        """garcia.rapha2@gmail.com (CEO) should be able to login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "garcia.rapha2@gmail.com",
            "password": "1234"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert len(data["access_token"]) > 0
        print(f"PASS: garcia.rapha2@gmail.com login successful")


class TestFix1StaffEarningsTipAttribution:
    """FIX 1: Tips must update in BOTH shift-overview AND staff-costs for specific staff member"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_03_shift_overview_shows_tips(self):
        """GET /api/manager/shift-overview should show total tips"""
        response = requests.get(
            f"{BASE_URL}/api/manager/shift-overview?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "tips" in data, "Missing 'tips' field in shift-overview"
        assert isinstance(data["tips"], (int, float)), "Tips should be a number"
        assert data["tips"] >= 0, "Tips should be non-negative"
        print(f"PASS: shift-overview shows tips: ${data['tips']}")
    
    def test_04_staff_costs_shows_carlos_silva_tips(self):
        """GET /api/manager/staff-costs should attribute tips to Carlos Silva"""
        response = requests.get(
            f"{BASE_URL}/api/manager/staff-costs?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "staff" in data, "Missing 'staff' field in staff-costs"
        
        # Find Carlos Silva in staff list
        carlos = None
        for s in data["staff"]:
            if s["id"] == CARLOS_SILVA_ID or s["name"] == "Carlos Silva":
                carlos = s
                break
        
        assert carlos is not None, f"Carlos Silva not found in staff list. Staff: {[s['name'] for s in data['staff']]}"
        assert "tips" in carlos, "Carlos Silva missing 'tips' field"
        print(f"PASS: Carlos Silva found with tips: ${carlos['tips']}")
        
        # Verify Carlos has attributed tips (should be $8.60 from seed data)
        assert carlos["tips"] >= 8.6, f"Expected Carlos to have >= $8.60 tips, got ${carlos['tips']}"
        print(f"PASS: Carlos Silva has ${carlos['tips']} in tips (expected >= $8.60)")
    
    def test_05_shift_overview_tips_matches_staff_costs_attributed_tips(self):
        """Total tips in shift-overview should >= sum of attributed tips in staff-costs"""
        # Get shift-overview tips
        overview_response = requests.get(
            f"{BASE_URL}/api/manager/shift-overview?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert overview_response.status_code == 200
        overview_tips = overview_response.json().get("tips", 0)
        
        # Get staff-costs attributed tips
        costs_response = requests.get(
            f"{BASE_URL}/api/manager/staff-costs?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert costs_response.status_code == 200
        staff = costs_response.json().get("staff", [])
        total_attributed_tips = sum(s.get("tips", 0) for s in staff)
        
        print(f"Shift Overview Tips: ${overview_tips}")
        print(f"Total Attributed Tips (sum of staff tips): ${total_attributed_tips}")
        
        # They should be equal or overview should be >= (in case some tips are unattributed)
        assert abs(overview_tips - total_attributed_tips) < 0.01, \
            f"Mismatch: shift-overview tips ${overview_tips} vs attributed ${total_attributed_tips}"
        print(f"PASS: Tips match - shift-overview ${overview_tips} == attributed ${total_attributed_tips}")


class TestFix2BarInsideAllGuests:
    """FIX 2: Bar Inside Tabs must show ALL guests inside venue with tab number and spend"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_06_pulse_inside_returns_7_guests(self):
        """GET /api/pulse/inside should return 7 guests"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "guests" in data, "Missing 'guests' field"
        assert "total" in data, "Missing 'total' field"
        
        guests = data["guests"]
        total = data["total"]
        
        assert total == 7, f"Expected 7 guests, got {total}"
        assert len(guests) == 7, f"Expected 7 guests in list, got {len(guests)}"
        print(f"PASS: pulse/inside returns {total} guests")
    
    def test_07_pulse_inside_all_guests_have_tab_number_and_total(self):
        """All guests in pulse/inside should have tab_number and tab_total"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200
        guests = response.json().get("guests", [])
        
        for guest in guests:
            assert "tab_number" in guest, f"Guest {guest.get('guest_name')} missing tab_number"
            assert "tab_total" in guest, f"Guest {guest.get('guest_name')} missing tab_total"
            assert guest["tab_number"] is not None, f"Guest {guest.get('guest_name')} has null tab_number"
            assert guest["tab_total"] is not None, f"Guest {guest.get('guest_name')} has null tab_total"
            print(f"  - {guest['guest_name']}: #{guest['tab_number']} ${guest['tab_total']}")
        
        print(f"PASS: All {len(guests)} guests have tab_number and tab_total")
    
    def test_08_alex_turner_shows_with_closed_tab(self):
        """Alex Turner should appear with tab #105 and $43.00 (closed tab)"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200
        guests = response.json().get("guests", [])
        
        # Find Alex Turner
        alex = None
        for g in guests:
            if g.get("guest_name") == "Alex Turner":
                alex = g
                break
        
        assert alex is not None, f"Alex Turner not found. Guests: {[g.get('guest_name') for g in guests]}"
        assert alex["tab_number"] == 105, f"Expected tab #105, got #{alex.get('tab_number')}"
        assert alex["tab_total"] == 43, f"Expected $43.00, got ${alex.get('tab_total')}"
        assert alex.get("tab_status") == "closed", f"Expected closed status, got {alex.get('tab_status')}"
        assert alex.get("guest_status") == "Paid", f"Expected 'Paid' status, got {alex.get('guest_status')}"
        
        print(f"PASS: Alex Turner found - #{alex['tab_number']} ${alex['tab_total']} status={alex['tab_status']}")


class TestFix1E2ETipFlow:
    """FIX 1 E2E: Full tip flow - open session, add items, close, record tip, verify attribution"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        self.token = response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.session_id = None
    
    def test_09_e2e_open_session_with_bartender(self):
        """Open a new session with Carlos Silva as bartender"""
        form_data = {
            "venue_id": VENUE_ID,
            "guest_name": "TEST_TipFlow_Guest",
            "bartender_id": CARLOS_SILVA_ID,
            "bartender_name": "Carlos Silva"
        }
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=form_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to open session: {response.text}"
        data = response.json()
        assert "session_id" in data, f"No session_id in response: {data}"
        self.__class__.session_id = data["session_id"]
        print(f"PASS: Session opened - ID: {self.__class__.session_id}, Tab #{data.get('tab_number')}")
    
    def test_10_e2e_add_item_to_session(self):
        """Add an item to the session"""
        if not hasattr(self.__class__, 'session_id') or not self.__class__.session_id:
            pytest.skip("No session_id from previous test")
        
        # Get catalog to find an item
        catalog_response = requests.get(
            f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert catalog_response.status_code == 200
        items = catalog_response.json().get("items", [])
        assert len(items) > 0, "No items in catalog"
        
        item = items[0]
        form_data = {"item_id": item["id"], "qty": "1"}
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{self.__class__.session_id}/add",
            data=form_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to add item: {response.text}"
        print(f"PASS: Added item '{item['name']}' to session")
    
    def test_11_e2e_close_session_pay_here(self):
        """Close the session with pay_here"""
        if not hasattr(self.__class__, 'session_id') or not self.__class__.session_id:
            pytest.skip("No session_id from previous test")
        
        form_data = {
            "payment_method": "card",
            "payment_location": "pay_here"
        }
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{self.__class__.session_id}/close",
            data=form_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to close session: {response.text}"
        data = response.json()
        self.__class__.closed_total = data.get("total", 0)
        print(f"PASS: Session closed - Total: ${self.__class__.closed_total}")
    
    def test_12_e2e_record_tip(self):
        """Record a $5 tip on the closed session"""
        if not hasattr(self.__class__, 'session_id') or not self.__class__.session_id:
            pytest.skip("No session_id from previous test")
        
        form_data = {"tip_amount": "5.00"}
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{self.__class__.session_id}/record-tip",
            data=form_data,
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to record tip: {response.text}"
        data = response.json()
        # API returns tip_amount, distribution, recorded_at
        assert "tip_amount" in data, f"Missing tip_amount in response: {data}"
        assert data.get("tip_amount") == 5.0, f"Expected tip_amount 5.0, got {data.get('tip_amount')}"
        print(f"PASS: Tip recorded - Amount: ${data.get('tip_amount')}")
    
    def test_13_e2e_verify_tip_in_shift_overview(self):
        """Verify shift-overview includes tips (after E2E tip recording)"""
        response = requests.get(
            f"{BASE_URL}/api/manager/shift-overview?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200
        tips = response.json().get("tips", 0)
        # After E2E, tips should have increased - test just verifies tips field exists and is positive
        # The exact value depends on previous test runs in this session
        assert tips > 0, f"Expected tips > $0 after E2E test, got ${tips}"
        print(f"PASS: Shift overview shows tips: ${tips}")
    
    def test_14_e2e_verify_carlos_has_tips(self):
        """Verify Carlos Silva has tips in staff-costs"""
        response = requests.get(
            f"{BASE_URL}/api/manager/staff-costs?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200
        staff = response.json().get("staff", [])
        
        carlos = None
        for s in staff:
            if s["id"] == CARLOS_SILVA_ID or s["name"] == "Carlos Silva":
                carlos = s
                break
        
        assert carlos is not None, "Carlos Silva not found"
        # Carlos should have tips attributed - at minimum the seed $8.60
        assert carlos["tips"] >= 8.6, f"Expected Carlos tips >= $8.60, got ${carlos['tips']}"
        print(f"PASS: Carlos Silva tips: ${carlos['tips']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
