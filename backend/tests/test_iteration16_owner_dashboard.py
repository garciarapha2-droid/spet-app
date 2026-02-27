"""
Iteration 16 - Owner Dashboard (Phase 3) API Tests
Tests all 7 Owner Dashboard API endpoints and the P0 regression test for user deletion protection.

Test coverage:
- Owner Dashboard Overview: GET /api/owner/dashboard
- Owner Venues Performance: GET /api/owner/venues
- Owner AI Insights: GET /api/owner/insights
- Owner Finance & Risk: GET /api/owner/finance
- Owner Growth & Loyalty: GET /api/owner/growth
- Owner People & Ops: GET /api/owner/people
- Owner System & Expansion: GET /api/owner/system
- P0 Regression: DELETE /api/auth/users/{id} returns 403 for protected account
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


class TestAuth:
    """Authentication - Get token for subsequent tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in login response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def user_id(self, auth_token):
        """Get the user ID from /auth/me"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_login_success(self):
        """Test login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL


class TestP0UserDeletionProtection:
    """P0 Regression - Protected user teste@teste.com cannot be deleted"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def user_id(self, auth_token):
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_delete_protected_user_returns_403(self, auth_token, user_id):
        """DELETE /api/auth/users/{id} should return 403 for protected teste@teste.com"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(f"{BASE_URL}/api/auth/users/{user_id}", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "System account" in data.get("detail", ""), f"Expected 'System account' in error, got: {data}"


class TestOwnerDashboard:
    """Owner Overview: GET /api/owner/dashboard"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_owner_dashboard(self, auth_token):
        """GET /api/owner/dashboard returns KPIs and venues list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/owner/dashboard", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check KPIs structure
        assert "kpis" in data, "Missing kpis in response"
        kpis = data["kpis"]
        
        # Verify required KPI fields
        required_kpis = [
            "revenue_today", "revenue_mtd", "revenue_ytd", "growth_pct",
            "estimated_profit", "avg_ticket", "arpu", "retention_pct",
            "total_guests_today", "open_tabs", "running_total", "closed_today"
        ]
        for field in required_kpis:
            assert field in kpis, f"Missing KPI field: {field}"
        
        # Check venues structure
        assert "venues" in data, "Missing venues in response"
        venues = data["venues"]
        assert isinstance(venues, list), "venues should be a list"
        
        # If venues exist, check structure
        if venues:
            venue = venues[0]
            venue_fields = ["venue_id", "name", "revenue_today", "open_tabs", "guests_today", "health"]
            for field in venue_fields:
                assert field in venue, f"Missing venue field: {field}"
            assert venue["health"] in ["green", "yellow", "red"], f"Invalid health status: {venue['health']}"


class TestOwnerVenues:
    """Owner Venues Performance: GET /api/owner/venues"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return response.json()["access_token"]
    
    def test_get_owner_venues(self, auth_token):
        """GET /api/owner/venues returns venues with health status, revenue, tabs, guests, avg_ticket, voids, staff_count, top_items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/owner/venues", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "venues" in data, "Missing venues in response"
        venues = data["venues"]
        assert isinstance(venues, list), "venues should be a list"
        
        if venues:
            venue = venues[0]
            # Verify required fields per spec
            required_fields = [
                "venue_id", "name", "health", "revenue_today", "revenue_month",
                "tabs_open", "tabs_closed_today", "guests_today", "avg_ticket",
                "voids_today", "staff_count", "top_items"
            ]
            for field in required_fields:
                assert field in venue, f"Missing venue field: {field}"
            
            # Health check
            assert venue["health"] in ["green", "yellow", "red"]
            
            # top_items structure
            assert isinstance(venue["top_items"], list), "top_items should be a list"


class TestOwnerInsights:
    """Owner AI Insights: GET /api/owner/insights"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return response.json()["access_token"]
    
    def test_get_owner_insights(self, auth_token):
        """GET /api/owner/insights returns rule-based insights with situation/impact/suggestion fields"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/owner/insights", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "insights" in data, "Missing insights in response"
        insights = data["insights"]
        assert isinstance(insights, list), "insights should be a list"
        
        # Note: insights may be empty if no rules are triggered - this is expected
        # If there are insights, verify structure
        if insights:
            insight = insights[0]
            required_fields = ["id", "venue", "type", "situation", "impact", "suggestion"]
            for field in required_fields:
                assert field in insight, f"Missing insight field: {field}"
            assert insight["type"] in ["critical", "warning", "info"], f"Invalid insight type: {insight['type']}"


class TestOwnerFinance:
    """Owner Finance & Risk: GET /api/owner/finance"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return response.json()["access_token"]
    
    def test_get_owner_finance(self, auth_token):
        """GET /api/owner/finance returns revenue_month, payments, voids_summary, risk_score"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/owner/finance", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        required_fields = ["revenue_month", "payments", "voids_summary", "risk_score"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Check payments structure
        assert isinstance(data["payments"], list), "payments should be a list"
        
        # Check voids_summary structure
        voids = data["voids_summary"]
        assert "count" in voids, "Missing count in voids_summary"
        assert "amount" in voids, "Missing amount in voids_summary"
        assert "rate_pct" in voids, "Missing rate_pct in voids_summary"
        
        # Risk score should be 0-100
        assert 0 <= data["risk_score"] <= 100, f"Invalid risk_score: {data['risk_score']}"


class TestOwnerGrowth:
    """Owner Growth & Loyalty: GET /api/owner/growth"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return response.json()["access_token"]
    
    def test_get_owner_growth(self, auth_token):
        """GET /api/owner/growth returns new_guests, returning_guests, ltv, loyalty_members, guest_growth_pct"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/owner/growth", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields per spec
        required_fields = [
            "new_guests", "returning_guests", "ltv", "loyalty_members", "guest_growth_pct"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Values should be numbers
        assert isinstance(data["new_guests"], (int, float))
        assert isinstance(data["returning_guests"], (int, float))
        assert isinstance(data["ltv"], (int, float))
        assert isinstance(data["loyalty_members"], (int, float))


class TestOwnerPeople:
    """Owner People & Ops: GET /api/owner/people"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return response.json()["access_token"]
    
    def test_get_owner_people(self, auth_token):
        """GET /api/owner/people returns total_staff and venues with staff_count"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/owner/people", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "total_staff" in data, "Missing total_staff"
        assert "venues" in data, "Missing venues"
        
        assert isinstance(data["total_staff"], (int, float))
        assert isinstance(data["venues"], list)
        
        if data["venues"]:
            venue = data["venues"][0]
            assert "venue_id" in venue
            assert "name" in venue
            assert "staff_count" in venue


class TestOwnerSystem:
    """Owner System & Expansion: GET /api/owner/system"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
        return response.json()["access_token"]
    
    def test_get_owner_system(self, auth_token):
        """GET /api/owner/system returns system_status, uptime, venues_count, subscriptions"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/owner/system", headers=headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        required_fields = ["system_status", "uptime", "venues_count", "subscriptions"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # system_status should be operational
        assert data["system_status"] == "operational", f"Unexpected status: {data['system_status']}"
        
        # venues_count should be >= 0
        assert data["venues_count"] >= 0
        
        # subscriptions should be a list
        assert isinstance(data["subscriptions"], list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
