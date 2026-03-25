"""
Iteration 91: Comprehensive Mobile Dashboard API Tests

Tests ALL backend API endpoints that the mobile app dashboards depend on:
- Auth: POST /api/auth/login
- CEO Dashboard: /api/ceo/health, /api/ceo/revenue, /api/ceo/pipeline, /api/ceo/users
- Manager Dashboard: /api/manager/overview, /api/manager/staff, /api/manager/shifts, 
                     /api/manager/reports/sales, /api/manager/tips-detail, /api/manager/guests
- Owner Dashboard: /api/owner/dashboard, /api/owner/finance, /api/owner/growth, 
                   /api/owner/insights, /api/owner/system
- Operational Modules: /api/tap/stats, /api/tap/catalog, /api/table/tables, 
                       /api/kds/tickets, /api/rewards/config
- Web App: / (landing), /app (dashboard)

All APIs require Bearer token authentication obtained via POST /api/auth/login.
Response format is {success: true, data: {...}, error: null}
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for all tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": CEO_EMAIL,
        "password": CEO_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.text}")
    
    data = response.json()
    if not data.get("success"):
        pytest.skip(f"Authentication not successful: {data}")
    
    token = data.get("data", {}).get("access_token")
    if not token:
        pytest.skip("No access token received")
    
    return token


@pytest.fixture
def auth_headers(auth_token):
    """Headers with Bearer token for authenticated requests"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ═══════════════════════════════════════════════════════════════════
# AUTH TESTS
# ═══════════════════════════════════════════════════════════════════

class TestAuthLogin:
    """Test authentication endpoint for CEO credentials"""
    
    def test_login_ceo_success(self):
        """POST /api/auth/login with CEO credentials returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "access_token" in payload, f"No access_token in response: {payload}"
        assert "user" in payload, f"No user in response: {payload}"
        assert payload["user"]["email"] == CEO_EMAIL
        
        print(f"✓ CEO login successful, token received")


# ═══════════════════════════════════════════════════════════════════
# CEO DASHBOARD TESTS
# ═══════════════════════════════════════════════════════════════════

class TestCEODashboardAPIs:
    """CEO Dashboard API endpoints"""
    
    def test_ceo_health_returns_kpis(self, auth_headers):
        """GET /api/ceo/health returns kpis object with mrr, active_companies, active_venues"""
        response = requests.get(f"{BASE_URL}/api/ceo/health", headers=auth_headers)
        
        assert response.status_code == 200, f"CEO health failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "kpis" in payload, f"No kpis in response: {payload}"
        
        kpis = payload["kpis"]
        # Verify expected KPI fields exist
        expected_fields = ["mrr", "active_companies", "active_venues"]
        for field in expected_fields:
            assert field in kpis, f"Missing KPI field '{field}' in: {kpis}"
        
        # Verify data types
        assert isinstance(kpis["mrr"], (int, float)), f"mrr should be numeric: {kpis['mrr']}"
        assert isinstance(kpis["active_companies"], (int, float)), f"active_companies should be numeric"
        assert isinstance(kpis["active_venues"], (int, float)), f"active_venues should be numeric"
        
        print(f"✓ CEO health KPIs: mrr={kpis['mrr']}, companies={kpis['active_companies']}, venues={kpis['active_venues']}")
    
    def test_ceo_revenue_returns_chart(self, auth_headers):
        """GET /api/ceo/revenue?period=month returns chart array with period, revenue, profit, fees"""
        response = requests.get(f"{BASE_URL}/api/ceo/revenue?period=month", headers=auth_headers)
        
        assert response.status_code == 200, f"CEO revenue failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "chart" in payload, f"No chart in response: {payload}"
        assert "period" in payload, f"No period in response: {payload}"
        
        chart = payload["chart"]
        assert isinstance(chart, list), f"chart should be array: {type(chart)}"
        
        # If there's data, verify structure
        if len(chart) > 0:
            item = chart[0]
            expected_fields = ["revenue", "profit", "fees"]
            for field in expected_fields:
                assert field in item, f"Missing chart field '{field}' in: {item}"
            print(f"✓ CEO revenue chart has {len(chart)} data points with revenue/profit/fees")
        else:
            print(f"✓ CEO revenue chart returned (empty - no data for period)")
    
    def test_ceo_pipeline_returns_funnel(self, auth_headers):
        """GET /api/ceo/pipeline returns pipeline object with leads, paid, activated, active, at_risk, cancelled"""
        response = requests.get(f"{BASE_URL}/api/ceo/pipeline", headers=auth_headers)
        
        assert response.status_code == 200, f"CEO pipeline failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "pipeline" in payload, f"No pipeline in response: {payload}"
        
        pipeline = payload["pipeline"]
        expected_fields = ["leads", "paid", "activated", "active", "at_risk", "cancelled"]
        for field in expected_fields:
            assert field in pipeline, f"Missing pipeline field '{field}' in: {pipeline}"
            assert isinstance(pipeline[field], (int, float)), f"Pipeline {field} should be numeric"
        
        print(f"✓ CEO pipeline: leads={pipeline['leads']}, paid={pipeline['paid']}, active={pipeline['active']}, at_risk={pipeline['at_risk']}")
    
    def test_ceo_users_returns_array(self, auth_headers):
        """GET /api/ceo/users returns users array with email, status, roles"""
        response = requests.get(f"{BASE_URL}/api/ceo/users", headers=auth_headers)
        
        assert response.status_code == 200, f"CEO users failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "users" in payload, f"No users in response: {payload}"
        
        users = payload["users"]
        assert isinstance(users, list), f"users should be array: {type(users)}"
        
        # Verify at least one user exists (the CEO)
        assert len(users) > 0, "Expected at least one user"
        
        # Verify user structure
        user = users[0]
        expected_fields = ["email", "status", "roles"]
        for field in expected_fields:
            assert field in user, f"Missing user field '{field}' in: {user}"
        
        assert isinstance(user["roles"], list), f"roles should be array: {type(user['roles'])}"
        
        print(f"✓ CEO users: {len(users)} users returned with email/status/roles")


# ═══════════════════════════════════════════════════════════════════
# MANAGER DASHBOARD TESTS
# ═══════════════════════════════════════════════════════════════════

class TestManagerDashboardAPIs:
    """Manager Dashboard API endpoints"""
    
    def test_manager_overview_returns_kpis_charts_alerts(self, auth_headers):
        """GET /api/manager/overview?venue_id=... returns kpis, charts, alerts"""
        response = requests.get(
            f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Manager overview failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify kpis
        assert "kpis" in payload, f"No kpis in response: {payload}"
        kpis = payload["kpis"]
        kpi_fields = ["revenue_today", "revenue_week", "open_tabs", "avg_ticket"]
        for field in kpi_fields:
            assert field in kpis, f"Missing KPI field '{field}' in: {kpis}"
        
        # Verify charts
        assert "charts" in payload, f"No charts in response: {payload}"
        
        # Verify alerts
        assert "alerts" in payload, f"No alerts in response: {payload}"
        assert isinstance(payload["alerts"], list), f"alerts should be array"
        
        print(f"✓ Manager overview: revenue_today=${kpis['revenue_today']}, open_tabs={kpis['open_tabs']}, avg_ticket=${kpis['avg_ticket']}")
    
    def test_manager_staff_returns_array(self, auth_headers):
        """GET /api/manager/staff?venue_id=... returns staff array with email, role, status"""
        response = requests.get(
            f"{BASE_URL}/api/manager/staff?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Manager staff failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "staff" in payload, f"No staff in response: {payload}"
        
        staff = payload["staff"]
        assert isinstance(staff, list), f"staff should be array: {type(staff)}"
        
        # Also check for barmen (servers from MongoDB)
        if "barmen" in payload:
            assert isinstance(payload["barmen"], list), f"barmen should be array"
            print(f"✓ Manager staff: {len(staff)} staff users, {len(payload.get('barmen', []))} barmen")
        else:
            print(f"✓ Manager staff: {len(staff)} staff users")
    
    def test_manager_shifts_returns_array(self, auth_headers):
        """GET /api/manager/shifts?venue_id=... returns shifts data"""
        response = requests.get(
            f"{BASE_URL}/api/manager/shifts?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Manager shifts failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "shifts" in payload, f"No shifts in response: {payload}"
        
        shifts = payload["shifts"]
        assert isinstance(shifts, list), f"shifts should be array: {type(shifts)}"
        
        print(f"✓ Manager shifts: {len(shifts)} shifts returned")
    
    def test_manager_reports_sales_returns_data(self, auth_headers):
        """GET /api/manager/reports/sales?venue_id=... returns by_item, by_method arrays"""
        response = requests.get(
            f"{BASE_URL}/api/manager/reports/sales?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Manager reports/sales failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify expected fields
        assert "period" in payload, f"No period in response: {payload}"
        assert "by_item" in payload, f"No by_item in response: {payload}"
        assert "by_method" in payload, f"No by_method in response: {payload}"
        
        assert isinstance(payload["by_item"], list), f"by_item should be array"
        assert isinstance(payload["by_method"], list), f"by_method should be array"
        
        print(f"✓ Manager sales report: period={payload['period']}, {len(payload['by_item'])} items, {len(payload['by_method'])} payment methods")
    
    def test_manager_tips_detail_returns_data(self, auth_headers):
        """GET /api/manager/tips-detail?venue_id=... returns tips data"""
        response = requests.get(
            f"{BASE_URL}/api/manager/tips-detail?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Manager tips-detail failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify expected fields
        assert "tips" in payload, f"No tips in response: {payload}"
        assert "total_tips" in payload, f"No total_tips in response: {payload}"
        assert "count" in payload, f"No count in response: {payload}"
        
        assert isinstance(payload["tips"], list), f"tips should be array"
        assert isinstance(payload["total_tips"], (int, float)), f"total_tips should be numeric"
        
        print(f"✓ Manager tips-detail: {len(payload['tips'])} tips, total=${payload['total_tips']}")
    
    def test_manager_guests_returns_array(self, auth_headers):
        """GET /api/manager/guests?venue_id=... returns guests array"""
        response = requests.get(
            f"{BASE_URL}/api/manager/guests?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Manager guests failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        assert "guests" in payload, f"No guests in response: {payload}"
        assert "total" in payload, f"No total in response: {payload}"
        
        guests = payload["guests"]
        assert isinstance(guests, list), f"guests should be array: {type(guests)}"
        
        print(f"✓ Manager guests: {len(guests)} guests returned, total={payload['total']}")


# ═══════════════════════════════════════════════════════════════════
# OWNER DASHBOARD TESTS
# ═══════════════════════════════════════════════════════════════════

class TestOwnerDashboardAPIs:
    """Owner Dashboard API endpoints"""
    
    def test_owner_dashboard_business_view(self, auth_headers):
        """GET /api/owner/dashboard?view=business returns kpis.revenue_mtd, venues array with health, revenue_today"""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard?view=business",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Owner dashboard failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify view
        assert payload.get("view") == "business", f"Expected business view: {payload.get('view')}"
        
        # Verify kpis
        assert "kpis" in payload, f"No kpis in response: {payload}"
        kpis = payload["kpis"]
        assert "revenue_mtd" in kpis, f"No revenue_mtd in kpis: {kpis}"
        
        # Verify venues array
        assert "venues" in payload, f"No venues in response: {payload}"
        assert isinstance(payload["venues"], list), f"venues should be array"
        
        # Verify venue structure if venues exist
        if len(payload["venues"]) > 0:
            venue = payload["venues"][0]
            assert "health" in venue, f"No health in venue: {venue}"
            assert "revenue_today" in venue, f"No revenue_today in venue: {venue}"
        
        print(f"✓ Owner dashboard (business): revenue_mtd=${kpis.get('revenue_mtd', 0)}, {len(payload['venues'])} venues")
    
    def test_owner_finance_returns_data(self, auth_headers):
        """GET /api/owner/finance returns revenue_month, payments, voids_summary, risk_score, chargebacks"""
        response = requests.get(f"{BASE_URL}/api/owner/finance", headers=auth_headers)
        
        assert response.status_code == 200, f"Owner finance failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify expected fields
        expected_fields = ["revenue_month", "payments", "voids_summary", "risk_score"]
        for field in expected_fields:
            assert field in payload, f"Missing field '{field}' in: {payload}"
        
        assert isinstance(payload["payments"], list), f"payments should be array"
        assert isinstance(payload["voids_summary"], dict), f"voids_summary should be object"
        assert isinstance(payload["risk_score"], (int, float)), f"risk_score should be numeric"
        
        # Check for chargebacks field
        assert "chargebacks" in payload, f"No chargebacks in response: {payload}"
        
        print(f"✓ Owner finance: revenue_month=${payload['revenue_month']}, risk_score={payload['risk_score']}")
    
    def test_owner_growth_returns_data(self, auth_headers):
        """GET /api/owner/growth returns growth data"""
        response = requests.get(f"{BASE_URL}/api/owner/growth", headers=auth_headers)
        
        assert response.status_code == 200, f"Owner growth failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify expected fields
        expected_fields = ["new_guests", "returning_guests", "ltv", "loyalty_members"]
        for field in expected_fields:
            assert field in payload, f"Missing field '{field}' in: {payload}"
        
        print(f"✓ Owner growth: new_guests={payload['new_guests']}, returning={payload['returning_guests']}, ltv=${payload['ltv']}")
    
    def test_owner_insights_returns_data(self, auth_headers):
        """GET /api/owner/insights returns insights data"""
        response = requests.get(f"{BASE_URL}/api/owner/insights", headers=auth_headers)
        
        assert response.status_code == 200, f"Owner insights failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify insights array
        assert "insights" in payload, f"No insights in response: {payload}"
        assert isinstance(payload["insights"], list), f"insights should be array"
        
        print(f"✓ Owner insights: {len(payload['insights'])} insights returned")
    
    def test_owner_system_returns_venues(self, auth_headers):
        """GET /api/owner/system returns venues with active status"""
        response = requests.get(f"{BASE_URL}/api/owner/system", headers=auth_headers)
        
        assert response.status_code == 200, f"Owner system failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify expected fields
        assert "venues_count" in payload, f"No venues_count in response: {payload}"
        assert "system_status" in payload, f"No system_status in response: {payload}"
        
        print(f"✓ Owner system: {payload['venues_count']} venues, status={payload['system_status']}")


# ═══════════════════════════════════════════════════════════════════
# OPERATIONAL MODULE TESTS
# ═══════════════════════════════════════════════════════════════════

class TestOperationalModuleAPIs:
    """Operational module API endpoints (TAP, Table, KDS, Rewards)"""
    
    def test_tap_stats_returns_data(self, auth_headers):
        """GET /api/tap/stats?venue_id=... returns tap statistics"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"TAP stats failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify expected fields
        expected_fields = ["open_tabs", "running_total", "closed_today", "revenue_today"]
        for field in expected_fields:
            assert field in payload, f"Missing field '{field}' in: {payload}"
            assert isinstance(payload[field], (int, float)), f"{field} should be numeric"
        
        print(f"✓ TAP stats: open_tabs={payload['open_tabs']}, running_total=${payload['running_total']}, revenue_today=${payload['revenue_today']}")
    
    def test_tap_catalog_returns_items(self, auth_headers):
        """GET /api/tap/catalog?venue_id=... returns items array"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"TAP catalog failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "items" in payload, f"No items in response: {payload}"
        
        items = payload["items"]
        assert isinstance(items, list), f"items should be array"
        
        if len(items) > 0:
            item = items[0]
            expected_fields = ["id", "name", "price", "category"]
            for field in expected_fields:
                assert field in item, f"Missing catalog field '{field}' in: {item}"
        
        print(f"✓ TAP catalog: {len(items)} items")
    
    def test_table_tables_returns_array(self, auth_headers):
        """GET /api/table/tables?venue_id=... returns tables array"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Table tables failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        assert "tables" in payload, f"No tables in response: {payload}"
        tables = payload["tables"]
        assert isinstance(tables, list), f"tables should be array: {type(tables)}"
        
        # Verify table structure if tables exist
        if len(tables) > 0:
            table = tables[0]
            expected_fields = ["id", "table_number", "status", "capacity"]
            for field in expected_fields:
                assert field in table, f"Missing table field '{field}' in: {table}"
        
        print(f"✓ Table tables: {len(tables)} tables returned")
    
    def test_kds_tickets_returns_array(self, auth_headers):
        """GET /api/kds/tickets?venue_id=... returns tickets array"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"KDS tickets failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        assert "tickets" in payload, f"No tickets in response: {payload}"
        tickets = payload["tickets"]
        assert isinstance(tickets, list), f"tickets should be array: {type(tickets)}"
        
        # Verify ticket structure if tickets exist
        if len(tickets) > 0:
            ticket = tickets[0]
            expected_fields = ["id", "status", "destination", "items"]
            for field in expected_fields:
                assert field in ticket, f"Missing ticket field '{field}' in: {ticket}"
            assert isinstance(ticket["items"], list), f"ticket items should be array"
        
        print(f"✓ KDS tickets: {len(tickets)} tickets returned")
    
    def test_rewards_config_returns_data(self, auth_headers):
        """GET /api/rewards/config?venue_id=... returns rewards config"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/config?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Rewards config failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        
        # Verify expected fields
        assert "venue_id" in payload, f"No venue_id in response: {payload}"
        assert "enabled" in payload, f"No enabled in response: {payload}"
        assert "tiers" in payload, f"No tiers in response: {payload}"
        
        assert isinstance(payload["tiers"], list), f"tiers should be array"
        
        print(f"✓ Rewards config: enabled={payload['enabled']}, {len(payload['tiers'])} tiers")


# ═══════════════════════════════════════════════════════════════════
# WEB APP ACCESSIBILITY TESTS
# ═══════════════════════════════════════════════════════════════════

class TestWebAppAccessibility:
    """Web app landing page and dashboard accessibility"""
    
    def test_landing_page_loads(self):
        """Web app landing page loads at / returns 200"""
        response = requests.get(f"{BASE_URL}/", timeout=10)
        
        assert response.status_code == 200, f"Landing page failed: {response.status_code}"
        
        # Check that it returns HTML content
        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type, f"Expected HTML content, got: {content_type}"
        
        print(f"✓ Landing page loads successfully (status 200)")
    
    def test_app_dashboard_loads(self):
        """Web app dashboard loads at /app returns 200"""
        response = requests.get(f"{BASE_URL}/app", timeout=10)
        
        # /app may redirect or return 200 directly
        assert response.status_code in [200, 302, 304], f"Dashboard page failed: {response.status_code}"
        
        print(f"✓ Dashboard page loads successfully (status {response.status_code})")


# ═══════════════════════════════════════════════════════════════════
# ADDITIONAL MOBILE SERVICE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════

class TestMobileServiceEndpoints:
    """Additional endpoints used by mobile services"""
    
    def test_tap_sessions_open(self, auth_headers):
        """GET /api/tap/sessions?venue_id=...&status=open returns open sessions"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}&status=open",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"TAP sessions failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Response not successful: {data}"
        
        payload = data.get("data", {})
        assert "sessions" in payload, f"No sessions in response: {payload}"
        
        sessions = payload["sessions"]
        assert isinstance(sessions, list), f"sessions should be array"
        
        print(f"✓ TAP open sessions: {len(sessions)} sessions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
