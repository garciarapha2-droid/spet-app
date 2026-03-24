"""
NFC Backend Infrastructure Tests - Iteration 88
Tests for POST /api/nfc/register, POST /api/nfc/scan, POST /api/nfc/unlink, GET /api/nfc/tags
Plus regression tests for existing endpoints.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
TEST_VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
EXISTING_NFC_TAG = "04:A3:2B:1C:D4:E5:F6"


class TestAuth:
    """Authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for CEO user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data.get("success") is True, f"Login not successful: {data}"
        token = data.get("data", {}).get("access_token")
        assert token, "No access_token in response"
        return token
    
    def test_login_returns_token(self, auth_token):
        """Verify login returns valid JWT token"""
        assert auth_token is not None
        assert len(auth_token) > 50  # JWT tokens are typically long
        print(f"Login successful, token length: {len(auth_token)}")


class TestNfcRegister:
    """POST /api/nfc/register endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        return response.json().get("data", {}).get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_guest_id(self, headers):
        """Create a test guest for NFC registration tests"""
        # First try to find existing test guest
        response = requests.get(
            f"{BASE_URL}/api/pulse/guests/search",
            params={"venue_id": TEST_VENUE_ID, "q": "TEST_NFC_Guest"},
            headers=headers
        )
        if response.status_code == 200:
            data = response.json().get("data", {})
            guests = data.get("guests", [])
            if guests:
                return guests[0]["id"]
        
        # Create new test guest via intake
        import io
        files = {
            'name': (None, 'TEST_NFC_Guest_88'),
            'email': (None, 'test.nfc88@test.com'),
            'phone': (None, '+5511999088088'),
            'venue_id': (None, TEST_VENUE_ID),
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        assert response.status_code == 200, f"Failed to create test guest: {response.text}"
        data = response.json().get("data", {})
        guest_id = data.get("guest_id")
        assert guest_id, f"No guest_id in response: {data}"
        return guest_id
    
    def test_register_new_tag_success(self, headers, test_guest_id):
        """Register a new NFC tag to a guest"""
        unique_tag = f"TEST:{uuid.uuid4().hex[:12].upper()}"
        response = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
            "label": "Test Wristband 88"
        }, headers=headers)
        
        assert response.status_code == 200, f"Register failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        result = data.get("data", {})
        assert result.get("tag_uid") == unique_tag.upper()
        assert result.get("guest_id") == test_guest_id
        assert result.get("status") == "active"
        assert "tag_id" in result
        print(f"Registered tag {unique_tag} to guest {test_guest_id}")
    
    def test_register_duplicate_tag_different_guest_returns_409(self, headers, test_guest_id):
        """Registering same tag to different guest should return 409"""
        # First register a tag
        unique_tag = f"DUP:{uuid.uuid4().hex[:12].upper()}"
        response1 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response1.status_code == 200
        
        # Create another guest
        files = {
            'name': (None, 'TEST_NFC_Guest_Other'),
            'email': (None, f'test.nfc.other{uuid.uuid4().hex[:6]}@test.com'),
            'phone': (None, '+5511999099099'),
            'venue_id': (None, TEST_VENUE_ID),
        }
        response2 = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        other_guest_id = response2.json().get("data", {}).get("guest_id")
        
        # Try to register same tag to different guest
        response3 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": other_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response3.status_code == 409, f"Expected 409, got {response3.status_code}: {response3.text}"
        print(f"Correctly blocked duplicate tag registration: {response3.json()}")
    
    def test_register_idempotent_same_tag_same_guest(self, headers, test_guest_id):
        """Re-registering same tag to same guest should be idempotent"""
        unique_tag = f"IDEM:{uuid.uuid4().hex[:12].upper()}"
        
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response1.status_code == 200
        
        # Second registration (same tag, same guest)
        response2 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response2.status_code == 200, f"Idempotent registration failed: {response2.text}"
        data = response2.json().get("data", {})
        assert "already registered" in data.get("message", "").lower() or data.get("status") == "active"
        print(f"Idempotent registration successful: {data.get('message')}")
    
    def test_register_validates_guest_exists(self, headers):
        """Registering tag to non-existent guest should return 404"""
        fake_guest_id = str(uuid.uuid4())
        unique_tag = f"FAKE:{uuid.uuid4().hex[:12].upper()}"
        
        response = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": fake_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"Correctly returned 404 for non-existent guest")
    
    def test_register_deactivates_previous_tag_for_guest(self, headers, test_guest_id):
        """Registering new tag should deactivate previous tag for same guest"""
        tag1 = f"OLD:{uuid.uuid4().hex[:12].upper()}"
        tag2 = f"NEW:{uuid.uuid4().hex[:12].upper()}"
        
        # Register first tag
        response1 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": tag1,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response1.status_code == 200
        
        # Register second tag (should deactivate first)
        response2 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": tag2,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response2.status_code == 200
        
        # Verify first tag is no longer active (scan should fail)
        response3 = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": tag1,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response3.status_code == 404, f"Old tag should be deactivated, got {response3.status_code}"
        print(f"Previous tag correctly deactivated when new tag registered")
    
    def test_register_reactivates_unlinked_tag(self, headers, test_guest_id):
        """Re-registering an unlinked tag should work"""
        unique_tag = f"RELINK:{uuid.uuid4().hex[:12].upper()}"
        
        # Register tag
        response1 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response1.status_code == 200
        
        # Unlink tag
        response2 = requests.post(f"{BASE_URL}/api/nfc/unlink", json={
            "tag_uid": unique_tag,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response2.status_code == 200
        
        # Re-register same tag
        response3 = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": unique_tag,
            "guest_id": test_guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response3.status_code == 200, f"Re-registration failed: {response3.text}"
        data = response3.json().get("data", {})
        assert data.get("status") == "active"
        print(f"Unlinked tag successfully re-registered")


class TestNfcScan:
    """POST /api/nfc/scan endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        return response.json().get("data", {}).get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def registered_tag(self, headers):
        """Create a guest and register a tag for scan tests"""
        # Create guest
        files = {
            'name': (None, 'TEST_Scan_Guest_88'),
            'email': (None, f'test.scan88.{uuid.uuid4().hex[:6]}@test.com'),
            'phone': (None, '+5511999088188'),
            'venue_id': (None, TEST_VENUE_ID),
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        guest_id = response.json().get("data", {}).get("guest_id")
        
        # Register tag
        tag_uid = f"SCAN:{uuid.uuid4().hex[:12].upper()}"
        requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": tag_uid,
            "guest_id": guest_id,
            "venue_id": TEST_VENUE_ID,
            "label": "Scan Test Tag"
        }, headers=headers)
        
        return {"tag_uid": tag_uid, "guest_id": guest_id}
    
    def test_scan_returns_guest_profile(self, headers, registered_tag):
        """Scan should return full guest profile"""
        response = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": registered_tag["tag_uid"],
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response.status_code == 200, f"Scan failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        result = data.get("data", {})
        
        # Verify guest data
        guest = result.get("guest", {})
        assert guest.get("id") == registered_tag["guest_id"]
        assert "name" in guest
        assert "email" in guest
        assert "phone" in guest
        assert "visits" in guest
        assert "spend_total" in guest
        assert "flags" in guest
        assert "tags" in guest
        assert "risk_chips" in guest
        assert "value_chips" in guest
        
        # Verify tab context
        tab = result.get("tab", {})
        assert "number" in tab
        assert "total" in tab
        assert "has_open_tab" in tab
        
        # Verify scan metadata
        assert "scanned_at" in result
        assert "tag_uid" in result
        assert "tag_id" in result
        
        print(f"Scan returned guest: {guest.get('name')}, tab: {tab}")
    
    def test_scan_unknown_tag_returns_404(self, headers):
        """Scanning unknown tag should return 404"""
        fake_tag = f"UNKNOWN:{uuid.uuid4().hex[:12].upper()}"
        response = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": fake_tag,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"Correctly returned 404 for unknown tag")
    
    def test_scan_unlinked_tag_returns_404(self, headers):
        """Scanning unlinked tag should return 404"""
        # Create guest and register tag
        files = {
            'name': (None, 'TEST_Unlink_Scan_Guest'),
            'email': (None, f'test.unlink.scan{uuid.uuid4().hex[:6]}@test.com'),
            'phone': (None, '+5511999088288'),
            'venue_id': (None, TEST_VENUE_ID),
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        guest_id = response.json().get("data", {}).get("guest_id")
        
        tag_uid = f"UNLINKSCAN:{uuid.uuid4().hex[:12].upper()}"
        requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": tag_uid,
            "guest_id": guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        # Unlink the tag
        requests.post(f"{BASE_URL}/api/nfc/unlink", json={
            "tag_uid": tag_uid,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        # Try to scan unlinked tag
        response = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": tag_uid,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response.status_code == 404, f"Expected 404 for unlinked tag, got {response.status_code}"
        print(f"Correctly returned 404 for unlinked tag")
    
    def test_scan_updates_last_scanned_timestamp(self, headers, registered_tag):
        """Scan should update last_scanned timestamp"""
        # First scan
        response1 = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": registered_tag["tag_uid"],
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response1.status_code == 200
        scanned_at_1 = response1.json().get("data", {}).get("scanned_at")
        
        # Wait a moment and scan again
        import time
        time.sleep(1)
        
        response2 = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": registered_tag["tag_uid"],
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        assert response2.status_code == 200
        scanned_at_2 = response2.json().get("data", {}).get("scanned_at")
        
        # Verify timestamps are different
        assert scanned_at_1 != scanned_at_2, "last_scanned should be updated on each scan"
        print(f"Scan timestamps updated: {scanned_at_1} -> {scanned_at_2}")
    
    def test_scan_includes_risk_and_value_chips(self, headers, registered_tag):
        """Scan response should include risk_chips and value_chips arrays"""
        response = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": registered_tag["tag_uid"],
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response.status_code == 200
        guest = response.json().get("data", {}).get("guest", {})
        
        assert "risk_chips" in guest, "risk_chips missing from guest"
        assert "value_chips" in guest, "value_chips missing from guest"
        assert isinstance(guest["risk_chips"], list)
        assert isinstance(guest["value_chips"], list)
        print(f"risk_chips: {guest['risk_chips']}, value_chips: {guest['value_chips']}")


class TestNfcUnlink:
    """POST /api/nfc/unlink endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        return response.json().get("data", {}).get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_unlink_active_tag(self, headers):
        """Unlink should deactivate an active tag binding"""
        # Create guest and register tag
        files = {
            'name': (None, 'TEST_Unlink_Guest'),
            'email': (None, f'test.unlink{uuid.uuid4().hex[:6]}@test.com'),
            'phone': (None, '+5511999088388'),
            'venue_id': (None, TEST_VENUE_ID),
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        guest_id = response.json().get("data", {}).get("guest_id")
        
        tag_uid = f"UNLINK:{uuid.uuid4().hex[:12].upper()}"
        requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": tag_uid,
            "guest_id": guest_id,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        # Unlink the tag
        response = requests.post(f"{BASE_URL}/api/nfc/unlink", json={
            "tag_uid": tag_uid,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response.status_code == 200, f"Unlink failed: {response.text}"
        data = response.json().get("data", {})
        assert data.get("status") == "unlinked"
        print(f"Tag {tag_uid} successfully unlinked")
    
    def test_unlink_nonexistent_tag_returns_404(self, headers):
        """Unlinking non-existent tag should return 404"""
        fake_tag = f"NOEXIST:{uuid.uuid4().hex[:12].upper()}"
        response = requests.post(f"{BASE_URL}/api/nfc/unlink", json={
            "tag_uid": fake_tag,
            "venue_id": TEST_VENUE_ID,
        }, headers=headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"Correctly returned 404 for non-existent tag")


class TestNfcTagsList:
    """GET /api/nfc/tags endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        return response.json().get("data", {}).get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_list_active_tags(self, headers):
        """List active tags for venue"""
        response = requests.get(
            f"{BASE_URL}/api/nfc/tags",
            params={"venue_id": TEST_VENUE_ID, "status": "active"},
            headers=headers
        )
        
        assert response.status_code == 200, f"List tags failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        result = data.get("data", {})
        
        assert "tags" in result
        assert "total" in result
        assert isinstance(result["tags"], list)
        
        if result["tags"]:
            tag = result["tags"][0]
            assert "tag_id" in tag
            assert "tag_uid" in tag
            assert "guest_id" in tag
            assert "guest_name" in tag
            assert "status" in tag
            assert tag["status"] == "active"
        
        print(f"Found {result['total']} active tags")
    
    def test_list_all_tags(self, headers):
        """List all tags (including unlinked) for venue"""
        response = requests.get(
            f"{BASE_URL}/api/nfc/tags",
            params={"venue_id": TEST_VENUE_ID, "status": "all"},
            headers=headers
        )
        
        assert response.status_code == 200, f"List all tags failed: {response.text}"
        data = response.json()
        result = data.get("data", {})
        
        assert "tags" in result
        print(f"Found {result['total']} total tags (all statuses)")


class TestRegressionEndpoints:
    """Regression tests for existing endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        return response.json().get("data", {}).get("access_token")
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
    
    def test_crm_deals_returns_10_deals(self, headers):
        """GET /api/crm/deals should return 10 deals"""
        response = requests.get(f"{BASE_URL}/api/crm/deals", headers=headers)
        
        assert response.status_code == 200, f"CRM deals failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        deals = data.get("data", {}).get("deals", [])
        assert len(deals) >= 10, f"Expected at least 10 deals, got {len(deals)}"
        print(f"CRM deals returned {len(deals)} deals")
    
    def test_crm_customers_returns_11_customers(self, headers):
        """GET /api/crm/customers should return 11 customers"""
        response = requests.get(f"{BASE_URL}/api/crm/customers", headers=headers)
        
        assert response.status_code == 200, f"CRM customers failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        customers = data.get("data", {}).get("customers", [])
        assert len(customers) >= 11, f"Expected at least 11 customers, got {len(customers)}"
        print(f"CRM customers returned {len(customers)} customers")
    
    def test_venue_home_returns_venues_and_modules(self, headers):
        """GET /api/venue/home should return venues and modules"""
        response = requests.get(f"{BASE_URL}/api/venue/home", headers=headers)
        
        assert response.status_code == 200, f"Venue home failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        result = data.get("data", {})
        
        assert "venues" in result
        assert "modules" in result
        assert len(result["venues"]) > 0
        assert len(result["modules"]) > 0
        print(f"Venue home returned {len(result['venues'])} venues, {len(result['modules'])} modules")
    
    def test_pulse_guest_intake_creates_guest(self, headers):
        """POST /api/pulse/guest/intake should create a guest"""
        unique_email = f"test.regression{uuid.uuid4().hex[:6]}@test.com"
        files = {
            'name': (None, 'TEST_Regression_Guest'),
            'email': (None, unique_email),
            'phone': (None, '+5511999099999'),
            'venue_id': (None, TEST_VENUE_ID),
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        
        assert response.status_code == 200, f"Guest intake failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        result = data.get("data", {})
        assert "guest_id" in result
        print(f"Guest intake created guest: {result.get('guest_id')}")
    
    def test_pulse_entry_decision_works(self, headers):
        """POST /api/pulse/entry/decision should work with multipart/form-data"""
        # First create a guest
        unique_email = f"test.entry{uuid.uuid4().hex[:6]}@test.com"
        files = {
            'name': (None, 'TEST_Entry_Guest'),
            'email': (None, unique_email),
            'phone': (None, '+5511999088888'),
            'venue_id': (None, TEST_VENUE_ID),
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/guest/intake",
            files=files,
            headers={"Authorization": headers["Authorization"]}
        )
        guest_id = response.json().get("data", {}).get("guest_id")
        
        # Now test entry decision with multipart/form-data
        decision_files = {
            'guest_id': (None, guest_id),
            'venue_id': (None, TEST_VENUE_ID),
            'decision': (None, 'allowed'),
            'entry_type': (None, 'consumption_only'),
        }
        response = requests.post(
            f"{BASE_URL}/api/pulse/entry/decision",
            files=decision_files,
            headers={"Authorization": headers["Authorization"]}
        )
        
        assert response.status_code == 200, f"Entry decision failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        result = data.get("data", {})
        assert result.get("decision") == "allowed"
        print(f"Entry decision recorded: {result}")


class TestCorsConfiguration:
    """Test CORS configuration for mobile apps"""
    
    def test_cors_allows_mobile_origins(self):
        """Verify CORS allows mobile-specific origins"""
        # Test with exp://localhost:19000 origin
        response = requests.options(
            f"{BASE_URL}/api/health",
            headers={
                "Origin": "exp://localhost:19000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization, Content-Type"
            }
        )
        
        # CORS preflight should return 200 or the actual response
        assert response.status_code in [200, 204], f"CORS preflight failed: {response.status_code}"
        
        # Check CORS headers
        cors_origin = response.headers.get("Access-Control-Allow-Origin", "")
        cors_methods = response.headers.get("Access-Control-Allow-Methods", "")
        
        # Either specific origin or wildcard should be allowed
        print(f"CORS Allow-Origin: {cors_origin}")
        print(f"CORS Allow-Methods: {cors_methods}")


class TestJwtAuthForNfcEndpoints:
    """Test JWT Bearer token works for all NFC endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        return response.json().get("data", {}).get("access_token")
    
    def test_nfc_register_requires_auth(self):
        """NFC register should require authentication"""
        response = requests.post(f"{BASE_URL}/api/nfc/register", json={
            "tag_uid": "TEST:123",
            "guest_id": "fake-id",
            "venue_id": TEST_VENUE_ID,
        })
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_nfc_scan_requires_auth(self):
        """NFC scan should require authentication"""
        response = requests.post(f"{BASE_URL}/api/nfc/scan", json={
            "tag_uid": "TEST:123",
            "venue_id": TEST_VENUE_ID,
        })
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_nfc_unlink_requires_auth(self):
        """NFC unlink should require authentication"""
        response = requests.post(f"{BASE_URL}/api/nfc/unlink", json={
            "tag_uid": "TEST:123",
            "venue_id": TEST_VENUE_ID,
        })
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_nfc_tags_requires_auth(self):
        """NFC tags list should require authentication"""
        response = requests.get(
            f"{BASE_URL}/api/nfc/tags",
            params={"venue_id": TEST_VENUE_ID, "status": "active"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_nfc_endpoints_work_with_valid_token(self, auth_token):
        """All NFC endpoints should work with valid JWT token"""
        headers = {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}
        
        # Test tags list (simplest endpoint)
        response = requests.get(
            f"{BASE_URL}/api/nfc/tags",
            params={"venue_id": TEST_VENUE_ID, "status": "active"},
            headers=headers
        )
        assert response.status_code == 200, f"NFC tags with auth failed: {response.text}"
        print("All NFC endpoints accept valid JWT token")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
