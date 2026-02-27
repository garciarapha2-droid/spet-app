"""
Iteration 15 - Manager Dashboard Tests
Testing all 8 Manager Dashboard sections and P0 fix for teste@teste.com deletion protection
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"


class TestAuthSetup:
    """Setup: Get authentication token"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    @pytest.fixture(scope="class")
    def user_id(self, auth_headers):
        """Get current user ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        return response.json()["id"]


class TestP0UserDeletionProtection(TestAuthSetup):
    """
    P0 FIX: DELETE /api/auth/users/{id} must return 403 for teste@teste.com
    and succeed for other users
    """
    
    def test_delete_protected_user_returns_403(self, auth_headers, user_id):
        """
        P0: teste@teste.com cannot be deleted - should return 403
        """
        response = requests.delete(
            f"{BASE_URL}/api/auth/users/{user_id}",
            headers=auth_headers
        )
        # Should return 403 Forbidden since teste@teste.com is protected
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        assert "System account cannot be deleted" in data["detail"]
        print(f"✅ P0 PASS: Protected account teste@teste.com returns 403 on delete")
    
    def test_delete_nonexistent_user_returns_404(self, auth_headers):
        """
        DELETE non-existent user should return 404
        """
        fake_id = str(uuid.uuid4())
        response = requests.delete(
            f"{BASE_URL}/api/auth/users/{fake_id}",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ PASS: Non-existent user returns 404")


class TestManagerOverview(TestAuthSetup):
    """
    Manager Overview: GET /api/manager/overview returns KPIs, charts, and alerts
    """
    
    def test_overview_endpoint(self, auth_headers):
        """Test overview returns KPIs, charts, and alerts"""
        response = requests.get(
            f"{BASE_URL}/api/manager/overview",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify KPIs structure
        assert "kpis" in data, "Missing 'kpis' in response"
        kpis = data["kpis"]
        expected_kpis = ["revenue_today", "revenue_week", "revenue_month", "avg_ticket", "unique_guests", "open_tabs"]
        for kpi in expected_kpis:
            assert kpi in kpis, f"Missing KPI: {kpi}"
        
        # Verify charts structure
        assert "charts" in data, "Missing 'charts' in response"
        charts = data["charts"]
        assert "revenue_by_hour" in charts, "Missing revenue_by_hour chart"
        assert "top_items" in charts, "Missing top_items chart"
        assert "guest_funnel" in charts, "Missing guest_funnel chart"
        
        # Verify alerts structure (can be empty list)
        assert "alerts" in data, "Missing 'alerts' in response"
        
        print(f"✅ PASS: Overview returns all KPIs, charts, and alerts")
        print(f"   KPIs: rev_today=${kpis['revenue_today']}, open_tabs={kpis['open_tabs']}, guests={kpis['unique_guests']}")


class TestManagerStaff(TestAuthSetup):
    """
    Manager Staff: GET/POST /api/manager/staff
    """
    
    def test_get_staff_list(self, auth_headers):
        """Test getting staff list"""
        response = requests.get(
            f"{BASE_URL}/api/manager/staff",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "staff" in data, "Missing 'staff' (system users)"
        assert "barmen" in data, "Missing 'barmen' (operational staff)"
        assert "schedules" in data, "Missing 'schedules'"
        
        print(f"✅ PASS: Staff list returns {len(data['staff'])} system users, {len(data['barmen'])} barmen")
    
    def test_add_staff_member(self, auth_headers):
        """Test adding a new staff member"""
        test_name = f"TEST_Staff_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/manager/staff",
            data={
                "venue_id": VENUE_ID,
                "name": test_name,
                "role": "server"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "id" in data
        assert data["name"] == test_name
        
        # Cleanup
        staff_id = data["id"]
        requests.delete(f"{BASE_URL}/api/manager/staff/{staff_id}", headers=auth_headers)
        
        print(f"✅ PASS: Added and cleaned up staff member: {test_name}")


class TestManagerSchedule(TestAuthSetup):
    """
    Manager Schedule: POST /api/manager/schedule
    """
    
    def test_save_schedule(self, auth_headers):
        """Test saving a schedule entry"""
        # First add a staff member
        test_name = f"TEST_Scheduler_{uuid.uuid4().hex[:8]}"
        staff_resp = requests.post(
            f"{BASE_URL}/api/manager/staff",
            data={"venue_id": VENUE_ID, "name": test_name, "role": "server"},
            headers=auth_headers
        )
        assert staff_resp.status_code == 200
        staff_id = staff_resp.json()["id"]
        
        # Save schedule
        response = requests.post(
            f"{BASE_URL}/api/manager/schedule",
            data={
                "venue_id": VENUE_ID,
                "staff_id": staff_id,
                "staff_name": test_name,
                "day": "Mon",
                "start_time": "18:00",
                "end_time": "02:00"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data["staff_id"] == staff_id
        assert data["day"] == "Mon"
        
        # Cleanup
        schedule_id = data["id"]
        requests.delete(f"{BASE_URL}/api/manager/schedule/{schedule_id}", headers=auth_headers)
        requests.delete(f"{BASE_URL}/api/manager/staff/{staff_id}", headers=auth_headers)
        
        print(f"✅ PASS: Schedule saved and cleaned up")


class TestManagerGuests(TestAuthSetup):
    """
    Manager Guests: GET /api/manager/guests with search
    """
    
    def test_get_guests_list(self, auth_headers):
        """Test getting guests list"""
        response = requests.get(
            f"{BASE_URL}/api/manager/guests",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "guests" in data
        assert "total" in data
        
        print(f"✅ PASS: Guests list returns {len(data['guests'])} guests, total: {data['total']}")
    
    def test_guests_search(self, auth_headers):
        """Test searching guests"""
        response = requests.get(
            f"{BASE_URL}/api/manager/guests",
            params={"venue_id": VENUE_ID, "search": "test"},
            headers=auth_headers
        )
        assert response.status_code == 200
        print("✅ PASS: Guest search with query works")


class TestManagerGuestDetail(TestAuthSetup):
    """
    Manager Guest Detail: GET /api/manager/guests/{id}
    """
    
    def test_guest_detail_with_existing_guest(self, auth_headers):
        """Test getting guest detail - first get a guest ID from list"""
        # Get guest list first
        list_resp = requests.get(
            f"{BASE_URL}/api/manager/guests",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert list_resp.status_code == 200
        guests = list_resp.json().get("guests", [])
        
        if not guests:
            pytest.skip("No guests in database to test detail")
        
        guest_id = guests[0]["id"]
        
        # Get detail
        response = requests.get(
            f"{BASE_URL}/api/manager/guests/{guest_id}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "guest" in data
        assert "entries" in data
        assert "sessions" in data
        
        print(f"✅ PASS: Guest detail returns guest profile with {len(data['entries'])} entries, {len(data['sessions'])} sessions")


class TestManagerReports(TestAuthSetup):
    """
    Manager Reports: GET /api/manager/reports/sales
    """
    
    def test_sales_report_today(self, auth_headers):
        """Test sales report for today"""
        response = requests.get(
            f"{BASE_URL}/api/manager/reports/sales",
            params={"venue_id": VENUE_ID, "period": "today"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert data["period"] == "today"
        assert "by_item" in data
        assert "by_hour" in data
        assert "exceptions" in data
        assert "by_method" in data
        
        print(f"✅ PASS: Sales report for today returns {len(data['by_item'])} items, {len(data['by_hour'])} hours")
    
    def test_sales_report_week(self, auth_headers):
        """Test sales report for week"""
        response = requests.get(
            f"{BASE_URL}/api/manager/reports/sales",
            params={"venue_id": VENUE_ID, "period": "week"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["period"] == "week"
        print("✅ PASS: Sales report for week works")
    
    def test_sales_report_month(self, auth_headers):
        """Test sales report for month"""
        response = requests.get(
            f"{BASE_URL}/api/manager/reports/sales",
            params={"venue_id": VENUE_ID, "period": "month"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["period"] == "month"
        print("✅ PASS: Sales report for month works")


class TestManagerExport(TestAuthSetup):
    """
    Manager Reports Export: GET /api/manager/reports/export
    """
    
    def test_export_csv(self, auth_headers):
        """Test CSV export"""
        response = requests.get(
            f"{BASE_URL}/api/manager/reports/export",
            params={"venue_id": VENUE_ID, "period": "today"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        # Check content type is CSV
        content_type = response.headers.get("content-type", "")
        assert "text/csv" in content_type, f"Expected CSV, got {content_type}"
        
        # Check content has CSV headers
        content = response.text
        assert "Item" in content or "Revenue" in content or "Category" in content
        
        print("✅ PASS: CSV export works and returns CSV content")


class TestManagerLoyalty(TestAuthSetup):
    """
    Manager Loyalty: GET/POST /api/manager/loyalty
    """
    
    def test_get_loyalty_config(self, auth_headers):
        """Test getting loyalty config"""
        response = requests.get(
            f"{BASE_URL}/api/manager/loyalty",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "venue_id" in data
        assert "enabled" in data
        assert "points_per_dollar" in data
        assert "tiers" in data
        
        print(f"✅ PASS: Loyalty config returns enabled={data['enabled']}, points_per_dollar={data['points_per_dollar']}")
    
    def test_save_loyalty_config(self, auth_headers):
        """Test saving loyalty config"""
        response = requests.post(
            f"{BASE_URL}/api/manager/loyalty",
            data={
                "venue_id": VENUE_ID,
                "enabled": "true",
                "points_per_dollar": "2",
                "daily_limit": "600",
                "anti_fraud_max": "250"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("saved") == True
        
        print("✅ PASS: Loyalty config saved successfully")


class TestManagerSettings(TestAuthSetup):
    """
    Manager Settings: GET/PUT /api/manager/settings
    """
    
    def test_get_settings(self, auth_headers):
        """Test getting venue settings"""
        response = requests.get(
            f"{BASE_URL}/api/manager/settings",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "venue_id" in data
        print(f"✅ PASS: Settings returns venue config")
    
    def test_update_settings(self, auth_headers):
        """Test updating venue settings"""
        response = requests.put(
            f"{BASE_URL}/api/manager/settings",
            data={
                "venue_id": VENUE_ID,
                "venue_name": "Demo Club Updated",
                "bar_mode": "disco"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        assert data.get("updated") == True
        
        print("✅ PASS: Settings updated successfully")


class TestManagerShifts(TestAuthSetup):
    """
    Manager Shifts: POST /api/manager/shifts/close
    """
    
    def test_list_shifts(self, auth_headers):
        """Test listing shifts"""
        response = requests.get(
            f"{BASE_URL}/api/manager/shifts",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        assert "shifts" in data
        print(f"✅ PASS: Shifts list returns {len(data['shifts'])} shifts")
    
    def test_close_shift(self, auth_headers):
        """Test closing a shift with cash reconciliation"""
        response = requests.post(
            f"{BASE_URL}/api/manager/shifts/close",
            data={
                "venue_id": VENUE_ID,
                "shift_name": "TEST Evening Shift",
                "cash_expected": "500.00",
                "cash_actual": "495.50",
                "notes": "Test shift close"
            },
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "id" in data
        assert data["shift_name"] == "TEST Evening Shift"
        assert data["cash_difference"] == -4.5  # 495.50 - 500.00
        assert "revenue" in data
        assert "tabs_closed" in data
        
        print(f"✅ PASS: Shift closed with cash_diff=${data['cash_difference']}, revenue=${data['revenue']}")


class TestManagerAudit(TestAuthSetup):
    """
    Manager Audit: GET /api/manager/audit
    """
    
    def test_get_audit_trail(self, auth_headers):
        """Test getting audit trail"""
        response = requests.get(
            f"{BASE_URL}/api/manager/audit",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "events" in data
        print(f"✅ PASS: Audit trail returns {len(data['events'])} events")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
