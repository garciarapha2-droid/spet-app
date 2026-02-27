"""
Iteration 21: Testing Bug Fixes and New Features
- Bug fix: Tap search finds tab by number without '#' prefix (e.g., '123' finds Tab #123)
- Bug fix: Tap search finds tab by number with '#' prefix (e.g., '#125' finds Tab #125)
- Bug fix: Tap search still finds tab by guest name
- Event Guests UI: search Pulse guests, add/remove from event
- Event Staff UI: assign/remove staff with role+hourly_rate
- Create Event Wizard: Step 1 info, Step 2 staff assignment
- Backend endpoints for guest search, event guests CRUD, event staff CRUD
"""
import pytest
import requests
import os
from datetime import date

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

class TestAuthentication:
    """Test login and get token"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, f"No access_token in response: {data}"
        return data["access_token"]
    
    def test_login_success(self, auth_token):
        """Verify login returns token"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print(f"Login successful, token length: {len(auth_token)}")


class TestPulseGuestSearch:
    """Test GET /api/pulse/guests/search endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com", "password": "12345"
        })
        return response.json()["access_token"]
    
    def test_search_guests_by_name(self, auth_token):
        """Search guests by name returns matching results"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/pulse/guests/search",
            params={"venue_id": VENUE_ID, "q": "John"},
            headers=headers
        )
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        assert "guests" in data
        print(f"Found {len(data['guests'])} guests matching 'John'")
        # Verify response structure
        if data['guests']:
            guest = data['guests'][0]
            assert "id" in guest
            assert "name" in guest
            print(f"Guest: {guest.get('name')}, ID: {guest.get('id')}")
    
    def test_search_guests_alex(self, auth_token):
        """Search for Alex Turner"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/pulse/guests/search",
            params={"venue_id": VENUE_ID, "q": "Alex"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data.get('guests', []))} guests matching 'Alex'")
    
    def test_search_guests_kevin(self, auth_token):
        """Search for Kevin Brown"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/pulse/guests/search",
            params={"venue_id": VENUE_ID, "q": "Kevin"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        print(f"Found {len(data.get('guests', []))} guests matching 'Kevin'")
    
    def test_search_guests_empty_query(self, auth_token):
        """Empty query returns all guests (up to limit)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/pulse/guests/search",
            params={"venue_id": VENUE_ID, "q": ""},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "guests" in data
        print(f"Empty query returned {len(data['guests'])} guests")


class TestEventGuestsCRUD:
    """Test event guests CRUD endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com", "password": "12345"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def test_event(self, auth_token):
        """Create a test event for guest CRUD"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        today = date.today().isoformat()
        
        # Create event
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data={
                "name": f"TEST_Event_Guests_{today}",
                "date": today,
                "cover_price": "0",
                "cover_consumption_price": "0"
            },
            headers=headers
        )
        assert response.status_code == 200, f"Event creation failed: {response.text}"
        event = response.json()
        print(f"Created test event: {event.get('id')}")
        return event
    
    @pytest.fixture(scope="class")
    def test_guest_id(self, auth_token):
        """Get a guest ID from Pulse search"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/pulse/guests/search",
            params={"venue_id": VENUE_ID, "q": ""},
            headers=headers
        )
        guests = response.json().get("guests", [])
        if guests:
            return guests[0]["id"]
        # If no guests, create one
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            data={
                "name": "TEST_Guest_For_Event",
                "venue_id": VENUE_ID
            },
            headers=headers
        )
        return response.json().get("guest_id")
    
    def test_list_event_guests_empty(self, auth_token, test_event):
        """New event has no guests"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/guests",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "guests" in data
        assert "total" in data
        print(f"Event guests count: {data['total']}")
    
    def test_add_guest_to_event(self, auth_token, test_event, test_guest_id):
        """Add a guest to event"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/guests",
            data={"guest_id": test_guest_id},
            headers=headers
        )
        assert response.status_code == 200, f"Add guest failed: {response.text}"
        data = response.json()
        assert "event_guest_id" in data or "guest_id" in data
        print(f"Added guest {test_guest_id} to event")
    
    def test_list_event_guests_after_add(self, auth_token, test_event):
        """Event now has guest"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/guests",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['total'] >= 1
        # Verify enriched data
        if data['guests']:
            guest = data['guests'][0]
            assert "guest_id" in guest
            assert "name" in guest
            print(f"Guest in event: {guest.get('name')}, visits: {guest.get('visits')}")
    
    def test_add_duplicate_guest_fails(self, auth_token, test_event, test_guest_id):
        """Adding same guest twice should fail"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/guests",
            data={"guest_id": test_guest_id},
            headers=headers
        )
        # Should fail with 400 or similar
        assert response.status_code in [400, 409, 422], f"Duplicate should fail: {response.text}"
        print("Duplicate guest correctly rejected")
    
    def test_remove_guest_from_event(self, auth_token, test_event, test_guest_id):
        """Remove guest from event"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/guests/{test_guest_id}",
            headers=headers
        )
        assert response.status_code == 200, f"Remove guest failed: {response.text}"
        data = response.json()
        assert data.get("deleted") == True
        print(f"Removed guest from event")
    
    def test_guest_still_in_pulse_after_removal(self, auth_token, test_guest_id):
        """Guest data persists in Pulse after removal from event"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200, f"Guest should still exist in Pulse"
        data = response.json()
        assert data.get("guest_id") == test_guest_id
        print(f"Guest still exists in Pulse: {data.get('name')}")


class TestEventStaffCRUD:
    """Test event staff assignment endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com", "password": "12345"
        })
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def test_event(self, auth_token):
        """Create a test event for staff CRUD"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        today = date.today().isoformat()
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data={
                "name": f"TEST_Event_Staff_{today}",
                "date": today,
                "cover_price": "10",
                "cover_consumption_price": "25"
            },
            headers=headers
        )
        assert response.status_code == 200
        return response.json()
    
    @pytest.fixture(scope="class")
    def test_staff_id(self, auth_token):
        """Get a staff ID from venue_barmen"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        barmen = response.json().get("barmen", [])
        if barmen:
            print(f"Available staff: {[b.get('name') for b in barmen]}")
            return barmen[0]["id"]
        # Create one if none exist
        response = requests.post(
            f"{BASE_URL}/api/staff/barmen",
            data={"venue_id": VENUE_ID, "name": "TEST_Barman"},
            headers=headers
        )
        return response.json().get("id")
    
    def test_list_event_staff_empty(self, auth_token, test_event):
        """New event has no staff"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/staff",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "staff" in data
        assert "total" in data
        print(f"Event staff count: {data['total']}")
    
    def test_assign_staff_to_event(self, auth_token, test_event, test_staff_id):
        """Assign staff with role and hourly_rate"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/staff",
            data={
                "staff_id": test_staff_id,
                "role": "bartender",
                "hourly_rate": "25.50"
            },
            headers=headers
        )
        assert response.status_code == 200, f"Assign staff failed: {response.text}"
        data = response.json()
        assert "staff_id" in data or "id" in data
        assert data.get("role") == "bartender"
        assert float(data.get("hourly_rate", 0)) == 25.50
        print(f"Assigned staff with role=bartender, rate=$25.50")
    
    def test_list_event_staff_after_assign(self, auth_token, test_event):
        """Event now has staff"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/staff",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['total'] >= 1
        # Verify enriched data
        if data['staff']:
            staff = data['staff'][0]
            assert "staff_id" in staff
            assert "name" in staff
            assert "role" in staff
            assert "hourly_rate" in staff
            print(f"Staff in event: {staff.get('name')}, role: {staff.get('role')}, rate: ${staff.get('hourly_rate')}")
    
    def test_assign_duplicate_staff_fails(self, auth_token, test_event, test_staff_id):
        """Assigning same staff twice should fail"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/staff",
            data={
                "staff_id": test_staff_id,
                "role": "server",
                "hourly_rate": "20"
            },
            headers=headers
        )
        assert response.status_code in [400, 409, 422], f"Duplicate should fail: {response.text}"
        print("Duplicate staff correctly rejected")
    
    def test_remove_staff_from_event(self, auth_token, test_event, test_staff_id):
        """Remove staff from event"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.delete(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{test_event['id']}/staff/{test_staff_id}",
            headers=headers
        )
        assert response.status_code == 200, f"Remove staff failed: {response.text}"
        data = response.json()
        assert data.get("deleted") == True
        print(f"Removed staff from event")


class TestEndEvent:
    """Test end event clears guest presence"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com", "password": "12345"
        })
        return response.json()["access_token"]
    
    def test_end_event_clears_guests(self, auth_token):
        """End event clears event_guests collection"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        today = date.today().isoformat()
        
        # Create event
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data={"name": f"TEST_End_Event_{today}", "date": today, "cover_price": "0", "cover_consumption_price": "0"},
            headers=headers
        )
        event_id = response.json()["id"]
        
        # Get a guest
        response = requests.get(
            f"{BASE_URL}/api/pulse/guests/search",
            params={"venue_id": VENUE_ID, "q": ""},
            headers=headers
        )
        guests = response.json().get("guests", [])
        if guests:
            guest_id = guests[0]["id"]
            
            # Add guest to event
            requests.post(
                f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
                data={"guest_id": guest_id},
                headers=headers
            )
            
            # Verify guest is in event
            response = requests.get(
                f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
                headers=headers
            )
            assert response.json()["total"] >= 1
            
            # End event
            response = requests.post(
                f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/end",
                headers=headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data.get("ended") == True
            assert "guests_cleared" in data
            print(f"Event ended, {data['guests_cleared']} guests cleared")
            
            # Verify guests are cleared
            response = requests.get(
                f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/guests",
                headers=headers
            )
            assert response.json()["total"] == 0
            print("Guest presence cleared from event")
            
            # Verify guest still in Pulse
            response = requests.get(
                f"{BASE_URL}/api/pulse/guest/{guest_id}",
                params={"venue_id": VENUE_ID},
                headers=headers
            )
            assert response.status_code == 200
            print("Guest still exists in Pulse after event ended")


class TestCreateEventWithStaff:
    """Test creating event and assigning multiple staff"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com", "password": "12345"
        })
        return response.json()["access_token"]
    
    def test_create_event_and_assign_staff(self, auth_token):
        """Create event via wizard pattern: create event, then assign staff"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        today = date.today().isoformat()
        
        # Step 1: Create event
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data={
                "name": f"TEST_Wizard_Event_{today}",
                "date": today,
                "cover_price": "15",
                "cover_consumption_price": "30"
            },
            headers=headers
        )
        assert response.status_code == 200
        event = response.json()
        event_id = event["id"]
        print(f"Step 1: Created event {event_id}")
        
        # Get available staff
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        barmen = response.json().get("barmen", [])
        
        # Step 2: Assign multiple staff
        assigned_count = 0
        for barman in barmen[:3]:  # Assign up to 3 staff
            response = requests.post(
                f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff",
                data={
                    "staff_id": barman["id"],
                    "role": barman.get("role", "server"),
                    "hourly_rate": str(barman.get("hourly_rate", 20))
                },
                headers=headers
            )
            if response.status_code == 200:
                assigned_count += 1
        
        print(f"Step 2: Assigned {assigned_count} staff members")
        
        # Verify
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/{event_id}/staff",
            headers=headers
        )
        data = response.json()
        assert data["total"] == assigned_count
        print(f"Event created with {assigned_count} staff members assigned")


class TestTapSessions:
    """Verify tap sessions exist for search testing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com", "password": "12345"
        })
        return response.json()["access_token"]
    
    def test_get_tap_sessions(self, auth_token):
        """Get tap sessions to verify search targets exist"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        sessions = data.get("sessions", [])
        print(f"Found {len(sessions)} tap sessions")
        for s in sessions[:5]:
            print(f"  - Tab #{s.get('tab_number')}: {s.get('guest_name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
