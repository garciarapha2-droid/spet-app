"""
Test iteration 7 features:
- Venue Events API (GET/POST /api/venue/{venue_id}/events)
- Rewards Config API (GET/POST /api/rewards/config, tiers, rewards)
- TAP Active Sessions (GET /api/tap/sessions/active)
- TAP Custom Item (POST /api/tap/session/{id}/add-custom)
- Pulse Exits Today (GET /api/pulse/exits/today)
- Guest Profile (GET /api/pulse/guest/{id}/profile)
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://leadership-hub-test.preview.emergentagent.com')
VENUE_ID = '40a24e04-75b6-435d-bfff-ab0d469ce543'
TEST_EMAIL = 'teste@teste.com'
TEST_PASSWORD = '12345'


@pytest.fixture(scope='module')
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert 'access_token' in data, "No access_token in login response"
    return data['access_token']


@pytest.fixture(scope='module')
def auth_headers(auth_token):
    """Return headers with authentication"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


# ─── VENUE EVENTS TESTS ────────────────────────────────────────────

class TestVenueEvents:
    """Tests for venue events endpoints"""

    def test_get_events_without_date(self, auth_headers):
        """GET /api/venue/{venue_id}/events returns events list"""
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'events' in data
        assert 'total' in data
        assert isinstance(data['events'], list)

    def test_get_events_with_date(self, auth_headers):
        """GET /api/venue/{venue_id}/events?date=YYYY-MM-DD returns filtered events"""
        today = datetime.now().strftime('%Y-%m-%d')
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            params={'date': today},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'events' in data

    def test_create_event(self, auth_headers):
        """POST /api/venue/{venue_id}/events creates a new event"""
        today = datetime.now().strftime('%Y-%m-%d')
        form_data = {
            'name': f'TEST_Event_{datetime.now().timestamp()}',
            'date': today,
            'cover_price': '50',
            'cover_consumption_price': '80'
        }
        response = requests.post(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events",
            data=form_data,
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'id' in data
        assert 'name' in data
        assert data['venue_id'] == VENUE_ID

    def test_get_event_dates(self, auth_headers):
        """GET /api/venue/{venue_id}/events/dates returns dates with events"""
        month = datetime.now().strftime('%Y-%m')
        response = requests.get(
            f"{BASE_URL}/api/venue/{VENUE_ID}/events/dates",
            params={'month': month},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'dates' in data
        assert isinstance(data['dates'], list)


# ─── REWARDS CONFIG TESTS ─────────────────────────────────────────

class TestRewardsConfig:
    """Tests for rewards configuration endpoints"""

    def test_get_rewards_config(self, auth_headers):
        """GET /api/rewards/config returns config with tiers and rewards"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/config",
            params={'venue_id': VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'venue_id' in data
        assert 'tiers' in data
        assert 'rewards' in data
        assert isinstance(data['tiers'], list)
        # Should have default 4 tiers
        assert len(data['tiers']) >= 4, f"Expected at least 4 tiers, got {len(data['tiers'])}"
        tier_names = [t['name'] for t in data['tiers']]
        assert 'Bronze' in tier_names
        assert 'Silver' in tier_names
        assert 'Gold' in tier_names
        assert 'Platinum' in tier_names

    def test_save_rewards_config(self, auth_headers):
        """POST /api/rewards/config saves enabled and points_per_real"""
        form_data = {
            'venue_id': VENUE_ID,
            'enabled': 'true',
            'points_per_real': '2'
        }
        response = requests.post(
            f"{BASE_URL}/api/rewards/config",
            data=form_data,
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data['status'] == 'ok'

    def test_update_tiers(self, auth_headers):
        """POST /api/rewards/config/tiers updates tier definitions"""
        tiers = [
            {"name": "Bronze", "min_points": 0, "color": "#CD7F32", "perks": "Basic member"},
            {"name": "Silver", "min_points": 500, "color": "#C0C0C0", "perks": "Priority entry"},
            {"name": "Gold", "min_points": 2000, "color": "#FFD700", "perks": "VIP access + free drink"},
            {"name": "Platinum", "min_points": 5000, "color": "#E5E4E2", "perks": "All perks + reserved table"},
        ]
        form_data = {
            'venue_id': VENUE_ID,
            'tiers_json': json.dumps(tiers)
        }
        response = requests.post(
            f"{BASE_URL}/api/rewards/config/tiers",
            data=form_data,
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data['status'] == 'ok'
        assert 'tiers' in data

    def test_update_rewards_list(self, auth_headers):
        """POST /api/rewards/config/rewards updates available rewards"""
        rewards = [
            {"name": "Free Beer", "points_cost": 100, "active": True},
            {"name": "VIP Upgrade", "points_cost": 500, "active": True},
        ]
        form_data = {
            'venue_id': VENUE_ID,
            'rewards_json': json.dumps(rewards)
        }
        response = requests.post(
            f"{BASE_URL}/api/rewards/config/rewards",
            data=form_data,
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data['status'] == 'ok'


# ─── TAP SESSIONS TESTS ───────────────────────────────────────────

class TestTAPSessions:
    """Tests for TAP active sessions and custom items"""

    def test_get_active_sessions(self, auth_headers):
        """GET /api/tap/sessions/active returns open sessions"""
        response = requests.get(
            f"{BASE_URL}/api/tap/sessions/active",
            params={'venue_id': VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'sessions' in data
        assert 'total' in data
        assert isinstance(data['sessions'], list)

    def test_add_custom_item_to_session(self, auth_headers):
        """POST /api/tap/session/{id}/add-custom adds custom item"""
        # First open a session
        form_data = {
            'venue_id': VENUE_ID,
            'guest_name': 'TEST_CustomItemGuest',
            'session_type': 'tap'
        }
        open_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=form_data,
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert open_response.status_code == 200, f"Failed to open session: {open_response.text}"
        session_id = open_response.json()['session_id']

        # Add custom item
        custom_data = {
            'item_name': 'TEST_SpecialDrink',
            'category': 'Cocktails',
            'unit_price': '35.50',
            'qty': '2'
        }
        response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add-custom",
            data=custom_data,
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'line_item_id' in data
        assert 'name' in data
        assert data['name'] == 'TEST_SpecialDrink'
        assert data['qty'] == 2
        assert data['line_total'] == 71.0  # 35.50 * 2


# ─── PULSE EXITS TESTS ────────────────────────────────────────────

class TestPulseExits:
    """Tests for pulse exit endpoints"""

    def test_get_today_exits(self, auth_headers):
        """GET /api/pulse/exits/today returns exits with entry/exit times"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/exits/today",
            params={'venue_id': VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'exits' in data
        assert 'total' in data
        assert isinstance(data['exits'], list)

    def test_get_inside_guests(self, auth_headers):
        """GET /api/pulse/inside returns guests currently inside"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={'venue_id': VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'guests' in data
        assert 'total' in data


# ─── GUEST PROFILE TESTS ──────────────────────────────────────────

class TestGuestProfile:
    """Tests for guest profile endpoint"""

    @pytest.fixture(scope='class')
    def test_guest_id(self, auth_headers):
        """Create a test guest for profile tests"""
        form_data = {
            'name': f'TEST_ProfileGuest_{datetime.now().timestamp()}',
            'email': 'profile@test.com',
            'phone': '11999999999',
            'venue_id': VENUE_ID
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            data=form_data,
            headers={"Authorization": auth_headers["Authorization"]}
        )
        if response.status_code == 200:
            return response.json()['guest_id']
        pytest.skip("Could not create test guest")

    def test_get_guest_profile(self, auth_headers, test_guest_id):
        """GET /api/pulse/guest/{id}/profile returns full guest profile"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{test_guest_id}/profile",
            params={'venue_id': VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Verify profile structure
        assert 'guest_id' in data
        assert 'name' in data
        assert 'visits' in data
        assert 'entries_count' in data
        assert 'exits_count' in data
        assert 'total_spent' in data
        assert 'reward_points' in data
        assert 'history' in data
        assert 'consumptions' in data
        assert 'events_attended' in data

    def test_guest_profile_not_found(self, auth_headers):
        """GET /api/pulse/guest/{invalid_id}/profile returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/00000000-0000-0000-0000-000000000000/profile",
            params={'venue_id': VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 404


# ─── TAP CATALOG TESTS ────────────────────────────────────────────

class TestTAPCatalog:
    """Tests for TAP catalog endpoint"""

    def test_get_catalog(self, auth_headers):
        """GET /api/tap/catalog returns items with categories"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={'venue_id': VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert 'items' in data
        assert isinstance(data['items'], list)
        # Verify item structure if items exist
        if data['items']:
            item = data['items'][0]
            assert 'id' in item
            assert 'name' in item
            assert 'price' in item
            assert 'category' in item


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
