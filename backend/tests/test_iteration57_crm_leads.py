"""
Iteration 57: CRM / Leads Management Tests
Tests for CEO CRM endpoints and lead capture functionality.

Features tested:
- GET /api/ceo/leads - returns all leads with correct fields
- PUT /api/ceo/leads/{id}/status - updates lead status, payment_status, notes
- CRM endpoints require CEO auth (403 for regular users)
- POST /api/leads/capture - creates lead and sends email
- POST /api/auth/signup - auto-captures lead with source=signup
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
REGULAR_EMAIL = "teste@teste.com"
REGULAR_PASSWORD = "12345"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def ceo_token(api_client):
    """Get CEO authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": CEO_EMAIL,
        "password": CEO_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"CEO login successful, token obtained")
        return token
    pytest.skip(f"CEO login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def regular_token(api_client):
    """Get regular user authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": REGULAR_EMAIL,
        "password": REGULAR_PASSWORD
    })
    if response.status_code == 200:
        token = response.json().get("access_token")
        print(f"Regular user login successful")
        return token
    pytest.skip(f"Regular user login failed: {response.status_code}")


@pytest.fixture(scope="module")
def ceo_client(api_client, ceo_token):
    """Session with CEO auth header"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {ceo_token}"
    })
    return session


@pytest.fixture(scope="module")
def regular_client(api_client, regular_token):
    """Session with regular user auth header"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {regular_token}"
    })
    return session


class TestCEOLeadsEndpoint:
    """Tests for GET /api/ceo/leads endpoint"""

    def test_get_leads_returns_200_for_ceo(self, ceo_client):
        """GET /api/ceo/leads returns 200 for CEO user"""
        response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "leads" in data, "Response should contain 'leads' key"
        assert "total" in data, "Response should contain 'total' key"
        print(f"GET /api/ceo/leads: {data['total']} leads returned")

    def test_get_leads_returns_correct_fields(self, ceo_client):
        """GET /api/ceo/leads returns leads with all required fields"""
        response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        assert response.status_code == 200
        data = response.json()
        leads = data.get("leads", [])
        
        if len(leads) > 0:
            lead = leads[0]
            required_fields = [
                "id", "full_name", "email", "phone", "source", "status",
                "payment_status", "company_name", "notes", "created_at", "has_account"
            ]
            for field in required_fields:
                assert field in lead, f"Lead missing required field: {field}"
            print(f"Lead fields verified: {list(lead.keys())}")
        else:
            print("No leads in database to verify fields - will create test lead")

    def test_get_leads_requires_ceo_role(self, regular_client):
        """GET /api/ceo/leads returns 403 for non-CEO user"""
        response = regular_client.get(f"{BASE_URL}/api/ceo/leads")
        assert response.status_code == 403, f"Expected 403 for regular user, got {response.status_code}"
        print(f"Regular user correctly denied CEO leads access: 403")


class TestLeadStatusUpdate:
    """Tests for PUT /api/ceo/leads/{id}/status endpoint"""

    def test_update_lead_status_success(self, ceo_client):
        """PUT /api/ceo/leads/{id}/status updates lead status correctly"""
        # First get leads to find one to update
        response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        
        if len(leads) == 0:
            pytest.skip("No leads available to test status update")
        
        lead = leads[0]
        lead_id = lead["id"]
        original_status = lead["status"]
        new_status = "contacted" if original_status != "contacted" else "qualified"
        
        # Update status using form data
        update_response = ceo_client.put(
            f"{BASE_URL}/api/ceo/leads/{lead_id}/status",
            data={"status": new_status}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify persistence
        verify_response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        updated_lead = next((l for l in verify_response.json()["leads"] if l["id"] == lead_id), None)
        assert updated_lead is not None
        assert updated_lead["status"] == new_status, f"Status not persisted: expected {new_status}, got {updated_lead['status']}"
        print(f"Lead status updated: {original_status} -> {new_status}")

    def test_update_payment_status_success(self, ceo_client):
        """PUT /api/ceo/leads/{id}/status updates payment_status correctly"""
        response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        leads = response.json().get("leads", [])
        
        if len(leads) == 0:
            pytest.skip("No leads available")
        
        lead = leads[0]
        lead_id = lead["id"]
        new_payment = "paid"
        
        update_response = ceo_client.put(
            f"{BASE_URL}/api/ceo/leads/{lead_id}/status",
            data={"payment_status": new_payment}
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        updated_lead = next((l for l in verify_response.json()["leads"] if l["id"] == lead_id), None)
        assert updated_lead["payment_status"] == new_payment
        print(f"Payment status updated to: {new_payment}")

    def test_update_notes_success(self, ceo_client):
        """PUT /api/ceo/leads/{id}/status updates notes correctly"""
        response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        leads = response.json().get("leads", [])
        
        if len(leads) == 0:
            pytest.skip("No leads available")
        
        lead = leads[0]
        lead_id = lead["id"]
        test_note = f"Test note from iteration 57 - {uuid.uuid4().hex[:8]}"
        
        update_response = ceo_client.put(
            f"{BASE_URL}/api/ceo/leads/{lead_id}/status",
            data={"notes": test_note}
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        updated_lead = next((l for l in verify_response.json()["leads"] if l["id"] == lead_id), None)
        assert updated_lead["notes"] == test_note
        print(f"Notes updated and persisted: {test_note[:30]}...")

    def test_update_status_rejects_invalid_values(self, ceo_client):
        """PUT /api/ceo/leads/{id}/status rejects invalid status values"""
        response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        leads = response.json().get("leads", [])
        
        if len(leads) == 0:
            pytest.skip("No leads available")
        
        lead_id = leads[0]["id"]
        
        # Try invalid status
        update_response = ceo_client.put(
            f"{BASE_URL}/api/ceo/leads/{lead_id}/status",
            data={"status": "invalid_status_value"}
        )
        assert update_response.status_code == 400, f"Expected 400 for invalid status, got {update_response.status_code}"
        print("Invalid status correctly rejected with 400")

    def test_update_status_requires_ceo_role(self, regular_client, ceo_client):
        """PUT /api/ceo/leads/{id}/status returns 403 for non-CEO user"""
        # Get a lead ID first
        response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        leads = response.json().get("leads", [])
        
        if len(leads) == 0:
            pytest.skip("No leads available")
        
        lead_id = leads[0]["id"]
        
        # Try to update as regular user
        update_response = regular_client.put(
            f"{BASE_URL}/api/ceo/leads/{lead_id}/status",
            data={"status": "contacted"}
        )
        assert update_response.status_code == 403, f"Expected 403, got {update_response.status_code}"
        print("Regular user correctly denied lead update: 403")


class TestLeadCapture:
    """Tests for POST /api/leads/capture endpoint"""

    def test_lead_capture_creates_lead(self, api_client):
        """POST /api/leads/capture creates lead and returns success"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "full_name": "Test Lead",
            "email": test_email,
            "phone": "+1234567890",
            "product_interest": "tap",
            "source": "contact"
        }
        
        response = api_client.post(f"{BASE_URL}/api/leads/capture", json=payload)
        assert response.status_code == 200, f"Lead capture failed: {response.text}"
        
        data = response.json()
        assert "lead_id" in data, "Response should contain lead_id"
        assert "email_sent" in data, "Response should contain email_sent field"
        assert data["source"] == "contact"
        print(f"Lead captured: {data['lead_id']}, email_sent={data['email_sent']}")

    def test_lead_capture_rejects_invalid_source(self, api_client):
        """POST /api/leads/capture rejects invalid source values"""
        payload = {
            "full_name": "Test Lead",
            "email": "test@test.com",
            "source": "invalid_source"
        }
        
        response = api_client.post(f"{BASE_URL}/api/leads/capture", json=payload)
        assert response.status_code == 400, f"Expected 400 for invalid source, got {response.status_code}"
        print("Invalid source correctly rejected")


class TestSignupLeadCapture:
    """Tests for auto lead capture during signup"""

    def test_signup_creates_lead_with_signup_source(self, api_client, ceo_client):
        """POST /api/auth/signup auto-captures lead with source=signup"""
        # Generate unique test email
        test_email = f"test_signup_{uuid.uuid4().hex[:8]}@test.com"
        
        # Signup
        signup_response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "name": "Test Signup User",
            "email": test_email,
            "password": "testpass123",
            "company_name": "Test Company"
        })
        assert signup_response.status_code == 200, f"Signup failed: {signup_response.text}"
        
        # Wait a moment for async lead capture
        import time
        time.sleep(1)
        
        # Check leads as CEO
        leads_response = ceo_client.get(f"{BASE_URL}/api/ceo/leads")
        assert leads_response.status_code == 200
        
        leads = leads_response.json().get("leads", [])
        signup_lead = next((l for l in leads if l["email"] == test_email.lower()), None)
        
        assert signup_lead is not None, f"Signup lead not found for {test_email}"
        assert signup_lead["source"] == "signup", f"Expected source=signup, got {signup_lead['source']}"
        print(f"Signup lead verified: email={test_email}, source={signup_lead['source']}")
        
        # Cleanup: We should note this user was created for testing
        return signup_lead


class TestCEOAuthAccess:
    """Tests for CEO-only access restrictions"""

    def test_ceo_leads_endpoint_requires_auth(self, api_client):
        """GET /api/ceo/leads requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/ceo/leads")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated request correctly rejected: 401")

    def test_lead_update_requires_auth(self, api_client):
        """PUT /api/ceo/leads/{id}/status requires authentication"""
        fake_id = str(uuid.uuid4())
        response = api_client.put(
            f"{BASE_URL}/api/ceo/leads/{fake_id}/status",
            data={"status": "contacted"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Unauthenticated update correctly rejected: 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
