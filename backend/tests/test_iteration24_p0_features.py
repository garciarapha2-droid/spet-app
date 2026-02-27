"""
Iteration 24: P0 Features Testing
----------------------------------
Tests for:
1. Owner Dashboard View Switcher (business/venue/events)
2. Owner People & Ops with clickable drill-down (venue staff, event staff)
3. Manager Dashboard Guests sorted by spend + guest profile modal
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
GUEST_ID = "a0000001-0000-0000-0000-000000000001"


@pytest.fixture(scope="module")
def auth_token():
    """Login and get auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teste@teste.com",
        "password": "12345"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    # Auth token key is 'access_token' not 'token'
    token = data.get("access_token")
    assert token, f"No access_token in response: {data}"
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


# ═══════════════════════════════════════════════════════════════════
# OWNER DASHBOARD VIEW SWITCHER TESTS
# ═══════════════════════════════════════════════════════════════════

class TestOwnerDashboardViewSwitcher:
    """Tests for Owner Dashboard with business/venue/events view modes"""

    def test_owner_dashboard_business_view(self, auth_headers):
        """GET /api/owner/dashboard?view=business returns aggregated KPIs"""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard",
            params={"view": "business"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify business view structure
        assert data.get("view") == "business", f"Expected view=business, got {data.get('view')}"
        assert "kpis" in data, "Missing 'kpis' in business view"
        assert "venues" in data, "Missing 'venues' list in business view"
        
        # Verify KPIs structure
        kpis = data["kpis"]
        expected_kpi_fields = [
            "revenue_today", "revenue_mtd", "revenue_ytd", "growth_pct",
            "estimated_profit", "avg_ticket", "arpu", "retention_pct",
            "total_guests_today", "open_tabs", "running_total", "closed_today"
        ]
        for field in expected_kpi_fields:
            assert field in kpis, f"Missing KPI field: {field}"
        
        print(f"Business view KPIs: revenue_today=${kpis.get('revenue_today', 0)}, MTD=${kpis.get('revenue_mtd', 0)}")

    def test_owner_dashboard_venue_view(self, auth_headers):
        """GET /api/owner/dashboard?view=venue returns per-venue financials"""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard",
            params={"view": "venue"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify venue view structure
        assert data.get("view") == "venue", f"Expected view=venue, got {data.get('view')}"
        assert "venues" in data, "Missing 'venues' in venue view"
        
        # Verify each venue has financial breakdown
        venues = data["venues"]
        if venues:
            venue = venues[0]
            expected_fields = [
                "venue_id", "name", "health", "revenue_today", "revenue_mtd",
                "revenue_ytd", "avg_ticket", "open_tabs", "closed_today",
                "guests_today", "voids_today", "staff_count"
            ]
            for field in expected_fields:
                assert field in venue, f"Missing venue field: {field}"
            print(f"Venue view: {venue.get('name')} - revenue_today=${venue.get('revenue_today')}, staff={venue.get('staff_count')}")

    def test_owner_dashboard_events_view(self, auth_headers):
        """GET /api/owner/dashboard?view=events returns per-event data"""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard",
            params={"view": "events"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify events view structure
        assert data.get("view") == "events", f"Expected view=events, got {data.get('view')}"
        assert "events" in data, "Missing 'events' in events view"
        
        # Verify event data structure if events exist
        events = data["events"]
        if events:
            event = events[0]
            expected_fields = [
                "event_id", "name", "venue_name", "venue_id",
                "event_date", "status", "revenue", "tabs_closed",
                "guests", "staff"
            ]
            for field in expected_fields:
                assert field in event, f"Missing event field: {field}"
            print(f"Events view: {event.get('name')} - revenue=${event.get('revenue')}, guests={event.get('guests')}, staff={event.get('staff')}")
        else:
            print("Events view: No events found (empty is valid)")

    def test_owner_dashboard_default_view(self, auth_headers):
        """GET /api/owner/dashboard without view param defaults to business"""
        response = requests.get(
            f"{BASE_URL}/api/owner/dashboard",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Should default to business view
        assert data.get("view") == "business", f"Expected default view=business, got {data.get('view')}"
        assert "kpis" in data, "Default view should have KPIs"


# ═══════════════════════════════════════════════════════════════════
# OWNER PEOPLE & OPS DRILL-DOWN TESTS
# ═══════════════════════════════════════════════════════════════════

class TestOwnerPeopleOps:
    """Tests for Owner People & Ops section with venue/event drill-down"""

    def test_owner_people_returns_venues_and_events(self, auth_headers):
        """GET /api/owner/people returns venues and events with staff counts"""
        response = requests.get(
            f"{BASE_URL}/api/owner/people",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "total_staff" in data, "Missing total_staff"
        assert "venues" in data, "Missing venues list"
        assert "events" in data, "Missing events list"
        
        # Verify venue data
        venues = data["venues"]
        if venues:
            venue = venues[0]
            assert "venue_id" in venue, "Venue missing venue_id"
            assert "name" in venue, "Venue missing name"
            assert "staff_count" in venue, "Venue missing staff_count"
            assert "recent_shifts" in venue, "Venue missing recent_shifts"
            print(f"People venues: {venue.get('name')} has {venue.get('staff_count')} staff")
        
        # Verify events data
        events = data["events"]
        if events:
            event = events[0]
            assert "event_id" in event, "Event missing event_id"
            assert "event_name" in event, "Event missing event_name"
            assert "venue_name" in event, "Event missing venue_name"
            assert "staff_count" in event, "Event missing staff_count"
            print(f"People events: {event.get('event_name')} has {event.get('staff_count')} staff")

    def test_owner_venue_staff_drilldown(self, auth_headers):
        """GET /api/owner/people/{venue_id}/staff returns staff list for venue"""
        response = requests.get(
            f"{BASE_URL}/api/owner/people/{VENUE_ID}/staff",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "staff" in data, "Missing staff list"
        assert "venue_id" in data, "Missing venue_id"
        assert data["venue_id"] == VENUE_ID, f"Wrong venue_id returned: {data['venue_id']}"
        
        # Verify staff structure if any
        staff = data["staff"]
        if staff:
            member = staff[0]
            assert "name" in member, "Staff member missing name"
            print(f"Venue staff drilldown: {len(staff)} staff members found")
        else:
            print("Venue staff drilldown: No staff (valid empty)")

    def test_owner_event_staff_drilldown(self, auth_headers):
        """GET /api/owner/people/event/{event_id}/staff returns staff for event"""
        # First get an event_id from people endpoint
        people_response = requests.get(
            f"{BASE_URL}/api/owner/people",
            headers=auth_headers
        )
        assert people_response.status_code == 200
        people_data = people_response.json()
        
        events = people_data.get("events", [])
        if not events:
            pytest.skip("No events with staff to test drill-down")
        
        event_id = events[0]["event_id"]
        
        # Now test event staff drill-down
        response = requests.get(
            f"{BASE_URL}/api/owner/people/event/{event_id}/staff",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "staff" in data, "Missing staff list"
        assert "event_id" in data, "Missing event_id"
        
        staff = data["staff"]
        if staff:
            member = staff[0]
            # Event staff should have role and potentially hourly_rate
            assert "name" in member or "staff_name" in member, "Staff missing name"
            print(f"Event staff drilldown: {len(staff)} staff assigned to event {event_id}")


# ═══════════════════════════════════════════════════════════════════
# MANAGER DASHBOARD GUESTS (SORTED BY SPEND) TESTS
# ═══════════════════════════════════════════════════════════════════

class TestManagerGuestsSortedBySpend:
    """Tests for Manager Guests sorted by highest spender + profile modal"""

    def test_manager_guests_sorted_by_spend(self, auth_headers):
        """GET /api/manager/guests returns guests sorted by spend_total desc"""
        response = requests.get(
            f"{BASE_URL}/api/manager/guests",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "guests" in data, "Missing guests list"
        assert "total" in data, "Missing total count"
        
        guests = data["guests"]
        if len(guests) >= 2:
            # Verify descending order by spend_total
            for i in range(len(guests) - 1):
                current_spend = guests[i].get("spend_total", 0)
                next_spend = guests[i + 1].get("spend_total", 0)
                assert current_spend >= next_spend, f"Guests not sorted by spend: {current_spend} < {next_spend}"
            
            top_spender = guests[0]
            print(f"Top spender: {top_spender.get('name')} with ${top_spender.get('spend_total', 0)}")
        else:
            print(f"Found {len(guests)} guests (need 2+ to verify sort)")

    def test_manager_guests_search(self, auth_headers):
        """GET /api/manager/guests with search param filters results"""
        response = requests.get(
            f"{BASE_URL}/api/manager/guests",
            params={"venue_id": VENUE_ID, "search": "test"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "guests" in data, "Missing guests list"
        print(f"Search 'test' found {len(data['guests'])} guests")

    def test_manager_guest_detail_profile(self, auth_headers):
        """GET /api/manager/guests/{guest_id} returns detailed guest profile"""
        # First get a guest_id from the guests list
        guests_response = requests.get(
            f"{BASE_URL}/api/manager/guests",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert guests_response.status_code == 200
        guests_data = guests_response.json()
        
        guests = guests_data.get("guests", [])
        if not guests:
            pytest.skip("No guests to test profile")
        
        guest_id = guests[0]["id"]
        
        # Now test guest detail
        response = requests.get(
            f"{BASE_URL}/api/manager/guests/{guest_id}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify profile structure
        assert "guest" in data, "Missing guest data"
        assert "spend_summary" in data, "Missing spend_summary"
        assert "entries" in data, "Missing entries list"
        assert "sessions" in data, "Missing sessions list (recent tabs)"
        assert "events" in data, "Missing events list (event history)"
        
        # Verify spend_summary structure
        spend = data["spend_summary"]
        assert "total_spend" in spend, "Missing total_spend in spend_summary"
        assert "total_sessions" in spend, "Missing total_sessions in spend_summary"
        assert "avg_spend" in spend, "Missing avg_spend in spend_summary"
        
        print(f"Guest profile: {data['guest'].get('name')} - total_spend=${spend.get('total_spend')}, sessions={spend.get('total_sessions')}, events={len(data.get('events', []))}")

    def test_manager_guest_detail_with_specific_id(self, auth_headers):
        """GET /api/manager/guests/{GUEST_ID} with provided test guest ID"""
        response = requests.get(
            f"{BASE_URL}/api/manager/guests/{GUEST_ID}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        
        # May return 404 if guest doesn't exist - that's valid
        if response.status_code == 404:
            print(f"Guest {GUEST_ID} not found (expected if no test data)")
            pytest.skip(f"Test guest {GUEST_ID} not in database")
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "guest" in data, "Missing guest"
        assert "spend_summary" in data, "Missing spend_summary"
        print(f"Specific guest {GUEST_ID}: {data['guest'].get('name')}")


# ═══════════════════════════════════════════════════════════════════
# ADDITIONAL INTEGRATION TESTS
# ═══════════════════════════════════════════════════════════════════

class TestOwnerDashboardIntegration:
    """Integration tests for Owner Dashboard consistency"""

    def test_all_views_return_valid_data(self, auth_headers):
        """All three views (business/venue/events) return valid JSON"""
        views = ["business", "venue", "events"]
        for view in views:
            response = requests.get(
                f"{BASE_URL}/api/owner/dashboard",
                params={"view": view},
                headers=auth_headers
            )
            assert response.status_code == 200, f"View {view} failed: {response.text}"
            data = response.json()
            assert data.get("view") == view, f"View mismatch for {view}"
            print(f"View '{view}' OK")

    def test_owner_venues_endpoint_consistency(self, auth_headers):
        """GET /api/owner/venues returns venue performance data"""
        response = requests.get(
            f"{BASE_URL}/api/owner/venues",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "venues" in data, "Missing venues"
        if data["venues"]:
            venue = data["venues"][0]
            assert "venue_id" in venue, "Missing venue_id"
            assert "name" in venue, "Missing name"
            assert "health" in venue, "Missing health status"
            print(f"Owner venues: {len(data['venues'])} venues found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
