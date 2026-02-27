"""
PULSE Module C1-C3 Backend Tests
- C1: Guest Intake (POST /api/pulse/guest/intake)
- C1.1: Dedupe Search (POST /api/pulse/guest/dedupe)
- C2: Decision Card (GET /api/pulse/guest/{id})
- C2: Record Decision (POST /api/pulse/entry/decision)
- C3: Today Entries (GET /api/pulse/entries/today)
- Venue Config (GET /api/pulse/venue/config)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
EXISTING_GUEST_ID = "ace737fb-d134-444d-927f-1465772c7096"
EXISTING_GUEST_EMAIL = "maria@test.com"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate and get token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "teste@teste.com", "password": "teste123"},
        headers={"Content-Type": "application/json"}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping Pulse tests")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestVenueConfig:
    """Venue configuration endpoint tests"""

    def test_get_venue_config_returns_200(self, auth_headers):
        """GET /api/pulse/venue/config should return venue config"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/venue/config",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "venue_id" in data
        assert "host_collect_dob" in data
        assert "entry_types" in data
        assert isinstance(data["entry_types"], list)
        print(f"✓ Venue config: host_collect_dob={data['host_collect_dob']}")

    def test_venue_config_has_host_collect_dob_field(self, auth_headers):
        """Venue config should have host_collect_dob boolean field"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/venue/config",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "host_collect_dob" in data
        assert isinstance(data["host_collect_dob"], bool)


class TestGuestIntake:
    """C1: Guest Intake endpoint tests"""

    def test_guest_intake_creates_guest(self, auth_headers):
        """POST /api/pulse/guest/intake should create a new guest"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        test_name = f"TEST_Guest_{timestamp}"
        test_email = f"test_{timestamp}@example.com"
        test_phone = "+5511888887777"

        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            headers=auth_headers,
            data={
                "name": test_name,
                "email": test_email,
                "phone": test_phone,
                "venue_id": VENUE_ID
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "guest_id" in data
        assert "global_person_id" in data
        assert "name" in data
        assert "created_at" in data
        
        # Verify data values
        assert data["name"] == test_name
        assert data["guest_id"] is not None
        print(f"✓ Created guest: {data['guest_id']}")

    def test_guest_intake_requires_name(self, auth_headers):
        """POST /api/pulse/guest/intake should fail without name"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            headers=auth_headers,
            data={
                "email": "test@example.com",
                "venue_id": VENUE_ID
            }
        )
        # Should return 422 (validation error) for missing required field
        assert response.status_code == 422

    def test_guest_intake_with_empty_name_fails(self, auth_headers):
        """POST /api/pulse/guest/intake should fail with empty name"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            headers=auth_headers,
            data={
                "name": "   ",
                "venue_id": VENUE_ID
            }
        )
        assert response.status_code == 400


class TestDedupeSearch:
    """C1.1: Dedupe Search endpoint tests"""

    def test_dedupe_finds_existing_email(self, auth_headers):
        """POST /api/pulse/guest/dedupe should find guest by existing email"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/dedupe",
            headers=auth_headers,
            data={
                "email": EXISTING_GUEST_EMAIL,
                "venue_id": VENUE_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "matches" in data
        assert "total" in data
        assert data["total"] >= 1
        
        # Check first match has masked email
        match = data["matches"][0]
        assert "guest_id" in match
        assert "name" in match
        assert "email_masked" in match
        assert "phone_masked" in match
        assert match["email_masked"].startswith("m***@")  # Maria's masked email
        print(f"✓ Found {data['total']} match(es) for {EXISTING_GUEST_EMAIL}")

    def test_dedupe_returns_masked_data(self, auth_headers):
        """Dedupe matches should return masked PII"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/dedupe",
            headers=auth_headers,
            data={
                "email": EXISTING_GUEST_EMAIL,
                "venue_id": VENUE_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["matches"]:
            match = data["matches"][0]
            # Email should be masked (first letter + *** + @domain)
            assert "***" in match["email_masked"]
            # Phone should be masked (***last4)
            if match["phone_masked"] != "***":
                assert match["phone_masked"].startswith("***")

    def test_dedupe_no_match_returns_empty(self, auth_headers):
        """Dedupe with non-existent email returns empty matches"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/dedupe",
            headers=auth_headers,
            data={
                "email": f"nonexistent_{uuid.uuid4()}@example.com",
                "venue_id": VENUE_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["matches"] == []
        assert data["total"] == 0


class TestDecisionCard:
    """C2: Decision Card endpoint tests"""

    def test_get_guest_returns_profile(self, auth_headers):
        """GET /api/pulse/guest/{id} should return guest profile"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{EXISTING_GUEST_ID}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile fields
        assert "guest_id" in data
        assert "name" in data
        assert "visits" in data
        assert "spend_total" in data
        assert "flags" in data
        assert "tags" in data

    def test_get_guest_has_risk_chips_array(self, auth_headers):
        """Guest profile should have risk_chips array"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{EXISTING_GUEST_ID}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "risk_chips" in data
        assert isinstance(data["risk_chips"], list)
        print(f"✓ Guest has {len(data['risk_chips'])} risk chips")

    def test_get_guest_has_value_chips_array(self, auth_headers):
        """Guest profile should have value_chips array"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{EXISTING_GUEST_ID}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "value_chips" in data
        assert isinstance(data["value_chips"], list)
        print(f"✓ Guest has {len(data['value_chips'])} value chips")

    def test_get_nonexistent_guest_returns_404(self, auth_headers):
        """GET /api/pulse/guest/{id} with invalid ID should return 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{fake_id}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 404


class TestEntryDecision:
    """C2: Entry Decision endpoint tests"""

    def test_record_allowed_decision(self, auth_headers):
        """POST /api/pulse/entry/decision should record allowed decision"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            headers=auth_headers,
            data={
                "guest_id": EXISTING_GUEST_ID,
                "venue_id": VENUE_ID,
                "decision": "allowed",
                "entry_type": "consumption_only",
                "cover_amount": "0",
                "cover_paid": "false"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "entry_id" in data
        assert data["decision"] == "allowed"
        assert data["guest_id"] == EXISTING_GUEST_ID
        assert "created_at" in data
        print(f"✓ Recorded allowed entry: {data['entry_id']}")

    def test_record_denied_decision(self, auth_headers):
        """POST /api/pulse/entry/decision should record denied decision"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            headers=auth_headers,
            data={
                "guest_id": EXISTING_GUEST_ID,
                "venue_id": VENUE_ID,
                "decision": "denied",
                "entry_type": "cover",
                "cover_amount": "50",
                "cover_paid": "false"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["decision"] == "denied"
        print(f"✓ Recorded denied entry: {data['entry_id']}")

    def test_invalid_decision_fails(self, auth_headers):
        """Invalid decision value should fail"""
        response = requests.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            headers=auth_headers,
            data={
                "guest_id": EXISTING_GUEST_ID,
                "venue_id": VENUE_ID,
                "decision": "maybe",  # Invalid
                "entry_type": "cover"
            }
        )
        assert response.status_code == 400


class TestTodayEntries:
    """C3: Today's Entries endpoint tests"""

    def test_get_today_entries(self, auth_headers):
        """GET /api/pulse/entries/today should return today's entries"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "entries" in data
        assert "total" in data
        assert "allowed" in data
        assert "denied" in data
        assert isinstance(data["entries"], list)
        print(f"✓ Today entries: {data['total']} total, {data['allowed']} allowed, {data['denied']} denied")

    def test_today_entries_have_guest_names(self, auth_headers):
        """Today's entries should include guest names"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if data["entries"]:
            entry = data["entries"][0]
            assert "guest_name" in entry
            assert "entry_id" in entry
            assert "guest_id" in entry
            assert "decision" in entry
            assert "entry_type" in entry
            assert "created_at" in entry

    def test_today_entries_stats_correct(self, auth_headers):
        """Allowed + Denied should equal or be less than total"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["allowed"] + data["denied"] == data["total"]


class TestE2EFlow:
    """End-to-end flow: Intake → Dedupe → Decision → Success"""

    def test_full_flow_new_guest(self, auth_headers):
        """Complete C1→C3 flow for new guest"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        
        # C1: Create guest
        intake_response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            headers=auth_headers,
            data={
                "name": f"TEST_E2E_{timestamp}",
                "email": f"e2e_{timestamp}@example.com",
                "phone": f"+55119{timestamp[:8]}",
                "venue_id": VENUE_ID
            }
        )
        assert intake_response.status_code == 200
        guest_id = intake_response.json()["guest_id"]
        print(f"✓ C1 Intake: Created guest {guest_id}")
        
        # C2: Get decision card (verify in MongoDB)
        decision_card_response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{guest_id}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert decision_card_response.status_code == 200
        guest_data = decision_card_response.json()
        assert "risk_chips" in guest_data
        assert "value_chips" in guest_data
        print(f"✓ C2 Decision Card: Loaded guest profile")
        
        # C2: Record decision (verify in PG)
        entry_response = requests.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            headers=auth_headers,
            data={
                "guest_id": guest_id,
                "venue_id": VENUE_ID,
                "decision": "allowed",
                "entry_type": "vip",
                "cover_amount": "0",
                "cover_paid": "false"
            }
        )
        assert entry_response.status_code == 200
        entry_id = entry_response.json()["entry_id"]
        print(f"✓ C2 Decision: Recorded entry {entry_id}")
        
        # C3: Verify entry appears in today's list
        entries_response = requests.get(
            f"{BASE_URL}/api/pulse/entries/today",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert entries_response.status_code == 200
        entries = entries_response.json()["entries"]
        entry_ids = [e["entry_id"] for e in entries]
        assert entry_id in entry_ids, "New entry should appear in today's entries"
        print(f"✓ C3 Success: Entry {entry_id} visible in today's list")

    def test_dedupe_flow_existing_guest(self, auth_headers):
        """C1.1 flow: dedupe finds existing guest"""
        # Check dedupe with existing email
        dedupe_response = requests.post(
            f"{BASE_URL}/api/pulse/guest/dedupe",
            headers=auth_headers,
            data={
                "email": EXISTING_GUEST_EMAIL,
                "venue_id": VENUE_ID
            }
        )
        assert dedupe_response.status_code == 200
        matches = dedupe_response.json()["matches"]
        assert len(matches) >= 1
        
        # Select existing match
        match_guest_id = matches[0]["guest_id"]
        assert match_guest_id == EXISTING_GUEST_ID
        print(f"✓ C1.1: Dedupe found existing guest {match_guest_id}")
        
        # Load decision card
        guest_response = requests.get(
            f"{BASE_URL}/api/pulse/guest/{match_guest_id}",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert guest_response.status_code == 200
        assert guest_response.json()["name"] == "Maria Silva"
        print(f"✓ C2: Decision card loaded for Maria Silva")
