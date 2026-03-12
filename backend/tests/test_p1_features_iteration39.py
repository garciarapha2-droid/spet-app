"""
Iteration 39 - P1 Features Testing
=====================================================
Tests for P1 interactive features:
- P1-1: Manager Dashboard Revenue Today KPI breakdown
- P1-2: CEO Dashboard KPIs breakdown (MRR, Gross Revenue, Net Profit)
- P1-3: CEO Company Management (module toggles, status updates)
- P0 regression: Inside Now panel, Tip distribution, Payment flow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


class TestP1BackendFeatures:
    """Test P1 backend API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Authenticate and get token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("access_token") or data.get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
        self.session.close()

    # ─── P1-1: Manager Revenue Breakdown ───────────────────────────────
    
    def test_01_manager_revenue_breakdown_endpoint_exists(self):
        """P1-1: GET /api/manager/revenue-breakdown returns 200"""
        response = self.session.get(f"{BASE_URL}/api/manager/revenue-breakdown", params={"venue_id": VENUE_ID})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Manager revenue-breakdown endpoint exists and returns 200")
    
    def test_02_manager_revenue_breakdown_structure(self):
        """P1-1: Revenue breakdown contains required fields"""
        response = self.session.get(f"{BASE_URL}/api/manager/revenue-breakdown", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        
        # Required fields
        assert "total_revenue" in data, "Missing total_revenue"
        assert "total_tips" in data, "Missing total_tips"
        assert "sessions_count" in data, "Missing sessions_count"
        assert "payment_methods" in data, "Missing payment_methods"
        assert "sessions" in data, "Missing sessions list"
        assert "top_items" in data, "Missing top_items"
        
        print(f"PASS: Revenue breakdown structure valid")
        print(f"  - Total Revenue: ${data['total_revenue']}")
        print(f"  - Total Tips: ${data['total_tips']}")
        print(f"  - Sessions Count: {data['sessions_count']}")
        print(f"  - Payment Methods: {data['payment_methods']}")
        print(f"  - Top Items Count: {len(data['top_items'])}")
    
    def test_03_manager_revenue_breakdown_session_details(self):
        """P1-1: Each session in breakdown has required fields"""
        response = self.session.get(f"{BASE_URL}/api/manager/revenue-breakdown", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        
        sessions = data.get("sessions", [])
        if sessions:
            session = sessions[0]
            required = ["id", "tab_number", "total", "tip", "payment_location", "closed_at", "bartender"]
            for field in required:
                assert field in session, f"Session missing field: {field}"
            print(f"PASS: Session details have all required fields: {required}")
            print(f"  - Example session: Tab #{session.get('tab_number')}, ${session.get('total')}, Tip: ${session.get('tip')}")
        else:
            print("INFO: No closed sessions today - structure test skipped")
    
    # ─── P1-2: CEO KPI Breakdown ───────────────────────────────────────
    
    def test_04_ceo_kpi_breakdown_mrr(self):
        """P1-2: GET /api/ceo/kpi-breakdown?kpi=mrr returns valid data"""
        response = self.session.get(f"{BASE_URL}/api/ceo/kpi-breakdown", params={"kpi": "mrr"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "kpi" in data, "Missing kpi field"
        assert "total" in data, "Missing total field"
        assert "venues" in data, "Missing venues array"
        assert data["kpi"] == "mrr", f"Expected kpi='mrr', got '{data['kpi']}'"
        
        print(f"PASS: CEO KPI breakdown for MRR")
        print(f"  - KPI: {data['kpi']}")
        print(f"  - Total: ${data['total']}")
        print(f"  - Venues count: {len(data['venues'])}")
    
    def test_05_ceo_kpi_breakdown_gross_revenue(self):
        """P1-2: GET /api/ceo/kpi-breakdown?kpi=gross_revenue returns valid data"""
        response = self.session.get(f"{BASE_URL}/api/ceo/kpi-breakdown", params={"kpi": "gross_revenue"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["kpi"] == "gross_revenue"
        assert "total" in data
        assert "venues" in data
        
        print(f"PASS: CEO KPI breakdown for Gross Revenue - Total: ${data['total']}")
    
    def test_06_ceo_kpi_breakdown_net_profit(self):
        """P1-2: GET /api/ceo/kpi-breakdown?kpi=net_profit returns valid data"""
        response = self.session.get(f"{BASE_URL}/api/ceo/kpi-breakdown", params={"kpi": "net_profit"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["kpi"] == "net_profit"
        assert "total" in data
        
        print(f"PASS: CEO KPI breakdown for Net Profit - Total: ${data['total']}")
    
    def test_07_ceo_kpi_breakdown_venue_structure(self):
        """P1-2: Each venue in KPI breakdown has required fields"""
        response = self.session.get(f"{BASE_URL}/api/ceo/kpi-breakdown", params={"kpi": "mrr"})
        assert response.status_code == 200
        data = response.json()
        
        venues = data.get("venues", [])
        if venues:
            venue = venues[0]
            required = ["venue_id", "venue_name", "value", "revenue_today", "sessions_closed", "tips"]
            for field in required:
                assert field in venue, f"Venue missing field: {field}"
            print(f"PASS: Venue breakdown has required fields: {required}")
            print(f"  - Example: {venue['venue_name']} - ${venue['value']}")
        else:
            print("INFO: No venues in breakdown")
    
    # ─── P1-3: CEO Company Management ──────────────────────────────────
    
    def test_08_ceo_companies_endpoint(self):
        """P1-3: GET /api/ceo/companies returns company list"""
        response = self.session.get(f"{BASE_URL}/api/ceo/companies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "companies" in data
        companies = data["companies"]
        assert len(companies) > 0, "Should have at least one company"
        
        print(f"PASS: CEO companies endpoint - {len(companies)} companies")
    
    def test_09_ceo_company_has_management_fields(self):
        """P1-3: Company data includes fields needed for management"""
        response = self.session.get(f"{BASE_URL}/api/ceo/companies")
        assert response.status_code == 200
        data = response.json()
        
        company = data["companies"][0]
        required = ["user_id", "name", "email", "status", "venues", "mrr"]
        for field in required:
            assert field in company, f"Company missing: {field}"
        
        # Verify venues have modules
        if company.get("venues"):
            venue = company["venues"][0]
            assert "venue_id" in venue
            assert "modules" in venue
            print(f"PASS: Company has required management fields")
            print(f"  - User ID: {company['user_id']}")
            print(f"  - Status: {company['status']}")
            print(f"  - Venue modules: {venue.get('modules')}")
        else:
            print("INFO: Company has no venues")
    
    def test_10_ceo_update_company_modules(self):
        """P1-3: PUT /api/ceo/company/{user_id}/modules updates venue modules"""
        # First get a company
        companies_res = self.session.get(f"{BASE_URL}/api/ceo/companies")
        assert companies_res.status_code == 200
        companies = companies_res.json()["companies"]
        
        # Find company with at least one venue
        company = None
        venue = None
        for c in companies:
            if c.get("venues"):
                company = c
                venue = c["venues"][0]
                break
        
        if not company or not venue:
            pytest.skip("No company with venues found")
        
        user_id = company["user_id"]
        venue_id = venue["venue_id"]
        current_modules = venue.get("modules", [])
        
        # Toggle: add or remove 'kds' module
        if "kds" in current_modules:
            new_modules = [m for m in current_modules if m != "kds"]
        else:
            new_modules = current_modules + ["kds"]
        
        # Update modules - use files param to send multipart form data
        response = self.session.put(
            f"{BASE_URL}/api/ceo/company/{user_id}/modules",
            data={"venue_id": venue_id, "modules": ",".join(new_modules)},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result.get("status") == "updated"
        
        print(f"PASS: CEO update company modules")
        print(f"  - User ID: {user_id}")
        print(f"  - Venue ID: {venue_id}")
        print(f"  - New modules: {result.get('modules')}")
        
        # Revert to original
        self.session.put(
            f"{BASE_URL}/api/ceo/company/{user_id}/modules",
            data={"venue_id": venue_id, "modules": ",".join(current_modules)},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
    
    def test_11_ceo_update_company_status(self):
        """P1-3: PUT /api/ceo/company/{user_id}/status updates user status"""
        # Get a company
        companies_res = self.session.get(f"{BASE_URL}/api/ceo/companies")
        assert companies_res.status_code == 200
        companies = companies_res.json()["companies"]
        
        if not companies:
            pytest.skip("No companies found")
        
        company = companies[0]
        user_id = company["user_id"]
        current_status = company.get("status", "active")
        
        # Update to 'suspended' (we'll revert)
        response = self.session.put(
            f"{BASE_URL}/api/ceo/company/{user_id}/status",
            data={"status": "suspended"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result.get("status") == "updated"
        assert result.get("new_status") == "suspended"
        
        print(f"PASS: CEO update company status to 'suspended'")
        print(f"  - User ID: {user_id}")
        
        # Revert to original status
        self.session.put(
            f"{BASE_URL}/api/ceo/company/{user_id}/status",
            data={"status": current_status},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"  - Reverted to: {current_status}")
    
    # ─── P0 Regression Tests ───────────────────────────────────────────
    
    def test_12_p0_inside_now_panel(self):
        """P0 Regression: Inside Now panel still returns guests"""
        response = self.session.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        
        assert "guests" in data
        print(f"PASS: P0 Inside Now - {len(data['guests'])} guests currently inside")
    
    def test_13_p0_tap_sessions_active(self):
        """P0 Regression: Active TAP sessions endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/tap/sessions/active", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        print("PASS: P0 TAP sessions/active endpoint works")
    
    def test_14_p0_manager_overview(self):
        """P0 Regression: Manager overview endpoint works"""
        response = self.session.get(f"{BASE_URL}/api/manager/overview", params={"venue_id": VENUE_ID})
        assert response.status_code == 200
        data = response.json()
        assert "kpis" in data
        assert "revenue_today" in data["kpis"]
        print(f"PASS: P0 Manager overview - Revenue today: ${data['kpis']['revenue_today']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
