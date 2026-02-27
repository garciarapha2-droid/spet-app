"""
TAP Module B0+B1 Tests
- TAP config & stats (B0)
- Tab/session lifecycle (B1): open, add items, close
- Catalog management
- Payment recording
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

# Catalog item IDs
HEINEKEN_ID = "a0000001-0001-0001-0001-000000000001"
GIN_TONIC_ID = "a0000001-0001-0001-0001-000000000005"


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for tests"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "teste@teste.com", "password": "12345"}
    )
    if response.status_code != 200:
        pytest.skip("Authentication failed - skipping TAP tests")
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


# ─── Test Auth with Updated Credentials ───────────────────────────
class TestAuthWithNewPassword:
    """Tests for updated user credentials"""

    def test_login_with_new_password_12345(self):
        """Test login with new password 12345 works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "teste@teste.com", "password": "12345"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "teste@teste.com"

    def test_login_returns_super_admin_role(self):
        """Test user has super_admin role with ALL permissions"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "teste@teste.com", "password": "12345"}
        )
        assert response.status_code == 200
        data = response.json()
        roles = data.get("next", {})
        # Check user has roles
        token_payload = data["access_token"].split('.')[1]
        import base64
        import json
        padding = 4 - len(token_payload) % 4
        token_payload += "=" * padding
        decoded = json.loads(base64.urlsafe_b64decode(token_payload))
        assert any(r["role"] == "super_admin" for r in decoded.get("roles", []))

    def test_old_password_fails(self):
        """Test old password teste123 no longer works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "teste@teste.com", "password": "teste123"}
        )
        assert response.status_code == 401


# ─── Test TAP Config B0 ───────────────────────────────────────────
class TestTapConfig:
    """B0 - TAP configuration tests"""

    def test_get_config_returns_bar_mode_disco(self, headers):
        """GET /api/tap/config returns bar_mode disco for venue"""
        response = requests.get(
            f"{BASE_URL}/api/tap/config",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["venue_id"] == VENUE_ID
        assert data["bar_mode"] == "disco"
        assert data["currency"] == "BRL"
        assert data["allow_tabs"] == True

    def test_config_requires_auth(self):
        """Config endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/tap/config",
            params={"venue_id": VENUE_ID}
        )
        assert response.status_code in [401, 403]


# ─── Test TAP Stats B0 ────────────────────────────────────────────
class TestTapStats:
    """B0 - TAP real-time stats tests"""

    def test_get_stats_returns_all_kpis(self, headers):
        """GET /api/tap/stats returns open_tabs, running_total, closed_today, revenue_today"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "open_tabs" in data
        assert "running_total" in data
        assert "closed_today" in data
        assert "revenue_today" in data
        # All should be numeric
        assert isinstance(data["open_tabs"], int)
        assert isinstance(data["running_total"], (int, float))
        assert isinstance(data["closed_today"], int)
        assert isinstance(data["revenue_today"], (int, float))

    def test_stats_requires_auth(self):
        """Stats endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/tap/stats",
            params={"venue_id": VENUE_ID}
        )
        assert response.status_code in [401, 403]


# ─── Test TAP Catalog ─────────────────────────────────────────────
class TestTapCatalog:
    """Catalog management tests (MongoDB)"""

    def test_get_catalog_returns_items(self, headers):
        """GET /api/tap/catalog returns catalog items"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) >= 12  # At least 12 items

    def test_catalog_items_have_uuid_ids(self, headers):
        """Catalog items have UUID format IDs"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert response.status_code == 200
        items = response.json()["items"]
        for item in items:
            assert "id" in item
            # Validate UUID format
            try:
                uuid.UUID(item["id"])
            except ValueError:
                pytest.fail(f"Item ID {item['id']} is not a valid UUID")

    def test_heineken_exists_in_catalog(self, headers):
        """Heineken item exists with correct ID"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        items = response.json()["items"]
        heineken = next((i for i in items if i["id"] == HEINEKEN_ID), None)
        assert heineken is not None
        assert heineken["name"] == "Heineken"
        assert heineken["category"] == "Beer"
        assert heineken["price"] == 18

    def test_gin_tonic_exists_in_catalog(self, headers):
        """Gin & Tonic item exists with correct ID"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        items = response.json()["items"]
        gin_tonic = next((i for i in items if i["id"] == GIN_TONIC_ID), None)
        assert gin_tonic is not None
        assert gin_tonic["name"] == "Gin & Tonic"
        assert gin_tonic["category"] == "Cocktails"
        assert gin_tonic["price"] == 32


# ─── Test Session Open B1 ─────────────────────────────────────────
class TestSessionOpen:
    """B1 - Open tab tests (PostgreSQL tap_sessions)"""

    def test_open_tab_creates_session(self, headers):
        """POST /api/tap/session/open creates new tab in PostgreSQL"""
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_OpenTabGuest"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["guest_name"] == "TEST_OpenTabGuest"
        assert data["status"] == "open"
        assert "opened_at" in data
        # Validate session_id is UUID
        uuid.UUID(data["session_id"])

    def test_open_tab_requires_venue_id(self, headers):
        """Open tab fails without venue_id"""
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={"guest_name": "Test"}
        )
        assert response.status_code == 422  # Validation error


# ─── Test Session List B1 ─────────────────────────────────────────
class TestSessionList:
    """B1 - List sessions tests"""

    def test_list_sessions_returns_open_tabs(self, headers):
        """GET /api/tap/sessions returns list of open tabs"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID, "status": "open"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
        assert isinstance(data["sessions"], list)

    def test_sessions_have_guest_name_from_meta(self, headers):
        """Sessions include guest_name from meta JSONB column"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions",
            params={"venue_id": VENUE_ID, "status": "open"},
            headers=headers
        )
        sessions = response.json()["sessions"]
        for session in sessions:
            assert "guest_name" in session
            assert isinstance(session["guest_name"], str)


# ─── Test Session Add Item B1 ─────────────────────────────────────
class TestSessionAddItem:
    """B1 - Add item to tab tests (PG tap_items)"""

    @pytest.fixture
    def test_session(self, headers):
        """Create a test session for item tests"""
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_AddItemGuest"
            }
        )
        return response.json()["session_id"]

    def test_add_catalog_item_to_tab(self, headers, test_session):
        """POST /api/tap/session/{id}/add adds item to tab"""
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{test_session}/add",
            headers=headers,
            data={
                "item_id": HEINEKEN_ID,
                "qty": 2
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Heineken"
        assert data["qty"] == 2
        assert data["line_total"] == 36  # 18 * 2
        assert data["session_total"] == 36
        assert "line_item_id" in data

    def test_add_multiple_items_updates_total(self, headers, test_session):
        """Adding multiple items correctly updates session total"""
        # Add Heineken
        requests.post(
            f"{BASE_URL}/api/tap/session/{test_session}/add",
            headers=headers,
            data={"item_id": HEINEKEN_ID, "qty": 1}
        )
        # Add Gin & Tonic
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{test_session}/add",
            headers=headers,
            data={"item_id": GIN_TONIC_ID, "qty": 1}
        )
        assert response.status_code == 200
        # Total should be 18 + 32 = 50
        assert response.json()["session_total"] == 50

    def test_add_item_to_nonexistent_session_fails(self, headers):
        """Cannot add item to nonexistent session"""
        fake_id = str(uuid.uuid4())
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{fake_id}/add",
            headers=headers,
            data={"item_id": HEINEKEN_ID, "qty": 1}
        )
        assert response.status_code == 404


# ─── Test Session Get B1 ──────────────────────────────────────────
class TestSessionGet:
    """B1 - Get session details tests"""

    @pytest.fixture
    def session_with_items(self, headers):
        """Create session with items for testing"""
        # Open session
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_SessionDetailGuest"}
        )
        session_id = open_resp.json()["session_id"]
        # Add items
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=headers,
            data={"item_id": HEINEKEN_ID, "qty": 2}
        )
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=headers,
            data={"item_id": GIN_TONIC_ID, "qty": 1}
        )
        return session_id

    def test_get_session_returns_details_with_items(self, headers, session_with_items):
        """GET /api/tap/session/{id} returns session details with items array"""
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_with_items}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_with_items
        assert data["guest_name"] == "TEST_SessionDetailGuest"
        assert data["status"] == "open"
        assert "items" in data
        assert len(data["items"]) == 2
        assert data["total"] == 68  # 36 + 32

    def test_session_items_have_correct_structure(self, headers, session_with_items):
        """Session items have all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_with_items}",
            headers=headers
        )
        items = response.json()["items"]
        for item in items:
            assert "id" in item
            assert "name" in item
            assert "category" in item
            assert "unit_price" in item
            assert "qty" in item
            assert "line_total" in item

    def test_get_nonexistent_session_returns_404(self, headers):
        """GET nonexistent session returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/tap/session/{fake_id}",
            headers=headers
        )
        assert response.status_code == 404


# ─── Test Session Close B1 ────────────────────────────────────────
class TestSessionClose:
    """B1 - Close tab tests (PG tap_payments)"""

    @pytest.fixture
    def session_to_close(self, headers):
        """Create session for closing"""
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_CloseTabGuest"}
        )
        session_id = open_resp.json()["session_id"]
        # Add an item
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=headers,
            data={"item_id": HEINEKEN_ID, "qty": 1}
        )
        return session_id

    def test_close_tab_with_card_payment(self, headers, session_to_close):
        """POST /api/tap/session/{id}/close closes tab with card payment"""
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_to_close}/close",
            headers=headers,
            data={"payment_method": "card"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_to_close
        assert data["status"] == "closed"
        assert data["payment_method"] == "card"
        assert "closed_at" in data
        assert data["total"] == 18

    def test_close_tab_with_cash_payment(self, headers):
        """Close tab with cash payment method"""
        # Create new session
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_CashPayGuest"}
        )
        session_id = open_resp.json()["session_id"]
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=headers,
            data={"item_id": HEINEKEN_ID, "qty": 1}
        )
        # Close with cash
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            headers=headers,
            data={"payment_method": "cash"}
        )
        assert response.status_code == 200
        assert response.json()["payment_method"] == "cash"

    def test_close_tab_with_comp_payment(self, headers):
        """Close tab with comp (complimentary) payment method"""
        # Create new session
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_CompPayGuest"}
        )
        session_id = open_resp.json()["session_id"]
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=headers,
            data={"item_id": GIN_TONIC_ID, "qty": 1}
        )
        # Close with comp
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            headers=headers,
            data={"payment_method": "comp"}
        )
        assert response.status_code == 200
        assert response.json()["payment_method"] == "comp"

    def test_cannot_close_already_closed_tab(self, headers, session_to_close):
        """Cannot close an already closed tab"""
        # First close
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_to_close}/close",
            headers=headers,
            data={"payment_method": "card"}
        )
        # Try to close again
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_to_close}/close",
            headers=headers,
            data={"payment_method": "card"}
        )
        assert response.status_code == 400

    def test_cannot_add_item_to_closed_tab(self, headers, session_to_close):
        """Cannot add item to closed tab"""
        # Close first
        requests.post(
            f"{BASE_URL}/api/tap/session/{session_to_close}/close",
            headers=headers,
            data={"payment_method": "card"}
        )
        # Try to add item
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_to_close}/add",
            headers=headers,
            data={"item_id": HEINEKEN_ID, "qty": 1}
        )
        assert response.status_code == 400


# ─── Test E2E Full Tab Flow ───────────────────────────────────────
class TestE2ETabFlow:
    """End-to-end tab flow test"""

    def test_full_tab_lifecycle(self, headers):
        """Test complete tab flow: open → add items → verify → close"""
        # 1. Open tab
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=headers,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_E2EGuest"}
        )
        assert open_resp.status_code == 200
        session_id = open_resp.json()["session_id"]

        # 2. Add items
        add1 = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=headers,
            data={"item_id": HEINEKEN_ID, "qty": 2}
        )
        assert add1.status_code == 200
        assert add1.json()["line_total"] == 36

        add2 = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=headers,
            data={"item_id": GIN_TONIC_ID, "qty": 1}
        )
        assert add2.status_code == 200
        assert add2.json()["session_total"] == 68

        # 3. Verify session details
        get_resp = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=headers
        )
        assert get_resp.status_code == 200
        session = get_resp.json()
        assert session["total"] == 68
        assert len(session["items"]) == 2

        # 4. Close tab
        close_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            headers=headers,
            data={"payment_method": "card"}
        )
        assert close_resp.status_code == 200
        assert close_resp.json()["status"] == "closed"
        assert close_resp.json()["total"] == 68

        # 5. Verify stats updated
        stats_resp = requests.get(
            f"{BASE_URL}/api/tap/stats",
            params={"venue_id": VENUE_ID},
            headers=headers
        )
        assert stats_resp.status_code == 200
