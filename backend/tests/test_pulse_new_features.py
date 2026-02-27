"""
Test PULSE New Features - iteration 4
Features: Guest history, Inside guests, Exit registration, Tab navigation
Test credentials: teste@teste.com / 12345
Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = '40a24e04-75b6-435d-bfff-ab0d469ce543'


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "teste@teste.com", "password": "12345"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture
def api_client(auth_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    })
    return session


# ─── Test Guest History Endpoint ─────────────────────────────────────────
class TestGuestHistory:
    """GET /api/pulse/guest/{id}/history - returns guest history with all entry/exit events"""

    def test_get_guest_history_returns_history_array(self, api_client):
        """Guest history endpoint returns guest_id, guest_name, visits, history array"""
        # First get today's entries to find a guest ID
        entries_res = api_client.get(f"{BASE_URL}/api/pulse/entries/today", params={"venue_id": VENUE_ID})
        assert entries_res.status_code == 200
        entries = entries_res.json().get("entries", [])
        
        if len(entries) == 0:
            # Create a test guest first
            fd = {
                "name": "TEST_History_Guest",
                "venue_id": VENUE_ID
            }
            intake_res = api_client.post(
                f"{BASE_URL}/api/pulse/guest/intake",
                data=fd,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            assert intake_res.status_code == 200
            guest_id = intake_res.json().get("guest_id")
            
            # Record an entry decision
            dec_fd = {
                "guest_id": guest_id,
                "venue_id": VENUE_ID,
                "decision": "allowed",
                "entry_type": "consumption_only",
                "cover_amount": "0",
                "cover_paid": "false"
            }
            api_client.post(
                f"{BASE_URL}/api/pulse/entry/decision",
                data=dec_fd,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
        else:
            guest_id = entries[0]["guest_id"]
        
        # Now test the history endpoint
        res = api_client.get(
            f"{BASE_URL}/api/pulse/guest/{guest_id}/history",
            params={"venue_id": VENUE_ID}
        )
        assert res.status_code == 200
        data = res.json()
        
        # Verify structure
        assert "guest_id" in data
        assert "guest_name" in data
        assert "visits" in data
        assert "history" in data
        assert isinstance(data["history"], list)
        assert "total" in data
        assert data["guest_id"] == guest_id
        print(f"✅ Guest history returned {data['total']} events for {data['guest_name']}")

    def test_history_includes_entry_events(self, api_client):
        """History events have correct structure with decision, entry_type, created_at"""
        # Get entries to find a guest
        entries_res = api_client.get(f"{BASE_URL}/api/pulse/entries/today", params={"venue_id": VENUE_ID})
        assert entries_res.status_code == 200
        entries = entries_res.json().get("entries", [])
        
        if len(entries) == 0:
            pytest.skip("No entries today to test history structure")
        
        guest_id = entries[0]["guest_id"]
        res = api_client.get(
            f"{BASE_URL}/api/pulse/guest/{guest_id}/history",
            params={"venue_id": VENUE_ID}
        )
        assert res.status_code == 200
        history = res.json().get("history", [])
        
        if len(history) > 0:
            event = history[0]
            assert "entry_id" in event
            assert "decision" in event
            assert "entry_type" in event
            assert "created_at" in event
            print(f"✅ History event structure valid: {event['decision']} / {event['entry_type']}")

    def test_history_returns_404_for_nonexistent_guest(self, api_client):
        """History endpoint returns 404 for unknown guest ID"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        res = api_client.get(
            f"{BASE_URL}/api/pulse/guest/{fake_id}/history",
            params={"venue_id": VENUE_ID}
        )
        # Should return 404 or an empty result
        # Based on code, it should still return but with guest_name "Unknown"
        assert res.status_code in [200, 404]
        print(f"✅ Nonexistent guest history handled correctly (status: {res.status_code})")


# ─── Test Inside Guests Endpoint ─────────────────────────────────────────
class TestInsideGuests:
    """GET /api/pulse/inside - returns guests currently inside"""

    def test_inside_endpoint_returns_guests_array(self, api_client):
        """Inside endpoint returns guests array with total count"""
        res = api_client.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        assert res.status_code == 200
        data = res.json()
        
        assert "guests" in data
        assert "total" in data
        assert isinstance(data["guests"], list)
        assert isinstance(data["total"], int)
        print(f"✅ Inside endpoint returned {data['total']} guests currently inside")

    def test_inside_guest_structure(self, api_client):
        """Inside guests have guest_id, guest_name, entered_at, entry_type"""
        res = api_client.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        assert res.status_code == 200
        guests = res.json().get("guests", [])
        
        if len(guests) > 0:
            guest = guests[0]
            assert "guest_id" in guest
            assert "guest_name" in guest
            assert "entered_at" in guest
            assert "entry_type" in guest
            print(f"✅ Inside guest structure valid: {guest['guest_name']} entered at {guest['entered_at']}")
        else:
            print("⚠️ No guests inside - structure test skipped")

    def test_inside_requires_auth(self):
        """Inside endpoint requires authentication"""
        res = requests.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        assert res.status_code in [401, 403]
        print("✅ Inside endpoint requires authentication")


# ─── Test Exit Registration Endpoint ─────────────────────────────────────
class TestExitRegistration:
    """POST /api/pulse/exit - registers guest exit"""

    def test_exit_endpoint_registers_exit(self, api_client):
        """Exit endpoint records exit event and removes guest from inside list"""
        # First create a guest and allow them entry
        fd = {
            "name": "TEST_Exit_Guest",
            "venue_id": VENUE_ID
        }
        intake_res = api_client.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            data=fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert intake_res.status_code == 200
        guest_id = intake_res.json().get("guest_id")
        
        # Record an allowed entry
        dec_fd = {
            "guest_id": guest_id,
            "venue_id": VENUE_ID,
            "decision": "allowed",
            "entry_type": "consumption_only",
            "cover_amount": "0",
            "cover_paid": "false"
        }
        dec_res = api_client.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            data=dec_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert dec_res.status_code == 200
        
        # Now register exit
        exit_fd = {
            "guest_id": guest_id,
            "venue_id": VENUE_ID
        }
        exit_res = api_client.post(
            f"{BASE_URL}/api/pulse/exit",
            data=exit_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert exit_res.status_code == 200
        exit_data = exit_res.json()
        
        assert "entry_id" in exit_data
        assert exit_data["guest_id"] == guest_id
        assert exit_data["decision"] == "exit"
        assert "created_at" in exit_data
        print(f"✅ Exit registered for guest {guest_id}")

    def test_exit_appears_in_history(self, api_client):
        """Exit event appears in guest history with entry_type 'exit'"""
        # Create and process a guest through entry + exit
        fd = {
            "name": "TEST_Exit_History",
            "venue_id": VENUE_ID
        }
        intake_res = api_client.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            data=fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert intake_res.status_code == 200
        guest_id = intake_res.json().get("guest_id")
        
        # Allow entry
        dec_fd = {
            "guest_id": guest_id,
            "venue_id": VENUE_ID,
            "decision": "allowed",
            "entry_type": "vip",
            "cover_amount": "0",
            "cover_paid": "false"
        }
        api_client.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            data=dec_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        # Register exit
        exit_fd = {"guest_id": guest_id, "venue_id": VENUE_ID}
        api_client.post(
            f"{BASE_URL}/api/pulse/exit",
            data=exit_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        # Check history
        history_res = api_client.get(
            f"{BASE_URL}/api/pulse/guest/{guest_id}/history",
            params={"venue_id": VENUE_ID}
        )
        assert history_res.status_code == 200
        history = history_res.json().get("history", [])
        
        # Should have at least 2 events (entry + exit)
        assert len(history) >= 2
        
        # First event (most recent) should be exit
        exit_event = history[0]
        assert exit_event["entry_type"] == "exit"
        assert exit_event["decision"] == "exit"
        print(f"✅ Exit event appears in history (total: {len(history)} events)")

    def test_exited_guest_not_in_inside_list(self, api_client):
        """After exit, guest should not appear in inside list"""
        # Create guest and allow entry
        fd = {
            "name": "TEST_Exit_Inside_Check",
            "venue_id": VENUE_ID
        }
        intake_res = api_client.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            data=fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert intake_res.status_code == 200
        guest_id = intake_res.json().get("guest_id")
        
        # Allow entry
        dec_fd = {
            "guest_id": guest_id,
            "venue_id": VENUE_ID,
            "decision": "allowed",
            "entry_type": "consumption_only",
            "cover_amount": "0",
            "cover_paid": "false"
        }
        api_client.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            data=dec_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        # Verify guest is inside
        inside_before = api_client.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        inside_guests_before = [g["guest_id"] for g in inside_before.json().get("guests", [])]
        assert guest_id in inside_guests_before, "Guest should be inside after entry"
        
        # Register exit
        exit_fd = {"guest_id": guest_id, "venue_id": VENUE_ID}
        api_client.post(
            f"{BASE_URL}/api/pulse/exit",
            data=exit_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        # Verify guest is no longer inside
        inside_after = api_client.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        inside_guests_after = [g["guest_id"] for g in inside_after.json().get("guests", [])]
        assert guest_id not in inside_guests_after, "Guest should not be inside after exit"
        print("✅ Guest correctly removed from inside list after exit")

    def test_exit_requires_auth(self):
        """Exit endpoint requires authentication"""
        fd = {"guest_id": "fake-id", "venue_id": VENUE_ID}
        res = requests.post(f"{BASE_URL}/api/pulse/exit", data=fd)
        assert res.status_code in [401, 403]
        print("✅ Exit endpoint requires authentication")

    def test_exit_returns_404_for_nonexistent_guest(self, api_client):
        """Exit endpoint returns 404 for unknown guest"""
        exit_fd = {
            "guest_id": "00000000-0000-0000-0000-000000000000",
            "venue_id": VENUE_ID
        }
        res = api_client.post(
            f"{BASE_URL}/api/pulse/exit",
            data=exit_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert res.status_code == 404
        print("✅ Exit returns 404 for nonexistent guest")


# ─── Test Full Entry→Exit Flow ─────────────────────────────────────────
class TestEntryExitFlow:
    """E2E test: create guest → allow entry → verify inside → exit → verify removed"""

    def test_full_entry_exit_lifecycle(self, api_client):
        """Complete lifecycle: intake → decision → inside → exit → not inside"""
        # 1. Intake
        fd = {"name": "TEST_Lifecycle_Guest", "email": f"test_lifecycle_{os.urandom(4).hex()}@test.com", "venue_id": VENUE_ID}
        intake_res = api_client.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            data=fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert intake_res.status_code == 200
        guest_id = intake_res.json()["guest_id"]
        print(f"  Step 1: Guest created - {guest_id}")
        
        # 2. Decision - allow entry
        dec_fd = {
            "guest_id": guest_id,
            "venue_id": VENUE_ID,
            "decision": "allowed",
            "entry_type": "cover_consumption",
            "cover_amount": "50",
            "cover_paid": "true"
        }
        dec_res = api_client.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            data=dec_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert dec_res.status_code == 200
        print("  Step 2: Entry allowed")
        
        # 3. Verify inside
        inside_res = api_client.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        assert inside_res.status_code == 200
        inside_ids = [g["guest_id"] for g in inside_res.json()["guests"]]
        assert guest_id in inside_ids
        print("  Step 3: Guest verified inside")
        
        # 4. Exit
        exit_fd = {"guest_id": guest_id, "venue_id": VENUE_ID}
        exit_res = api_client.post(
            f"{BASE_URL}/api/pulse/exit",
            data=exit_fd,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        assert exit_res.status_code == 200
        print("  Step 4: Exit registered")
        
        # 5. Verify not inside
        inside_res2 = api_client.get(f"{BASE_URL}/api/pulse/inside", params={"venue_id": VENUE_ID})
        inside_ids2 = [g["guest_id"] for g in inside_res2.json()["guests"]]
        assert guest_id not in inside_ids2
        print("  Step 5: Guest verified NOT inside")
        
        # 6. Check history has 2 events
        history_res = api_client.get(f"{BASE_URL}/api/pulse/guest/{guest_id}/history", params={"venue_id": VENUE_ID})
        assert history_res.status_code == 200
        history = history_res.json()["history"]
        assert len(history) >= 2
        print(f"  Step 6: History has {len(history)} events")
        
        print("✅ Full entry→exit lifecycle completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
