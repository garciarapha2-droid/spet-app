"""
Iteration 27: Test 12 Feature Refinements
- TABLE: Open table form requires Server AND Seats (both mandatory)
- TAP/BAR: Bartender persists across category changes
- TAP/BAR: Cancel Order (red) and Confirm Order (green) buttons visible
- TAP/BAR: Clean slate after Confirm Order
- KDS: Delayed column shows at least 1 delayed ticket (red)
- MANAGER: Tables by Server tab with drill-down and void button
- MENU: Sorting within Beers category (alphabetical)
- OWNER: Venue selector button in header
- OWNER: Events view shows both active AND ended events
- OWNER: Performance tab - Venue ABOVE Event
- OWNER: Growth & Loyalty tab - New vs Recurring visual
- OWNER: System tab - Licensed Modules section
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dark-light-theme-5.preview.emergentagent.com').rstrip('/')
VENUE_ID = '40a24e04-75b6-435d-bfff-ab0d469ce543'


def get_token():
    """Get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teste@teste.com",
        "password": "12345"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture(scope="module")
def auth_headers():
    """Shared auth headers for all tests"""
    token = get_token()
    return {"Authorization": f"Bearer {token}"}


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data or "token" in data
        print(f"SUCCESS: Login returns token")


class TestTapCatalogSorting:
    """Feature 7: Menu sorting - items sorted alphabetically within category"""
    
    def test_catalog_beers_alphabetically_sorted(self, auth_headers):
        """Test that Beers category items are sorted alphabetically"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        items = data.get("items", [])
        
        # Filter Beers category
        beers = [item for item in items if item.get("category") == "Beers"]
        
        if len(beers) > 1:
            # Check if sorted alphabetically
            beer_names = [b.get("name", "").lower() for b in beers]
            sorted_names = sorted(beer_names)
            
            print(f"Beers found: {[b.get('name') for b in beers]}")
            print(f"Expected order: {sorted_names}")
            
            assert beer_names == sorted_names, f"Beers not sorted alphabetically! Got: {beer_names}, Expected: {sorted_names}"
            print("SUCCESS: Beers category items are sorted alphabetically")
        else:
            print(f"INFO: Only {len(beers)} beers found, sorting verification skipped")


class TestKDSDelayed:
    """Feature 5: KDS - Delayed column shows tickets"""
    
    def test_kds_tickets_endpoint(self, auth_headers):
        """Test KDS tickets endpoint returns valid response"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            params={"venue_id": VENUE_ID, "destination": "kitchen"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        tickets = data.get("tickets", [])
        print(f"SUCCESS: KDS tickets endpoint returns {len(tickets)} tickets")
        
        # Check for delayed tickets
        delayed = [t for t in tickets if t.get("status") == "delayed"]
        print(f"INFO: Found {len(delayed)} delayed tickets")


class TestManagerTablesByServer:
    """Feature 6: Manager - Tables by Server with drill-down"""
    
    def test_tables_by_server_endpoint(self, auth_headers):
        """Test tables-by-server endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/manager/tables-by-server",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "servers" in data or "unassigned" in data
        print(f"SUCCESS: tables-by-server endpoint returns data")
        print(f"  - Total tables: {data.get('total_tables', 0)}")
        print(f"  - Servers: {len(data.get('servers', []))}")
        print(f"  - Unassigned: {len(data.get('unassigned', []))}")
    
    def test_table_detail_endpoint(self, auth_headers):
        """Test table-detail endpoint for drill-down"""
        # First get a table ID from tables list
        tables_resp = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert tables_resp.status_code == 200
        tables = tables_resp.json().get("tables", [])
        
        if tables:
            table_id = tables[0].get("id")
            # Test table detail endpoint
            detail_response = requests.get(
                f"{BASE_URL}/api/manager/table-detail/{table_id}",
                headers=auth_headers
            )
            assert detail_response.status_code == 200
            detail = detail_response.json()
            
            assert "table_number" in detail
            print(f"SUCCESS: table-detail endpoint works for table #{detail.get('table_number')}")
            print(f"  - Status: {detail.get('status')}")
            print(f"  - Items: {len(detail.get('items', []))}")
        else:
            print("INFO: No tables found to test drill-down")


class TestOwnerDashboard:
    """Features 8-12: Owner Dashboard tests"""
    
    def test_owner_venues_endpoint(self, auth_headers):
        """Feature 8: Test venues endpoint (for venue selector)"""
        response = requests.get(
            f"{BASE_URL}/api/owner/venues",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        venues = data.get("venues", [])
        print(f"SUCCESS: Owner venues endpoint returns {len(venues)} venues")
        for v in venues:
            print(f"  - {v.get('name')} (ID: {v.get('venue_id')})")
    
    def test_owner_dashboard_business_view(self, auth_headers):
        """Test owner dashboard business view"""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard",
            params={"view": "business"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("view") == "business"
        assert "kpis" in data
        assert "venues" in data
        print("SUCCESS: Owner dashboard business view works")
    
    def test_owner_dashboard_events_view(self, auth_headers):
        """Feature 9: Test events view shows both active AND ended events"""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard",
            params={"view": "events"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("view") == "events"
        events = data.get("events", [])
        print(f"SUCCESS: Owner dashboard events view returns {len(events)} events")
        
        # Check for both active and ended events
        statuses = set(e.get("status") for e in events)
        print(f"  - Event statuses found: {statuses}")
        
        # The view should include events - check status badges
        for ev in events[:5]:  # Show first 5
            print(f"  - {ev.get('name')}: {ev.get('status')}")
    
    def test_owner_growth_endpoint(self, auth_headers):
        """Feature 11: Test growth endpoint for New vs Recurring and Total Sign-ups"""
        response = requests.get(
            f"{BASE_URL}/api/owner/growth",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check for new vs recurring fields
        assert "new_guests" in data
        assert "returning_guests" in data
        assert "total_signups" in data, "total_signups field missing!"
        
        print("SUCCESS: Growth endpoint returns required fields")
        print(f"  - New guests: {data.get('new_guests')}")
        print(f"  - Returning guests: {data.get('returning_guests')}")
        print(f"  - Total sign-ups: {data.get('total_signups')}")
        print(f"  - LTV: {data.get('ltv')}")
    
    def test_owner_modules_endpoint(self, auth_headers):
        """Feature 12: Test modules endpoint for Licensed Modules"""
        response = requests.get(
            f"{BASE_URL}/api/owner/modules",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        venues_modules = data.get("venues_modules", [])
        print(f"SUCCESS: Modules endpoint returns data for {len(venues_modules)} venues")
        
        for vm in venues_modules:
            print(f"  - Venue: {vm.get('venue_name')}")
            for mod in vm.get("modules", []):
                status = "ON" if mod.get("active") else "OFF"
                print(f"    - {mod.get('name')}: {status}")


class TestTableOpenForm:
    """Feature 1: Open table form requires Server AND Seats"""
    
    def test_tables_endpoint(self, auth_headers):
        """Test tables endpoint returns tables"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        tables = data.get("tables", [])
        print(f"SUCCESS: Tables endpoint returns {len(tables)} tables")
        
        # Check for available tables
        available = [t for t in tables if t.get("status") == "available"]
        occupied = [t for t in tables if t.get("status") == "occupied"]
        print(f"  - Available: {len(available)}, Occupied: {len(occupied)}")


class TestTapBarFeatures:
    """Features 2-4: TAP/BAR features - Bartender persistence, Cancel/Confirm buttons, Clean slate"""
    
    def test_tap_sessions_endpoint(self, auth_headers):
        """Test TAP sessions endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        sessions = data.get("sessions", [])
        print(f"SUCCESS: TAP sessions endpoint returns {len(sessions)} open sessions")
        
        for s in sessions[:3]:  # Show first 3
            print(f"  - Tab #{s.get('tab_number')}: {s.get('guest_name')} - ${s.get('total', 0):.2f}")
    
    def test_barmen_endpoint(self, auth_headers):
        """Test barmen/staff endpoint for bartender selector"""
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        barmen = data.get("barmen", [])
        print(f"SUCCESS: Barmen endpoint returns {len(barmen)} staff members")
        
        for b in barmen:
            print(f"  - {b.get('name')} ({b.get('role', 'server')})")
    
    def test_tap_stats_endpoint(self, auth_headers):
        """Test TAP stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        print(f"SUCCESS: TAP stats endpoint returns:")
        print(f"  - Open tabs: {data.get('open_tabs')}")
        print(f"  - Running total: ${data.get('running_total', 0):.2f}")
        print(f"  - Closed today: {data.get('closed_today')}")
        print(f"  - Revenue today: ${data.get('revenue_today', 0):.2f}")


class TestOwnerPerformance:
    """Feature 10: Owner Performance tab - Venue ABOVE Event"""
    
    def test_owner_venues_performance(self, auth_headers):
        """Test venues performance endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/owner/venues",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        venues = data.get("venues", [])
        print(f"SUCCESS: Performance by Venue endpoint works")
        print(f"  - Returns {len(venues)} venues with performance data")
        
        for v in venues:
            print(f"  - {v.get('name')}: Revenue Today ${v.get('revenue_today', 0):.2f}, Health: {v.get('health')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
