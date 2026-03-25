"""
Iteration 92: Password Reset & Team Invite System Tests
Tests for:
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/manager-reset-password
- POST /api/team/invite
- GET /api/team/invites
- POST /api/team/accept-invite
- POST /api/team/cancel-invite
- GET /api/auth/permissions
- GET /api/auth/payment-status
- Login flows for CEO and demo accounts
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
DEMO_EMAIL = "teste@teste.com"
DEMO_PASSWORD = "12345"
ONBOARDING_EMAIL = "teste1@teste.com"
ONBOARDING_PASSWORD = "12345"


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
        data = response.json()
        # Handle wrapped response format
        if "data" in data and data.get("success"):
            return data["data"].get("access_token")
        return data.get("access_token")
    pytest.skip(f"CEO login failed: {response.status_code}")


@pytest.fixture(scope="module")
def demo_token(api_client):
    """Get demo account authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": DEMO_EMAIL,
        "password": DEMO_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        if "data" in data and data.get("success"):
            return data["data"].get("access_token")
        return data.get("access_token")
    pytest.skip(f"Demo login failed: {response.status_code}")


class TestLoginFlows:
    """Test login flows for CEO and demo accounts"""
    
    def test_ceo_login_success(self, api_client):
        """CEO account login should work with garcia.rapha2@gmail.com / 12345"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        assert response.status_code == 200, f"CEO login failed: {response.text}"
        data = response.json()
        
        # Handle wrapped response
        if "data" in data and data.get("success"):
            data = data["data"]
        
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == CEO_EMAIL
        print(f"PASS: CEO login successful, user_id={data['user']['id']}")
    
    def test_demo_login_success(self, api_client):
        """Demo account login should work with teste@teste.com / 12345"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": DEMO_EMAIL,
            "password": DEMO_PASSWORD
        })
        assert response.status_code == 200, f"Demo login failed: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        assert "access_token" in data
        assert data["user"]["email"] == DEMO_EMAIL
        print(f"PASS: Demo login successful, user_id={data['user']['id']}")
    
    def test_onboarding_login_success(self, api_client):
        """Onboarding account login should work with teste1@teste.com / 12345"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ONBOARDING_EMAIL,
            "password": ONBOARDING_PASSWORD
        })
        assert response.status_code == 200, f"Onboarding login failed: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        assert "access_token" in data
        assert data["user"]["email"] == ONBOARDING_EMAIL
        print(f"PASS: Onboarding account login successful")


class TestForgotPassword:
    """Test POST /api/auth/forgot-password endpoint"""
    
    def test_forgot_password_existing_email(self, api_client):
        """Should return success for existing email (anti-enumeration)"""
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": CEO_EMAIL,
            "origin_url": "https://app.spetapp.com"
        })
        assert response.status_code == 200, f"Forgot password failed: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        assert "message" in data
        assert "reset link" in data["message"].lower() or "sent" in data["message"].lower()
        print(f"PASS: Forgot password for existing email returns success message")
    
    def test_forgot_password_nonexistent_email(self, api_client):
        """Should return success even for non-existent email (anti-enumeration)"""
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": f"nonexistent_{uuid.uuid4().hex[:8]}@test.com",
            "origin_url": "https://app.spetapp.com"
        })
        assert response.status_code == 200, f"Should return 200 for anti-enumeration: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        assert "message" in data
        print(f"PASS: Forgot password for non-existent email returns same success (anti-enumeration)")
    
    def test_forgot_password_missing_email(self, api_client):
        """Should return 400 when email is missing"""
        response = api_client.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "origin_url": "https://app.spetapp.com"
        })
        assert response.status_code == 400, f"Expected 400 for missing email: {response.text}"
        print(f"PASS: Forgot password rejects missing email with 400")


class TestResetPassword:
    """Test POST /api/auth/reset-password endpoint"""
    
    def test_reset_password_invalid_token(self, api_client):
        """Should reject invalid/expired tokens"""
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid_token_12345",
            "new_password": "newpassword123"
        })
        assert response.status_code == 400, f"Expected 400 for invalid token: {response.text}"
        data = response.json()
        
        # Check error message
        error_msg = ""
        if "data" in data:
            error_msg = data.get("error", {}).get("message", "")
        else:
            error_msg = data.get("detail", "")
        
        assert "invalid" in error_msg.lower() or "expired" in error_msg.lower()
        print(f"PASS: Reset password rejects invalid token")
    
    def test_reset_password_missing_token(self, api_client):
        """Should return 400 when token is missing"""
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "new_password": "newpassword123"
        })
        assert response.status_code == 400, f"Expected 400 for missing token: {response.text}"
        print(f"PASS: Reset password rejects missing token")
    
    def test_reset_password_short_password(self, api_client):
        """Should reject passwords shorter than 5 characters"""
        response = api_client.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "some_token",
            "new_password": "1234"
        })
        assert response.status_code == 400, f"Expected 400 for short password: {response.text}"
        print(f"PASS: Reset password rejects short passwords")


class TestManagerResetPassword:
    """Test POST /api/auth/manager-reset-password endpoint"""
    
    def test_manager_reset_requires_auth(self, api_client):
        """Should require authentication"""
        response = api_client.post(f"{BASE_URL}/api/auth/manager-reset-password", json={
            "email": "someuser@test.com"
        })
        assert response.status_code == 401, f"Expected 401 without auth: {response.text}"
        print(f"PASS: Manager reset requires authentication")
    
    def test_manager_reset_requires_management_role(self, api_client, demo_token):
        """Should require manager/owner/ceo role"""
        # Demo account may not have management role
        response = api_client.post(
            f"{BASE_URL}/api/auth/manager-reset-password",
            json={"email": "someuser@test.com"},
            headers={"Authorization": f"Bearer {demo_token}"}
        )
        # Should be 403 if demo doesn't have management role, or 404 if user not found
        assert response.status_code in [403, 404], f"Expected 403 or 404: {response.text}"
        print(f"PASS: Manager reset enforces role check (status={response.status_code})")
    
    def test_manager_reset_rejects_system_accounts(self, api_client, ceo_token):
        """Should reject resetting system account passwords"""
        # Try to reset demo account (system account)
        response = api_client.post(
            f"{BASE_URL}/api/auth/manager-reset-password",
            json={"email": DEMO_EMAIL, "origin_url": "https://app.spetapp.com"},
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        # System accounts should be protected
        assert response.status_code == 403, f"Expected 403 for system account: {response.text}"
        print(f"PASS: Manager reset rejects system accounts")


class TestTeamInvite:
    """Test POST /api/team/invite endpoint"""
    
    def test_invite_requires_auth(self, api_client):
        """Should require authentication"""
        response = api_client.post(f"{BASE_URL}/api/team/invite", json={
            "email": "newstaff@test.com",
            "role": "staff"
        })
        assert response.status_code == 401, f"Expected 401 without auth: {response.text}"
        print(f"PASS: Team invite requires authentication")
    
    def test_invite_creates_invite(self, api_client, ceo_token):
        """Should create invite and return invite_id"""
        unique_email = f"test_staff_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(
            f"{BASE_URL}/api/team/invite",
            json={
                "email": unique_email,
                "role": "staff",
                "origin_url": "https://app.spetapp.com"
            },
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Invite creation failed: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        assert "invite_id" in data, "Missing invite_id in response"
        assert data["email"] == unique_email
        assert data["role"] == "staff"
        assert data["status"] == "pending"
        print(f"PASS: Team invite created successfully, invite_id={data['invite_id']}")
        return data["invite_id"]
    
    def test_invite_rejects_duplicate_pending(self, api_client, ceo_token):
        """Should reject duplicate pending invites for same email"""
        unique_email = f"dup_test_{uuid.uuid4().hex[:8]}@test.com"
        
        # First invite
        response1 = api_client.post(
            f"{BASE_URL}/api/team/invite",
            json={"email": unique_email, "role": "staff", "origin_url": "https://app.spetapp.com"},
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response1.status_code == 200, f"First invite failed: {response1.text}"
        
        # Second invite (should fail)
        response2 = api_client.post(
            f"{BASE_URL}/api/team/invite",
            json={"email": unique_email, "role": "manager", "origin_url": "https://app.spetapp.com"},
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response2.status_code == 409, f"Expected 409 for duplicate: {response2.text}"
        print(f"PASS: Duplicate pending invites rejected with 409")
    
    def test_invite_validates_role(self, api_client, ceo_token):
        """Should reject invalid roles"""
        response = api_client.post(
            f"{BASE_URL}/api/team/invite",
            json={
                "email": f"invalid_role_{uuid.uuid4().hex[:8]}@test.com",
                "role": "superadmin",  # Invalid role
                "origin_url": "https://app.spetapp.com"
            },
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid role: {response.text}"
        print(f"PASS: Invalid roles rejected")


class TestTeamInvitesList:
    """Test GET /api/team/invites endpoint"""
    
    def test_list_invites_requires_auth(self, api_client):
        """Should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/team/invites")
        assert response.status_code == 401, f"Expected 401 without auth: {response.text}"
        print(f"PASS: List invites requires authentication")
    
    def test_list_invites_returns_array(self, api_client, ceo_token):
        """Should return list of invites for company"""
        response = api_client.get(
            f"{BASE_URL}/api/team/invites",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"List invites failed: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        assert "invites" in data, "Missing invites array"
        assert isinstance(data["invites"], list)
        print(f"PASS: List invites returns array with {len(data['invites'])} invites")


class TestAcceptInvite:
    """Test POST /api/team/accept-invite endpoint"""
    
    def test_accept_invite_invalid_token(self, api_client):
        """Should reject invalid invite tokens"""
        response = api_client.post(f"{BASE_URL}/api/team/accept-invite", json={
            "token": "invalid_invite_token_12345",
            "name": "Test User",
            "password": "testpass123"
        })
        assert response.status_code == 404, f"Expected 404 for invalid token: {response.text}"
        print(f"PASS: Accept invite rejects invalid token")
    
    def test_accept_invite_missing_token(self, api_client):
        """Should return 400 when token is missing"""
        response = api_client.post(f"{BASE_URL}/api/team/accept-invite", json={
            "name": "Test User",
            "password": "testpass123"
        })
        assert response.status_code == 400, f"Expected 400 for missing token: {response.text}"
        print(f"PASS: Accept invite rejects missing token")


class TestCancelInvite:
    """Test POST /api/team/cancel-invite endpoint"""
    
    def test_cancel_invite_requires_auth(self, api_client):
        """Should require authentication"""
        response = api_client.post(f"{BASE_URL}/api/team/cancel-invite", json={
            "invite_id": "some-invite-id"
        })
        assert response.status_code == 401, f"Expected 401 without auth: {response.text}"
        print(f"PASS: Cancel invite requires authentication")
    
    def test_cancel_invite_not_found(self, api_client, ceo_token):
        """Should return 404 for non-existent invite"""
        response = api_client.post(
            f"{BASE_URL}/api/team/cancel-invite",
            json={"invite_id": str(uuid.uuid4())},
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 404, f"Expected 404 for non-existent invite: {response.text}"
        print(f"PASS: Cancel invite returns 404 for non-existent invite")


class TestAuthPermissions:
    """Test GET /api/auth/permissions endpoint"""
    
    def test_permissions_requires_auth(self, api_client):
        """Should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/auth/permissions")
        assert response.status_code == 401, f"Expected 401 without auth: {response.text}"
        print(f"PASS: Permissions endpoint requires authentication")
    
    def test_permissions_returns_user_info(self, api_client, ceo_token):
        """Should return user permissions, flags, and access info"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/permissions",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Permissions failed: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        # Verify required fields
        assert "user_id" in data, "Missing user_id"
        assert "email" in data, "Missing email"
        assert "access" in data, "Missing access array"
        assert "flags" in data, "Missing flags object"
        
        # Verify flags structure
        flags = data["flags"]
        assert "is_active" in flags
        assert "requires_payment" in flags
        assert "requires_onboarding" in flags
        
        print(f"PASS: Permissions returns complete user info with flags")


class TestPaymentStatus:
    """Test GET /api/auth/payment-status endpoint"""
    
    def test_payment_status_requires_auth(self, api_client):
        """Should require authentication"""
        response = api_client.get(f"{BASE_URL}/api/auth/payment-status")
        assert response.status_code == 401, f"Expected 401 without auth: {response.text}"
        print(f"PASS: Payment status requires authentication")
    
    def test_payment_status_returns_info(self, api_client, ceo_token):
        """Should return subscription and payment info"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/payment-status",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Payment status failed: {response.text}"
        data = response.json()
        
        if "data" in data and data.get("success"):
            data = data["data"]
        
        # Verify required fields
        assert "user_id" in data, "Missing user_id"
        assert "status" in data, "Missing status"
        assert "is_active" in data, "Missing is_active"
        assert "requires_payment" in data, "Missing requires_payment"
        
        print(f"PASS: Payment status returns subscription info, status={data['status']}")


class TestWebhookIdempotency:
    """Test POST /api/webhook/stripe idempotency"""
    
    def test_webhook_requires_valid_payload(self, api_client):
        """Webhook should reject invalid payloads"""
        response = api_client.post(
            f"{BASE_URL}/api/webhook/stripe",
            json={"invalid": "payload"},
            headers={"Content-Type": "application/json"}
        )
        # Should reject with 400 or 422 for invalid payload
        assert response.status_code in [400, 422, 500], f"Unexpected status: {response.text}"
        print(f"PASS: Webhook rejects invalid payload (status={response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
