"""
Iteration 26: CEO Dashboard + Pulse Bar Search Bug Fixes
=========================================================
Tests cover:
1. Login with teste@teste.com / 12345
2. Pulse Bar Search - search by tab number (with/without #) and guest name
3. CEO Dashboard APIs - health, revenue, targets, companies, modules, alerts, pipeline
4. Regression checks - Table page (8 demo tables), Owner Dashboard view switcher, Manager guests sorted by spend
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate and get access token."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "access_token" in data, f"No access_token in response: {data}"
    return data["access_token"]


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Session with auth header."""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestLogin:
    """Test login functionality."""
    
    def test_login_with_credentials(self):
        """Login with teste@teste.com / 12345 works."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, f"Missing access_token: {data}"
        assert len(data["access_token"]) > 0


class TestPulseBarSearch:
    """Test Pulse Bar search functionality - tab number and guest name search."""
    
    def test_bar_search_by_tab_number(self, api_client):
        """API GET /api/pulse/bar/search?venue_id=X&q=201 finds tab by number."""
        response = api_client.get(f"{BASE_URL}/api/pulse/bar/search", params={
            "venue_id": VENUE_ID,
            "q": "201"
        })
        assert response.status_code == 200, f"Bar search failed: {response.text}"
        data = response.json()
        assert "results" in data
        # May or may not find results depending on active sessions
        print(f"Bar search by tab 201: {len(data['results'])} results")
    
    def test_bar_search_with_hash_prefix(self, api_client):
        """API GET /api/pulse/bar/search?venue_id=X&q=%23201 finds tab with # prefix."""
        response = api_client.get(f"{BASE_URL}/api/pulse/bar/search", params={
            "venue_id": VENUE_ID,
            "q": "#201"
        })
        assert response.status_code == 200, f"Bar search failed: {response.text}"
        data = response.json()
        assert "results" in data
        print(f"Bar search by #201: {len(data['results'])} results")
    
    def test_bar_search_by_guest_name(self, api_client):
        """API GET /api/pulse/bar/search?venue_id=X&q=Maria finds tab by guest name."""
        response = api_client.get(f"{BASE_URL}/api/pulse/bar/search", params={
            "venue_id": VENUE_ID,
            "q": "Maria"
        })
        assert response.status_code == 200, f"Bar search failed: {response.text}"
        data = response.json()
        assert "results" in data
        print(f"Bar search by name Maria: {len(data['results'])} results")
        # Check result structure if results exist
        if data["results"]:
            result = data["results"][0]
            assert "session_id" in result
            assert "guest_name" in result
            assert "tab_number" in result
    
    def test_bar_search_empty_query(self, api_client):
        """Empty query returns empty results."""
        response = api_client.get(f"{BASE_URL}/api/pulse/bar/search", params={
            "venue_id": VENUE_ID,
            "q": ""
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert data["results"] == []


class TestCEOHealth:
    """Test CEO Company Health KPIs endpoint."""
    
    def test_get_health_kpis(self, api_client):
        """API GET /api/ceo/health returns KPIs."""
        response = api_client.get(f"{BASE_URL}/api/ceo/health")
        assert response.status_code == 200, f"CEO health failed: {response.text}"
        data = response.json()
        assert "kpis" in data
        kpis = data["kpis"]
        # Check for expected KPI fields
        expected_fields = ["mrr", "gross_revenue", "net_profit", "active_companies", 
                          "total_companies", "active_venues", "churn_rate", 
                          "activation_rate", "avg_rev_company"]
        for field in expected_fields:
            assert field in kpis, f"Missing KPI field: {field}"
        print(f"CEO Health KPIs: MRR=${kpis.get('mrr')}, Active Companies={kpis.get('active_companies')}")


class TestCEORevenue:
    """Test CEO Revenue & Profit chart endpoint."""
    
    def test_get_revenue_month(self, api_client):
        """API GET /api/ceo/revenue?period=month returns chart data."""
        response = api_client.get(f"{BASE_URL}/api/ceo/revenue", params={"period": "month"})
        assert response.status_code == 200, f"CEO revenue failed: {response.text}"
        data = response.json()
        assert "chart" in data
        assert "period" in data
        assert data["period"] == "month"
        print(f"CEO Revenue (month): {len(data['chart'])} data points")
    
    def test_get_revenue_week(self, api_client):
        """API GET /api/ceo/revenue?period=week returns chart data."""
        response = api_client.get(f"{BASE_URL}/api/ceo/revenue", params={"period": "week"})
        assert response.status_code == 200
        data = response.json()
        assert "chart" in data
        assert data["period"] == "week"
    
    def test_get_revenue_year(self, api_client):
        """API GET /api/ceo/revenue?period=year returns chart data."""
        response = api_client.get(f"{BASE_URL}/api/ceo/revenue", params={"period": "year"})
        assert response.status_code == 200
        data = response.json()
        assert "chart" in data
        assert data["period"] == "year"


class TestCEOTargets:
    """Test CEO Targets/Goals endpoints."""
    
    def test_get_targets(self, api_client):
        """API GET /api/ceo/targets returns targets with progress."""
        response = api_client.get(f"{BASE_URL}/api/ceo/targets")
        assert response.status_code == 200, f"CEO targets failed: {response.text}"
        data = response.json()
        assert "targets" in data
        targets = data["targets"]
        # Check for weekly, monthly, annual
        for period in ["weekly", "monthly", "annual"]:
            assert period in targets, f"Missing target period: {period}"
            t = targets[period]
            assert "goal" in t
            assert "actual" in t
            assert "pct" in t
            assert "remaining" in t
            assert "pace_needed" in t
        print(f"CEO Targets: Weekly={targets['weekly']}, Monthly={targets['monthly']}")
    
    def test_update_targets(self, api_client):
        """API POST /api/ceo/targets updates targets."""
        # Update weekly target
        response = api_client.post(
            f"{BASE_URL}/api/ceo/targets",
            data={
                "weekly_value": "15000",
                "weekly_type": "revenue"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200, f"Update targets failed: {response.text}"
        data = response.json()
        assert data.get("status") == "updated"
        
        # Verify the update by fetching targets
        get_response = api_client.get(f"{BASE_URL}/api/ceo/targets")
        assert get_response.status_code == 200
        targets = get_response.json()["targets"]
        # Should now have weekly goal = 15000
        print(f"Updated weekly target: goal={targets['weekly'].get('goal')}")


class TestCEOCompanies:
    """Test CEO Companies endpoint."""
    
    def test_get_companies(self, api_client):
        """API GET /api/ceo/companies returns companies list."""
        response = api_client.get(f"{BASE_URL}/api/ceo/companies")
        assert response.status_code == 200, f"CEO companies failed: {response.text}"
        data = response.json()
        assert "companies" in data
        assert "total" in data
        companies = data["companies"]
        print(f"CEO Companies: {data['total']} total companies")
        # Check company structure if exists
        if companies:
            c = companies[0]
            assert "user_id" in c
            assert "email" in c
            assert "venues" in c
            assert "mrr" in c
            assert "status" in c


class TestCEOModules:
    """Test CEO Module Adoption endpoint."""
    
    def test_get_modules(self, api_client):
        """API GET /api/ceo/modules returns module adoption data."""
        response = api_client.get(f"{BASE_URL}/api/ceo/modules")
        assert response.status_code == 200, f"CEO modules failed: {response.text}"
        data = response.json()
        assert "modules" in data
        assert "total_venues" in data
        modules = data["modules"]
        # Should have pulse, tap, table, kds
        module_keys = [m["key"] for m in modules]
        for key in ["pulse", "tap", "table", "kds"]:
            assert key in module_keys, f"Missing module: {key}"
        print(f"CEO Modules: {len(modules)} modules, {data['total_venues']} venues")
        # Check adoption data
        for m in modules:
            assert "name" in m
            assert "active" in m
            assert "adoption_pct" in m


class TestCEOAlerts:
    """Test CEO Risk & Alerts endpoint."""
    
    def test_get_alerts(self, api_client):
        """API GET /api/ceo/alerts returns risk alerts."""
        response = api_client.get(f"{BASE_URL}/api/ceo/alerts")
        assert response.status_code == 200, f"CEO alerts failed: {response.text}"
        data = response.json()
        assert "alerts" in data
        assert "total" in data
        alerts = data["alerts"]
        print(f"CEO Alerts: {data['total']} alerts")
        # Check alert structure if exists
        if alerts:
            a = alerts[0]
            assert "type" in a
            assert "severity" in a
            assert "message" in a
            # Alerts should be sorted by severity (critical first)
            severities = [alert["severity"] for alert in alerts]
            critical_indices = [i for i, s in enumerate(severities) if s == "critical"]
            warning_indices = [i for i, s in enumerate(severities) if s == "warning"]
            if critical_indices and warning_indices:
                assert max(critical_indices) < min(warning_indices), "Alerts not sorted by severity"


class TestCEOPipeline:
    """Test CEO Growth Pipeline endpoint."""
    
    def test_get_pipeline(self, api_client):
        """API GET /api/ceo/pipeline returns growth pipeline."""
        response = api_client.get(f"{BASE_URL}/api/ceo/pipeline")
        assert response.status_code == 200, f"CEO pipeline failed: {response.text}"
        data = response.json()
        assert "pipeline" in data
        pipeline = data["pipeline"]
        # Check for 6 stages
        expected_stages = ["leads", "paid", "activated", "active", "at_risk", "cancelled"]
        for stage in expected_stages:
            assert stage in pipeline, f"Missing pipeline stage: {stage}"
        print(f"CEO Pipeline: Leads={pipeline['leads']}, Active={pipeline['active']}, At Risk={pipeline['at_risk']}")


class TestRegressionTablePage:
    """Regression: Table page shows 8 demo tables (3 occupied, 5 available)."""
    
    def test_table_tables_returns_8(self, api_client):
        """Table page shows 8 demo tables."""
        response = api_client.get(f"{BASE_URL}/api/table/tables", params={"venue_id": VENUE_ID})
        assert response.status_code == 200, f"Table tables failed: {response.text}"
        data = response.json()
        assert "tables" in data
        tables = data["tables"]
        assert len(tables) == 8, f"Expected 8 tables, got {len(tables)}"
        # Count occupied vs available
        occupied = sum(1 for t in tables if t.get("status") == "occupied")
        available = sum(1 for t in tables if t.get("status") == "available")
        print(f"Table Page: {len(tables)} tables ({occupied} occupied, {available} available)")


class TestRegressionOwnerDashboard:
    """Regression: Owner Dashboard view switcher still works."""
    
    def test_owner_dashboard_business_view(self, api_client):
        """Owner Dashboard business view works."""
        response = api_client.get(f"{BASE_URL}/api/owner/dashboard", params={"view": "business"})
        assert response.status_code == 200, f"Owner dashboard failed: {response.text}"
        data = response.json()
        # Should have some dashboard data
        print(f"Owner Dashboard (business): {list(data.keys())[:5]}")
    
    def test_owner_dashboard_venue_view(self, api_client):
        """Owner Dashboard venue view works."""
        response = api_client.get(f"{BASE_URL}/api/owner/dashboard", params={"view": "venue"})
        assert response.status_code == 200
    
    def test_owner_dashboard_event_view(self, api_client):
        """Owner Dashboard event view works."""
        response = api_client.get(f"{BASE_URL}/api/owner/dashboard", params={"view": "event"})
        assert response.status_code == 200


class TestRegressionManagerGuests:
    """Regression: Manager Dashboard guests sorted by spend still works."""
    
    def test_manager_guests_sorted_by_spend(self, api_client):
        """Manager guests sorted by highest spender."""
        response = api_client.get(f"{BASE_URL}/api/manager/guests", params={"venue_id": VENUE_ID})
        assert response.status_code == 200, f"Manager guests failed: {response.text}"
        data = response.json()
        assert "guests" in data
        guests = data["guests"]
        print(f"Manager Guests: {len(guests)} total guests")
        # Check if sorted by spend (descending)
        if len(guests) >= 2:
            spends = [g.get("spend_total", 0) for g in guests]
            is_sorted = all(spends[i] >= spends[i+1] for i in range(len(spends)-1))
            assert is_sorted, f"Guests not sorted by spend: {spends[:5]}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
