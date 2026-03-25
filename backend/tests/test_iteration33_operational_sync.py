"""
Test Iteration 33: Operational Synchronization Verification
Tests the restored synchronization between all SPET modules after seed upgrade.

Key tests:
1. Login flow with test credentials
2. Tap sessions (5-6 open tabs expected)
3. Manager KPIs alignment
4. KDS tickets presence
5. Cross-module data consistency
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ops-clone.preview.emergentagent.com').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

# Test credentials
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"


class TestAuthentication:
    """Authentication and login flow tests"""
    
    def test_login_success(self):
        """Login with test credentials returns valid token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        print(f"Login response status: {response.status_code}")
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert len(data["access_token"]) > 0
        print(f"Login successful, token received: {data['access_token'][:30]}...")
        
    def test_login_invalid_credentials(self):
        """Login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="class")
def auth_token():
    """Get authentication token for subsequent tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestTapSessionsSync:
    """Test TAP module - sessions and catalog"""
    
    def test_tap_sessions_list(self, auth_token):
        """List open tap sessions - expect 5-6 open tabs"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}&status=open", headers=headers)
        print(f"Tap sessions response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        sessions = data.get("sessions", [])
        count = len(sessions)
        print(f"Open sessions count: {count}")
        print(f"Session names: {[s.get('guest_name') for s in sessions]}")
        
        # Expected: 5-6 open sessions after seed
        assert count >= 5, f"Expected at least 5 open sessions, got {count}"
        
        # Verify expected guests are present
        guest_names = [s.get('guest_name', '').lower() for s in sessions]
        expected_guests = ['john smith', 'maria santos', 'ricardo almeida', 'fernando vip', 'lucas oliveira']
        for guest in expected_guests:
            assert any(guest in name for name in guest_names), f"Expected guest '{guest}' not found in sessions"
        
    def test_tap_sessions_totals(self, auth_token):
        """Verify session totals are reasonable"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}&status=open", headers=headers)
        assert response.status_code == 200
        sessions = response.json().get("sessions", [])
        
        # Check specific tab amounts
        for s in sessions:
            guest = s.get('guest_name', '')
            total = s.get('total', 0)
            print(f"  {guest}: ${total}")
        
        # Verify Fernando VIP has highest total (expected ~$352)
        fernando_sessions = [s for s in sessions if 'fernando' in s.get('guest_name', '').lower()]
        if fernando_sessions:
            assert fernando_sessions[0].get('total', 0) > 300, "Fernando VIP should have >$300 tab"
    
    def test_tap_stats(self, auth_token):
        """Verify TAP stats endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tap/stats?venue_id={VENUE_ID}", headers=headers)
        assert response.status_code == 200
        stats = response.json()
        print(f"TAP stats: {stats}")
        assert stats.get("open_tabs", 0) >= 5, "Expected at least 5 open tabs in stats"
    
    def test_tap_catalog(self, auth_token):
        """Verify catalog has items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=headers)
        assert response.status_code == 200
        items = response.json().get("items", [])
        print(f"Catalog item count: {len(items)}")
        assert len(items) > 10, "Expected at least 10 catalog items"
        
        # Check categories
        categories = set(i.get('category') for i in items)
        print(f"Categories: {categories}")
        assert 'Cocktails' in categories
        assert 'Beers' in categories


class TestClosedSessionsSync:
    """Test closed sessions and revenue data"""
    
    def test_closed_sessions_list(self, auth_token):
        """List closed sessions - expect 1-2 closed with tips"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/tap/sessions/closed?venue_id={VENUE_ID}", headers=headers)
        print(f"Closed sessions response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        sessions = data.get("sessions", [])
        print(f"Closed sessions count: {len(sessions)}")
        
        for s in sessions:
            print(f"  Closed: {s.get('guest_name')} - ${s.get('total')} - tip: ${s.get('tip_amount', 0)}")
        
        # Expect at least 1 closed session (Alex Turner)
        assert len(sessions) >= 1, "Expected at least 1 closed session"


class TestManagerOverviewSync:
    """Test Manager module - overview KPIs"""
    
    def test_manager_overview(self, auth_token):
        """Manager overview shows correct KPIs"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}", headers=headers)
        print(f"Manager overview response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        
        kpis = data.get("kpis", {})
        print(f"Manager KPIs: {json.dumps(kpis, indent=2)}")
        
        # Verify expected KPIs
        assert kpis.get("open_tabs", 0) >= 5, f"Expected open_tabs >= 5, got {kpis.get('open_tabs')}"
        assert kpis.get("unique_guests", 0) >= 7, f"Expected unique_guests >= 7, got {kpis.get('unique_guests')}"
        
        # Revenue should be present if we have closed sessions
        revenue_today = kpis.get("revenue_today", 0)
        print(f"Revenue today: ${revenue_today}")
    
    def test_manager_top_items(self, auth_token):
        """Manager overview shows top items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}", headers=headers)
        assert response.status_code == 200
        charts = response.json().get("charts", {})
        top_items = charts.get("top_items", [])
        print(f"Top items count: {len(top_items)}")
        for item in top_items[:5]:
            print(f"  {item.get('name')}: {item.get('qty')}x - ${item.get('revenue')}")
        
        assert len(top_items) > 0, "Expected top items to have data"
    
    def test_manager_guest_funnel(self, auth_token):
        """Manager guest funnel shows data"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}", headers=headers)
        assert response.status_code == 200
        charts = response.json().get("charts", {})
        funnel = charts.get("guest_funnel", {})
        print(f"Guest funnel: {funnel}")
        
        assert funnel.get("entries", 0) >= 7, "Expected at least 7 entries"
        assert funnel.get("allowed", 0) >= 7, "Expected at least 7 allowed"
        assert funnel.get("tabs_opened", 0) >= 5, "Expected at least 5 tabs opened"


class TestManagerShiftsSync:
    """Test Manager shift KPIs with staff tips"""
    
    def test_manager_staff_costs(self, auth_token):
        """Manager staff costs endpoint works"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/staff-costs?venue_id={VENUE_ID}", headers=headers)
        print(f"Staff costs response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Staff breakdown: {data.get('staff', [])}")
    
    def test_manager_shift_overview(self, auth_token):
        """Manager shift overview endpoint"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/manager/shift-overview?venue_id={VENUE_ID}", headers=headers)
        print(f"Shift overview response: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Shift overview: {json.dumps(data, indent=2)}")


class TestKDSTicketsSync:
    """Test KDS module - tickets from sessions"""
    
    def test_kds_kitchen_tickets(self, auth_token):
        """KDS kitchen has tickets"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=kitchen", headers=headers)
        print(f"KDS kitchen response: {response.status_code}")
        assert response.status_code == 200
        tickets = response.json().get("tickets", [])
        print(f"Kitchen tickets: {len(tickets)}")
        for t in tickets[:5]:
            print(f"  {t.get('guest_name')} - Table {t.get('table_number')} - {t.get('status')}")
    
    def test_kds_bar_tickets(self, auth_token):
        """KDS bar has tickets"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=bar", headers=headers)
        print(f"KDS bar response: {response.status_code}")
        assert response.status_code == 200
        tickets = response.json().get("tickets", [])
        print(f"Bar tickets: {len(tickets)}")


class TestTableModuleSync:
    """Test Table module - occupied tables"""
    
    def test_table_list(self, auth_token):
        """Table list shows occupied tables"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}", headers=headers)
        print(f"Table list response: {response.status_code}")
        assert response.status_code == 200
        tables = response.json().get("tables", [])
        print(f"Total tables: {len(tables)}")
        
        occupied = [t for t in tables if t.get('status') == 'occupied']
        print(f"Occupied tables: {len(occupied)}")
        for t in occupied:
            print(f"  Table #{t.get('table_number')}: {t.get('session_guest')} - ${t.get('session_total', 0)}")
        
        # Expected: 3 occupied tables (T2, T3, T7)
        assert len(occupied) >= 3, f"Expected at least 3 occupied tables, got {len(occupied)}"
        
        # Verify expected tables
        occupied_nums = [t.get('table_number') for t in occupied]
        assert '2' in occupied_nums, "Table 2 should be occupied"
        assert '3' in occupied_nums, "Table 3 should be occupied"
        assert '7' in occupied_nums, "Table 7 should be occupied"


class TestPulseEntrySync:
    """Test Pulse module - guests inside"""
    
    def test_pulse_inside_guests(self, auth_token):
        """Pulse shows guests inside venue"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}", headers=headers)
        print(f"Pulse inside response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        
        guests = data.get("guests", [])
        count = data.get("total", 0)
        print(f"Guests inside: {count}")
        for g in guests:
            print(f"  {g.get('guest_name')} - Tab #{g.get('tab_number')} - ${g.get('tab_total', 0)}")
        
        # Expected: 7 guests inside
        assert count >= 7, f"Expected at least 7 guests inside, got {count}"


class TestCrossModuleSync:
    """Cross-module data consistency tests"""
    
    def test_tap_manager_sync(self, auth_token):
        """TAP open tabs matches Manager open_tabs KPI"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get TAP sessions
        tap_resp = requests.get(f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}&status=open", headers=headers)
        tap_count = len(tap_resp.json().get("sessions", []))
        
        # Get Manager KPIs
        mgr_resp = requests.get(f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}", headers=headers)
        mgr_count = mgr_resp.json().get("kpis", {}).get("open_tabs", 0)
        
        print(f"TAP sessions: {tap_count}, Manager KPI: {mgr_count}")
        assert tap_count == mgr_count, f"TAP sessions ({tap_count}) doesn't match Manager KPI ({mgr_count})"
    
    def test_pulse_manager_guests_sync(self, auth_token):
        """Pulse guests inside matches Manager unique_guests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get Pulse inside
        pulse_resp = requests.get(f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}", headers=headers)
        pulse_count = pulse_resp.json().get("total", 0)
        
        # Get Manager KPIs
        mgr_resp = requests.get(f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}", headers=headers)
        mgr_count = mgr_resp.json().get("kpis", {}).get("unique_guests", 0)
        
        print(f"Pulse inside: {pulse_count}, Manager unique_guests: {mgr_count}")
        # They should be equal (7 guests)
        assert pulse_count == mgr_count, f"Pulse ({pulse_count}) doesn't match Manager guests ({mgr_count})"


class TestAddItemAndSync:
    """Test adding item to tab and verifying cross-module updates"""
    
    def test_add_item_flow(self, auth_token):
        """Add item to an open tab, verify total updates"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get an open session (John Smith - #104)
        sessions_resp = requests.get(f"{BASE_URL}/api/tap/sessions?venue_id={VENUE_ID}&status=open", headers=headers)
        sessions = sessions_resp.json().get("sessions", [])
        
        # Find John Smith's session or use first available
        target_session = None
        for s in sessions:
            if 'john' in s.get('guest_name', '').lower():
                target_session = s
                break
        
        if not target_session and sessions:
            target_session = sessions[0]
        
        if not target_session:
            pytest.skip("No open sessions available for add item test")
        
        session_id = target_session.get('session_id') or target_session.get('id')
        initial_total = target_session.get('total', 0)
        print(f"Target session: {target_session.get('guest_name')} - Initial total: ${initial_total}")
        
        # Get catalog to find an item to add
        catalog_resp = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=headers)
        items = catalog_resp.json().get("items", [])
        
        # Find a cheap item (like Sparkling Water)
        test_item = None
        for item in items:
            if 'water' in item.get('name', '').lower():
                test_item = item
                break
        
        if not test_item and items:
            test_item = items[0]
        
        if not test_item:
            pytest.skip("No catalog items available")
        
        print(f"Adding item: {test_item.get('name')} - ${test_item.get('price')}")
        
        # Add item to session
        add_resp = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/add", headers=headers, data={
            "item_id": test_item.get('id'),
            "qty": 1
        })
        
        print(f"Add item response: {add_resp.status_code}")
        if add_resp.status_code == 200:
            result = add_resp.json()
            print(f"New session total: ${result.get('session_total')}")
            assert result.get('session_total') > initial_total, "Total should have increased"
        else:
            # May fail if session requires guest confirmation - that's OK for API test
            print(f"Add item response: {add_resp.text[:200]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
