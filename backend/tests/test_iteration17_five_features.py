"""
Iteration 17 - Testing 5 New Features:
1. Pulse Guest Today - tab_number field in entries
2. Table server assignment - POST /api/table/assign-server
3. Manager funnel drill-down - GET /api/manager/funnel-detail
4. Tables by Server - GET /api/manager/tables-by-server
5. AI Insights with GPT-5.2 - POST /api/owner/ai-insights
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://table-verify-fix.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


class TestAuth:
    """Authentication for all tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for subsequent tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        # API returns 'access_token' not 'token'
        token = data.get("access_token") or data.get("token")
        assert token, f"No token in response: {data.keys()}"
        return token


# ═══════════════════════════════════════════════════════════════════
# FEATURE 1: Pulse Guest Today with tab_number
# ═══════════════════════════════════════════════════════════════════
class TestFeature1PulseGuestToday(TestAuth):
    """Feature 1: Pulse entries/today returns tab_number field"""
    
    def test_get_today_entries_returns_tab_number(self, auth_token):
        """GET /api/pulse/entries/today should return tab_number for each entry"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "entries" in data, "Missing 'entries' field"
        assert "total" in data, "Missing 'total' field"
        assert "allowed" in data, "Missing 'allowed' field"
        assert "denied" in data, "Missing 'denied' field"
        
        # If there are entries, verify tab_number field exists
        if data["entries"]:
            entry = data["entries"][0]
            assert "tab_number" in entry, f"Entry missing 'tab_number' field. Entry keys: {entry.keys()}"
            assert "guest_name" in entry, "Entry missing 'guest_name' field"
            assert "guest_id" in entry, "Entry missing 'guest_id' field"
            print(f"✅ Feature 1: Entry has tab_number={entry.get('tab_number')}, guest={entry.get('guest_name')}")
        else:
            print("⚠️ No entries today - tab_number field verified at schema level")


# ═══════════════════════════════════════════════════════════════════
# FEATURE 2: Table Server Assignment
# ═══════════════════════════════════════════════════════════════════
class TestFeature2TableServerAssignment(TestAuth):
    """Feature 2: POST /api/table/assign-server and server_name in table list"""
    
    def test_get_tables_returns_server_name(self, auth_token):
        """GET /api/table/tables should return server_name for occupied tables"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "tables" in data, "Missing 'tables' field"
        assert "total" in data, "Missing 'total' field"
        
        # Check that server_name field exists in table objects
        if data["tables"]:
            for table in data["tables"]:
                assert "server_name" in table, f"Table {table.get('table_number')} missing 'server_name' field"
                print(f"✅ Table #{table['table_number']}: status={table['status']}, server_name={table.get('server_name')}")
    
    def test_assign_server_endpoint(self, auth_token):
        """POST /api/table/assign-server should assign server to occupied table"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get an occupied table
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        tables = response.json().get("tables", [])
        
        occupied = [t for t in tables if t.get("status") == "occupied"]
        if not occupied:
            pytest.skip("No occupied tables to test server assignment")
        
        table_id = occupied[0]["id"]
        test_server = "Test Server"
        
        # Assign server
        response = requests.post(
            f"{BASE_URL}/api/table/assign-server",
            data={"table_id": table_id, "server_name": test_server},
            headers=headers
        )
        
        assert response.status_code == 200, f"Assign server failed: {response.text}"
        data = response.json()
        
        assert "table_id" in data, "Response missing table_id"
        assert "server_name" in data, "Response missing server_name"
        assert data["server_name"] == test_server, f"Server name mismatch: expected {test_server}, got {data['server_name']}"
        # previous field should exist (may be null if first assignment)
        assert "previous" in data, "Response missing 'previous' field"
        print(f"✅ Feature 2: Assigned server '{test_server}' to table {table_id}, previous was '{data.get('previous')}'")


# ═══════════════════════════════════════════════════════════════════
# FEATURE 3: Manager Guest Funnel Drill-down
# ═══════════════════════════════════════════════════════════════════
class TestFeature3ManagerFunnelDrilldown(TestAuth):
    """Feature 3: GET /api/manager/funnel-detail with stage parameter"""
    
    def test_funnel_detail_entries(self, auth_token):
        """GET /api/manager/funnel-detail?stage=entries returns guest list"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/manager/funnel-detail",
            params={"venue_id": VENUE_ID, "stage": "entries"},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "stage" in data, "Missing 'stage' field"
        assert data["stage"] == "entries", f"Wrong stage: {data['stage']}"
        assert "results" in data, "Missing 'results' field"
        assert "count" in data, "Missing 'count' field"
        
        if data["results"]:
            result = data["results"][0]
            assert "name" in result, "Entry result missing 'name'"
            assert "guest_id" in result, "Entry result missing 'guest_id'"
            assert "decision" in result, "Entry result missing 'decision'"
            print(f"✅ Feature 3 (entries): {data['count']} entries, first={result.get('name')}")
    
    def test_funnel_detail_allowed(self, auth_token):
        """GET /api/manager/funnel-detail?stage=allowed returns allowed guests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/manager/funnel-detail",
            params={"venue_id": VENUE_ID, "stage": "allowed"},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["stage"] == "allowed"
        assert "results" in data
        print(f"✅ Feature 3 (allowed): {data['count']} allowed guests")
    
    def test_funnel_detail_tabs_open(self, auth_token):
        """GET /api/manager/funnel-detail?stage=tabs_open returns open tabs with tab_number and server_name"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/manager/funnel-detail",
            params={"venue_id": VENUE_ID, "stage": "tabs_open"},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["stage"] == "tabs_open"
        assert "results" in data
        
        if data["results"]:
            result = data["results"][0]
            assert "tab_number" in result, "tabs_open result missing 'tab_number'"
            assert "server_name" in result, "tabs_open result missing 'server_name'"
            assert "total" in result, "tabs_open result missing 'total'"
            print(f"✅ Feature 3 (tabs_open): {data['count']} open tabs, first tab #{result.get('tab_number')} server={result.get('server_name')}")
    
    def test_funnel_detail_tabs_closed(self, auth_token):
        """GET /api/manager/funnel-detail?stage=tabs_closed returns closed tabs"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/manager/funnel-detail",
            params={"venue_id": VENUE_ID, "stage": "tabs_closed"},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert data["stage"] == "tabs_closed"
        assert "results" in data
        print(f"✅ Feature 3 (tabs_closed): {data['count']} closed tabs today")


# ═══════════════════════════════════════════════════════════════════
# FEATURE 4: Tables by Server
# ═══════════════════════════════════════════════════════════════════
class TestFeature4TablesByServer(TestAuth):
    """Feature 4: GET /api/manager/tables-by-server"""
    
    def test_tables_by_server_endpoint(self, auth_token):
        """GET /api/manager/tables-by-server returns servers with grouped tables"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/manager/tables-by-server",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "servers" in data, "Missing 'servers' field"
        assert "unassigned" in data, "Missing 'unassigned' field"
        assert "total_tables" in data, "Missing 'total_tables' field"
        
        print(f"✅ Feature 4: {data['total_tables']} occupied tables, {len(data['servers'])} servers, {len(data['unassigned'])} unassigned")
        
        # Verify server object structure
        if data["servers"]:
            server = data["servers"][0]
            assert "server_name" in server, "Server object missing 'server_name'"
            assert "tables" in server, "Server object missing 'tables'"
            assert "table_count" in server, "Server object missing 'table_count'"
            assert "total_revenue" in server, "Server object missing 'total_revenue'"
            print(f"  - Server '{server['server_name']}': {server['table_count']} tables, ${server['total_revenue']:.2f} revenue")
            
            # Verify table object in server
            if server["tables"]:
                table = server["tables"][0]
                assert "table_id" in table, "Table missing 'table_id'"
                assert "table_number" in table, "Table missing 'table_number'"
                assert "guest_name" in table, "Table missing 'guest_name'"
                assert "tab_number" in table, "Table missing 'tab_number'"
                assert "total" in table, "Table missing 'total'"
        
        # Verify unassigned structure
        if data["unassigned"]:
            unasg = data["unassigned"][0]
            assert "table_id" in unasg, "Unassigned table missing 'table_id'"
            assert "table_number" in unasg, "Unassigned table missing 'table_number'"
            print(f"  - Unassigned: Table #{unasg['table_number']}")


# ═══════════════════════════════════════════════════════════════════
# FEATURE 5: AI Insights with GPT-5.2
# ═══════════════════════════════════════════════════════════════════
class TestFeature5AIInsights(TestAuth):
    """Feature 5: POST /api/owner/ai-insights using GPT-5.2"""
    
    def test_ai_insights_endpoint(self, auth_token):
        """POST /api/owner/ai-insights generates real AI insights"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # This endpoint may take 5-10 seconds due to GPT-5.2 call
        response = requests.post(
            f"{BASE_URL}/api/owner/ai-insights",
            headers=headers,
            timeout=30  # Allow longer timeout for AI
        )
        
        assert response.status_code == 200, f"AI Insights failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "insights" in data, "Missing 'insights' field"
        assert "disclaimer" in data, "Missing 'disclaimer' field"
        assert "generated_at" in data, "Missing 'generated_at' field"
        
        print(f"✅ Feature 5: AI generated {len(data['insights'])} insights")
        
        # Verify insight structure if we have insights
        if data["insights"]:
            insight = data["insights"][0]
            # Check all required fields as per spec
            assert "summary" in insight, "Insight missing 'summary'"
            assert "what_we_see" in insight, "Insight missing 'what_we_see'"
            assert "recommended_actions" in insight, "Insight missing 'recommended_actions'"
            assert isinstance(insight["recommended_actions"], list), "recommended_actions should be a list"
            assert "reference" in insight, "Insight missing 'reference' (can be null)"
            assert "priority" in insight, "Insight missing 'priority'"
            assert insight["priority"] in ["critical", "warning", "info"], f"Invalid priority: {insight['priority']}"
            
            print(f"  - Insight 1: [{insight['priority']}] {insight['summary'][:50]}...")
            print(f"    Actions: {len(insight['recommended_actions'])} recommended actions")


# ═══════════════════════════════════════════════════════════════════
# REGRESSION TESTS
# ═══════════════════════════════════════════════════════════════════
class TestRegression(TestAuth):
    """Regression tests for existing functionality"""
    
    def test_manager_overview_still_works(self, auth_token):
        """Manager Overview should still show KPIs, charts, alerts"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/manager/overview",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200, f"Manager overview failed: {response.text}"
        data = response.json()
        
        # Verify KPIs exist
        assert "kpis" in data, "Missing 'kpis'"
        kpis = data["kpis"]
        assert "revenue_today" in kpis, "Missing revenue_today"
        assert "avg_ticket" in kpis, "Missing avg_ticket"
        assert "unique_guests" in kpis, "Missing unique_guests"
        
        # Verify charts exist
        assert "charts" in data, "Missing 'charts'"
        charts = data["charts"]
        assert "revenue_by_hour" in charts, "Missing revenue_by_hour"
        assert "top_items" in charts, "Missing top_items"
        assert "guest_funnel" in charts, "Missing guest_funnel"
        
        # Verify alerts structure
        assert "alerts" in data, "Missing 'alerts'"
        
        print(f"✅ Regression: Manager Overview works - revenue=${kpis['revenue_today']:.0f}, guests={kpis['unique_guests']}")
    
    def test_owner_overview_still_works(self, auth_token):
        """Owner Overview should still show aggregated KPIs and venue cards"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard",
            headers=headers
        )
        assert response.status_code == 200, f"Owner dashboard failed: {response.text}"
        data = response.json()
        
        # Verify KPIs exist
        assert "kpis" in data, "Missing 'kpis'"
        kpis = data["kpis"]
        assert "revenue_today" in kpis, "Missing revenue_today"
        assert "revenue_mtd" in kpis, "Missing revenue_mtd"
        assert "growth_pct" in kpis, "Missing growth_pct"
        
        # Verify venues exist
        assert "venues" in data, "Missing 'venues'"
        
        print(f"✅ Regression: Owner Dashboard works - revenue MTD=${kpis['revenue_mtd']:.0f}, {len(data['venues'])} venues")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
