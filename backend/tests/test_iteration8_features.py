"""
Iteration 8 Backend API Tests
Tests for new features:
- Block/Unblock wristband
- Tab status (open tabs)
- TAP page NFC/sessions/custom items
- Guest profile with history
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://owner-command-center-1.preview.emergentagent.com').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"Content-Type": "application/json"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Authentication failed - status {response.status_code}: {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def test_guest_id(auth_headers):
    """Create a test guest for testing block/unblock"""
    response = requests.post(
        f"{BASE_URL}/api/pulse/guest/intake",
        data={
            "name": f"TEST_BlockGuest_{uuid.uuid4().hex[:6]}",
            "venue_id": VENUE_ID,
            "email": f"test_block_{uuid.uuid4().hex[:6]}@test.com"
        },
        headers=auth_headers
    )
    if response.status_code == 200:
        return response.json().get("guest_id")
    pytest.skip(f"Failed to create test guest: {response.status_code}")


# ─── Block/Unblock Wristband Tests ──────────────────────────────────
class TestBlockUnblockWristband:
    """Tests for wristband block/unblock functionality"""

    def test_block_wristband(self, auth_headers, test_guest_id):
        """POST /api/pulse/guest/{id}/block - blocks wristband"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}/block",
            data={"venue_id": VENUE_ID, "reason": "lost"},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["guest_id"] == test_guest_id
        assert data["blocked"] == True
        assert data["reason"] == "lost"
        print(f"✓ Block wristband: guest {test_guest_id} blocked")

    def test_guest_profile_shows_blocked(self, auth_headers, test_guest_id):
        """GET /api/pulse/guest/{id} - shows wristband_blocked status"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("wristband_blocked") == True
        assert data.get("wristband_block_reason") == "lost"
        print(f"✓ Guest profile shows blocked status: {data['wristband_blocked']}")

    def test_unblock_wristband(self, auth_headers, test_guest_id):
        """POST /api/pulse/guest/{id}/unblock - unblocks wristband"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}/unblock",
            data={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["guest_id"] == test_guest_id
        assert data["blocked"] == False
        print(f"✓ Unblock wristband: guest {test_guest_id} unblocked")

    def test_guest_profile_shows_unblocked(self, auth_headers, test_guest_id):
        """Verify guest is now unblocked"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("wristband_blocked") == False
        print(f"✓ Guest profile shows unblocked status: {data['wristband_blocked']}")


# ─── Tab Status Tests ──────────────────────────────────────────────
class TestTabStatus:
    """Tests for guest tab status functionality"""

    def test_tab_status_no_tabs(self, auth_headers, test_guest_id):
        """GET /api/pulse/guest/{id}/tab-status - returns empty when no tabs"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}/tab-status?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "has_open_tabs" in data
        assert "open_tabs" in data
        assert "total_owed" in data
        print(f"✓ Tab status: has_open_tabs={data['has_open_tabs']}, total_owed={data['total_owed']}")


# ─── TAP Active Sessions Tests ─────────────────────────────────────
class TestTAPSessions:
    """Tests for TAP sessions/tabs functionality"""

    def test_get_active_sessions(self, auth_headers):
        """GET /api/tap/sessions/active - returns open sessions"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions/active?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
        assert isinstance(data["sessions"], list)
        print(f"✓ Active sessions: {data['total']} open tabs")

    def test_open_new_tab(self, auth_headers):
        """POST /api/tap/session/open - opens new tab"""
        test_name = f"TEST_TapGuest_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": test_name,
                "session_type": "tap"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["guest_name"] == test_name
        assert data["status"] == "open"
        print(f"✓ Opened new tab: {data['session_id']} for {test_name}")
        return data["session_id"]

    def test_get_session_details(self, auth_headers):
        """GET /api/tap/session/{id} - returns session details"""
        # First open a session
        session_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": f"TEST_SessionDetail_{uuid.uuid4().hex[:6]}",
                "session_type": "tap"
            },
            headers=auth_headers
        )
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]

        # Then get details
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert "items" in data
        assert "total" in data
        print(f"✓ Session details: {data['id']} - total: R${data['total']}")

    def test_add_custom_item_to_session(self, auth_headers):
        """POST /api/tap/session/{id}/add-custom - adds custom item"""
        # Open a session first
        session_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": f"TEST_CustomItem_{uuid.uuid4().hex[:6]}",
                "session_type": "tap"
            },
            headers=auth_headers
        )
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]

        # Add custom item
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add-custom",
            data={
                "item_name": "TEST_CustomDrink",
                "category": "Drinks",
                "unit_price": "25.50",
                "qty": "2"
            },
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_CustomDrink"
        assert data["qty"] == 2
        assert data["line_total"] == 51.0
        print(f"✓ Added custom item: {data['name']} x{data['qty']} = R${data['line_total']}")

    def test_close_tab_with_payment(self, auth_headers):
        """POST /api/tap/session/{id}/close - closes tab with payment"""
        # Open session
        session_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": f"TEST_CloseTab_{uuid.uuid4().hex[:6]}",
                "session_type": "tap"
            },
            headers=auth_headers
        )
        session_id = session_response.json()["session_id"]

        # Add an item
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add-custom",
            data={"item_name": "Test Beer", "category": "Beer", "unit_price": "10", "qty": "1"},
            headers=auth_headers
        )

        # Close tab
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data={"payment_method": "card"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "closed"
        assert data["payment_method"] == "card"
        print(f"✓ Closed tab: {session_id} with payment method: {data['payment_method']}")


# ─── TAP Stats Tests ───────────────────────────────────────────────
class TestTAPStats:
    """Tests for TAP statistics"""

    def test_get_tap_stats(self, auth_headers):
        """GET /api/tap/stats - returns revenue and tab counts"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "open_tabs" in data
        assert "revenue_today" in data
        assert "running_total" in data
        print(f"✓ TAP stats: {data['open_tabs']} open tabs, R${data['revenue_today']} revenue today")

    def test_get_tap_config(self, auth_headers):
        """GET /api/tap/config - returns bar mode and config"""
        response = requests.get(
            f"{BASE_URL}/api/tap/config?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "bar_mode" in data
        assert "currency" in data
        print(f"✓ TAP config: bar_mode={data['bar_mode']}, currency={data['currency']}")


# ─── TAP Catalog Tests ─────────────────────────────────────────────
class TestTAPCatalog:
    """Tests for TAP catalog/menu"""

    def test_get_catalog(self, auth_headers):
        """GET /api/tap/catalog - returns catalog items"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0
        categories = set(item["category"] for item in data["items"])
        print(f"✓ Catalog: {len(data['items'])} items in categories: {categories}")


# ─── Guest Profile Tests ───────────────────────────────────────────
class TestGuestProfile:
    """Tests for guest profile functionality"""

    def test_get_guest_profile(self, auth_headers, test_guest_id):
        """GET /api/pulse/guest/{id}/profile - returns full profile"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}/profile?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "guest_id" in data
        assert "name" in data
        assert "history" in data
        assert "consumptions" in data
        assert "events_attended" in data
        assert "wristband_blocked" in data
        print(f"✓ Guest profile: {data['name']} - entries: {data.get('entries_count', 0)}, exits: {data.get('exits_count', 0)}")


# ─── Inside Guests Tests ───────────────────────────────────────────
class TestInsideGuests:
    """Tests for inside guests functionality"""

    def test_get_inside_guests(self, auth_headers):
        """GET /api/pulse/inside - returns guests inside"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "guests" in data
        assert "total" in data
        print(f"✓ Inside guests: {data['total']} guests currently inside")


# ─── Today's Entries Tests ─────────────────────────────────────────
class TestTodayEntries:
    """Tests for today's entries"""

    def test_get_today_entries(self, auth_headers):
        """GET /api/pulse/entries/today - returns today's entries"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today?venue_id={VENUE_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert "total" in data
        assert "allowed" in data
        assert "denied" in data
        print(f"✓ Today's entries: {data['total']} total, {data['allowed']} allowed, {data['denied']} denied")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
