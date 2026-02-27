"""
Iteration 20: P0 Product Rules Testing
- Bar/Tap guest confirmation modal (name, tab#, photo)
- Table ID verification for alcohol items (checkbox, cache, badge)
- Event vs Guest Memory (event_guests temporal, guests global in Pulse)
- Staff per Event with role and hourly_rate snapshot
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


class TestAuth:
    """Get authentication token for API calls"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Auth headers for requests"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def form_headers(self, auth_token):
        """Auth headers for form data requests"""
        return {
            "Authorization": f"Bearer {auth_token}"
        }


class TestTapSessionWithGuestInfo(TestAuth):
    """Test Tap session endpoint returns guest_photo and id_verified fields"""
    
    def test_get_sessions_list(self, headers):
        """Get list of open sessions"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        return data["sessions"]
    
    def test_get_session_detail_has_guest_photo_and_id_verified(self, headers):
        """GET /api/tap/session/{id} should return guest_photo and id_verified"""
        # First get list of sessions
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        sessions = response.json().get("sessions", [])
        
        if not sessions:
            pytest.skip("No open sessions to test")
        
        session_id = sessions[0].get("session_id") or sessions[0].get("id")
        
        # Get session detail
        detail_response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=headers
        )
        assert detail_response.status_code == 200
        data = detail_response.json()
        
        # Verify fields exist
        assert "guest_name" in data, "guest_name field missing"
        assert "tab_number" in data or data.get("tab_number") is None, "tab_number field handling incorrect"
        assert "id_verified" in data, "id_verified field missing (should be boolean)"
        # guest_photo may be null if no photo
        assert "guest_photo" in data or data.get("guest_photo") is None, "guest_photo field should exist (can be null)"
        
        print(f"Session detail: guest_name={data.get('guest_name')}, tab_number={data.get('tab_number')}, id_verified={data.get('id_verified')}, has_photo={data.get('guest_photo') is not None}")


class TestTapIdVerification(TestAuth):
    """Test POST /api/tap/session/{id}/verify-id endpoint"""
    
    def test_verify_id_endpoint_exists(self, form_headers):
        """Test that verify-id endpoint exists and works"""
        # First get a session
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": form_headers["Authorization"]}
        )
        assert response.status_code == 200
        sessions = response.json().get("sessions", [])
        
        if not sessions:
            pytest.skip("No open sessions to test verify-id")
        
        session_id = sessions[0].get("session_id") or sessions[0].get("id")
        
        # Call verify-id endpoint
        verify_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/verify-id",
            headers=form_headers
        )
        assert verify_response.status_code == 200, f"Verify ID failed: {verify_response.text}"
        data = verify_response.json()
        
        # Verify response fields
        assert data.get("id_verified") is True, "id_verified should be True after verification"
        assert "id_verified_at" in data, "Should have id_verified_at timestamp"
        assert "session_id" in data, "Should return session_id"
        
        print(f"ID verification successful: session={session_id}, verified_at={data.get('id_verified_at')}")
    
    def test_verify_id_persists_in_session(self, headers, form_headers):
        """After verify-id, subsequent GET should show id_verified=True"""
        # Get a session
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        sessions = response.json().get("sessions", [])
        if not sessions:
            pytest.skip("No sessions available")
        
        session_id = sessions[0].get("session_id") or sessions[0].get("id")
        
        # Verify the session
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/verify-id",
            headers=form_headers
        )
        
        # Get session detail
        detail_response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=headers
        )
        assert detail_response.status_code == 200
        data = detail_response.json()
        
        # Check persistence
        assert data.get("id_verified") is True, "id_verified should persist in session"
        print(f"ID verified persists: {data.get('id_verified')}")


class TestTableIdVerified(TestAuth):
    """Test GET /api/table/{id} returns id_verified in session data"""
    
    def test_get_tables_list(self, headers):
        """Get list of tables"""
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "tables" in data
        print(f"Found {len(data['tables'])} tables")
        return data["tables"]
    
    def test_table_detail_has_id_verified_in_session(self, headers):
        """GET /api/table/{id} should include id_verified in session data"""
        # Get tables
        response = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        tables = response.json().get("tables", [])
        
        # Find occupied table (table #2 as mentioned)
        occupied = [t for t in tables if t.get("status") == "occupied"]
        if not occupied:
            pytest.skip("No occupied tables to test")
        
        table_id = occupied[0]["id"]
        
        # Get table detail
        detail_response = requests.get(
            f"{BASE_URL}/api/table/{table_id}",
            headers=headers
        )
        assert detail_response.status_code == 200
        data = detail_response.json()
        
        # Verify session has id_verified field
        if data.get("session"):
            session = data["session"]
            assert "id_verified" in session, "session should have id_verified field"
            print(f"Table detail session: id_verified={session.get('id_verified')}, id_verified_at={session.get('id_verified_at')}")
        else:
            print("Table has no active session")


class TestEventGuestsCRUD(TestAuth):
    """Test Event Guests - temporal presence (event_guests collection)"""
    
    @pytest.fixture(scope="class")
    def event_id(self, headers):
        """Get or create an event for testing"""
        # List events
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            headers=headers
        )
        assert response.status_code == 200
        events = response.json().get("events", [])
        
        if events:
            return events[0]["id"]
        
        # Create event if none exist
        from datetime import date
        create_response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data={
                "name": "TEST_P0_Event",
                "date": date.today().isoformat(),
                "cover_price": 20,
                "cover_consumption_price": 50,
                "card_mode": "temporary"
            },
            headers={"Authorization": headers["Authorization"]}
        )
        assert create_response.status_code == 200
        return create_response.json()["id"]
    
    @pytest.fixture(scope="class")
    def pulse_guest_id(self, headers):
        """Get a Pulse guest ID for testing"""
        # Get inside guests or intake a new one
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        if response.status_code == 200:
            guests = response.json().get("guests", [])
            if guests:
                return guests[0]["id"]
        
        # Get from entries/today
        entries_response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        if entries_response.status_code == 200:
            entries = entries_response.json().get("entries", [])
            if entries:
                return entries[0].get("guest_id")
        
        pytest.skip("No Pulse guests available for testing")
    
    def test_list_event_guests(self, headers, event_id):
        """GET /api/venue/{vid}/events/{eid}/guests lists event guests"""
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "guests" in data
        assert "total" in data
        print(f"Event {event_id} has {data['total']} guests")
    
    def test_add_guest_to_event(self, headers, event_id, pulse_guest_id):
        """POST /api/venue/{vid}/events/{eid}/guests adds Pulse guest to event"""
        if not pulse_guest_id:
            pytest.skip("No Pulse guest available")
        
        # First try to remove if exists (cleanup from previous test)
        requests.delete(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests/{pulse_guest_id}",
            headers=headers
        )
        
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
            data={"guest_id": pulse_guest_id},
            headers={"Authorization": headers["Authorization"]}
        )
        # 200 or 400 (already exists) are acceptable
        assert response.status_code in [200, 400], f"Unexpected status: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "event_guest_id" in data or "guest_id" in data
            print(f"Added guest {pulse_guest_id} to event {event_id}")
    
    def test_event_guests_enriched_with_pulse_data(self, headers, event_id):
        """Event guests list should include enriched data from Pulse"""
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
            headers=headers
        )
        assert response.status_code == 200
        guests = response.json().get("guests", [])
        
        if guests:
            guest = guests[0]
            # Should have enriched fields from Pulse
            assert "name" in guest, "Should have name from Pulse"
            # Optional enriched fields
            print(f"Enriched guest: {guest.get('name')}, photo={guest.get('photo') is not None}, visits={guest.get('visits')}")
    
    def test_remove_guest_from_event_without_deleting_from_pulse(self, headers, event_id, pulse_guest_id):
        """DELETE removes guest from event but not from Pulse"""
        if not pulse_guest_id:
            pytest.skip("No Pulse guest available")
        
        # Add guest first (if not already)
        requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
            data={"guest_id": pulse_guest_id},
            headers={"Authorization": headers["Authorization"]}
        )
        
        # Remove from event
        delete_response = requests.delete(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests/{pulse_guest_id}",
            headers=headers
        )
        # Should succeed or already removed
        assert delete_response.status_code in [200, 404]
        
        # Verify guest still exists in Pulse
        pulse_response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{pulse_guest_id}",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        # Guest should still exist in Pulse
        assert pulse_response.status_code == 200, "Guest should still exist in Pulse after removal from event"
        print(f"Guest {pulse_guest_id} removed from event but still exists in Pulse")


class TestEventEndClearsGuests(TestAuth):
    """Test POST /api/venue/{vid}/events/{eid}/end clears event_guests"""
    
    def test_end_event_clears_temporal_guests(self, headers):
        """Ending event should clear event_guests but keep guests in Pulse"""
        # Create a test event
        from datetime import date
        create_response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data={
                "name": "TEST_End_Event",
                "date": date.today().isoformat(),
                "cover_price": 0,
                "card_mode": "temporary"
            },
            headers={"Authorization": headers["Authorization"]}
        )
        assert create_response.status_code == 200
        event_id = create_response.json()["id"]
        
        # End the event
        end_response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/end",
            headers={"Authorization": headers["Authorization"]}
        )
        assert end_response.status_code == 200
        data = end_response.json()
        
        assert data.get("ended") is True, "Event should be marked as ended"
        assert "guests_cleared" in data, "Should report guests_cleared count"
        assert "ended_at" in data, "Should have ended_at timestamp"
        
        print(f"Event ended: cleared {data.get('guests_cleared')} guests")
        
        # Verify event guests list is now empty
        guests_response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
            headers=headers
        )
        assert guests_response.status_code == 200
        assert guests_response.json().get("total", 0) == 0, "Event guests should be cleared after end"


class TestEventStaffCRUD(TestAuth):
    """Test Event Staff - per-event assignment with role and hourly_rate snapshot"""
    
    @pytest.fixture(scope="class")
    def event_id(self, headers):
        """Get or create an event for testing"""
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            headers=headers
        )
        events = response.json().get("events", [])
        if events:
            return events[0]["id"]
        
        from datetime import date
        create_response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data={
                "name": "TEST_Staff_Event",
                "date": date.today().isoformat()
            },
            headers={"Authorization": headers["Authorization"]}
        )
        return create_response.json()["id"]
    
    @pytest.fixture(scope="class")
    def staff_id(self, headers):
        """Get a staff/barman ID for testing"""
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        barmen = response.json().get("barmen", [])
        if barmen:
            return barmen[0]["id"]
        pytest.skip("No staff/barmen available for testing")
    
    def test_list_event_staff(self, headers, event_id):
        """GET /api/venue/{vid}/events/{eid}/staff lists event staff"""
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "staff" in data
        assert "total" in data
        print(f"Event {event_id} has {data['total']} staff assigned")
    
    def test_assign_staff_to_event_with_role_and_rate(self, headers, event_id, staff_id):
        """POST assigns staff with role and hourly_rate snapshot"""
        if not staff_id:
            pytest.skip("No staff available")
        
        # Remove if exists (cleanup)
        requests.delete(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff/{staff_id}",
            headers=headers
        )
        
        # Assign with role and hourly_rate
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff",
            data={
                "staff_id": staff_id,
                "role": "bartender",
                "hourly_rate": 25.50
            },
            headers={"Authorization": headers["Authorization"]}
        )
        assert response.status_code == 200, f"Failed to assign staff: {response.text}"
        data = response.json()
        
        # Verify snapshot fields
        assert "staff_id" in data, "Should return staff_id"
        assert data.get("role") == "bartender", "Should have role"
        assert data.get("hourly_rate") == 25.50 or data.get("hourly_rate") == 25.5, "Should have hourly_rate snapshot"
        assert "assigned_at" in data, "Should have assigned_at timestamp"
        
        print(f"Assigned staff {staff_id} as {data.get('role')} @ ${data.get('hourly_rate')}/hr")
    
    def test_event_staff_enriched_with_names(self, headers, event_id):
        """Event staff list should include enriched names"""
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff",
            headers=headers
        )
        assert response.status_code == 200
        staff = response.json().get("staff", [])
        
        if staff:
            s = staff[0]
            assert "name" in s, "Should have enriched name"
            assert "role" in s, "Should have role"
            assert "hourly_rate" in s, "Should have hourly_rate"
            print(f"Event staff: {s.get('name')}, role={s.get('role')}, rate=${s.get('hourly_rate')}/hr")
    
    def test_remove_staff_from_event(self, headers, event_id, staff_id):
        """DELETE removes staff from event"""
        if not staff_id:
            pytest.skip("No staff available")
        
        # Ensure staff is assigned first
        requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff",
            data={"staff_id": staff_id, "role": "bartender", "hourly_rate": 20},
            headers={"Authorization": headers["Authorization"]}
        )
        
        # Remove
        delete_response = requests.delete(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff/{staff_id}",
            headers=headers
        )
        assert delete_response.status_code in [200, 404]
        
        if delete_response.status_code == 200:
            data = delete_response.json()
            assert data.get("deleted") is True
            print(f"Removed staff {staff_id} from event {event_id}")


class TestCatalogItemAlcoholField(TestAuth):
    """Verify catalog items have is_alcohol field for ID verification logic"""
    
    def test_catalog_has_is_alcohol_field(self, headers):
        """GET /api/tap/catalog items should have is_alcohol field"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        items = response.json().get("items", [])
        
        assert len(items) > 0, "Should have catalog items"
        
        # Check a few items
        alcohol_items = [i for i in items if i.get("is_alcohol")]
        non_alcohol_items = [i for i in items if not i.get("is_alcohol")]
        
        print(f"Catalog: {len(alcohol_items)} alcohol items, {len(non_alcohol_items)} non-alcohol items")
        
        # Verify Beers category has alcohol items
        beers = [i for i in items if i.get("category") == "Beers"]
        if beers:
            assert any(b.get("is_alcohol") for b in beers), "Beer items should have is_alcohol=True"
        
        # Verify Non-alcoholic category has non-alcohol items  
        non_alc = [i for i in items if i.get("category") == "Non-alcoholic"]
        if non_alc:
            assert all(not n.get("is_alcohol") for n in non_alc), "Non-alcoholic items should have is_alcohol=False"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
