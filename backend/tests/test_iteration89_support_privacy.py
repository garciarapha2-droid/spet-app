"""
Iteration 89: Support & Privacy Policy Feature Tests
Tests POST /api/support endpoint with Resend email integration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSupportEndpoint:
    """Tests for POST /api/support endpoint"""
    
    def test_support_valid_submission(self):
        """POST /api/support with valid data returns success with email_id"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test message with at least 10 characters for validation"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "data" in data
        assert data["data"]["message"] == "Message sent successfully"
        assert "email_id" in data["data"]
        assert data["data"]["email_id"] is not None
        print(f"✅ Email sent with ID: {data['data']['email_id']}")
    
    def test_support_empty_name_validation(self):
        """POST /api/support with empty name returns 422"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test message with at least 10 characters"
        })
        assert response.status_code == 422
        data = response.json()
        assert data["success"] == False
        assert "Name is required" in data["error"]["message"]
    
    def test_support_whitespace_name_validation(self):
        """POST /api/support with whitespace-only name returns 422"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "   ",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "This is a test message with at least 10 characters"
        })
        assert response.status_code == 422
        data = response.json()
        assert data["success"] == False
        assert "Name is required" in data["error"]["message"]
    
    def test_support_short_message_validation(self):
        """POST /api/support with message < 10 chars returns 422"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "Short"
        })
        assert response.status_code == 422
        data = response.json()
        assert data["success"] == False
        assert "Message must be at least 10 characters" in data["error"]["message"]
    
    def test_support_invalid_email_validation(self):
        """POST /api/support with invalid email returns 422"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "Test User",
            "email": "not-an-email",
            "subject": "Test Subject",
            "message": "This is a test message with at least 10 characters"
        })
        assert response.status_code == 422
        data = response.json()
        assert data["success"] == False
    
    def test_support_missing_email_validation(self):
        """POST /api/support without email returns 422"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "Test User",
            "subject": "Test Subject",
            "message": "This is a test message with at least 10 characters"
        })
        assert response.status_code == 422
    
    def test_support_optional_subject(self):
        """POST /api/support with empty subject still works"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "Test User",
            "email": "test@example.com",
            "subject": "",
            "message": "This is a test message with at least 10 characters for validation"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "email_id" in data["data"]
    
    def test_support_response_structure(self):
        """POST /api/support response has correct structure"""
        response = requests.post(f"{BASE_URL}/api/support", json={
            "name": "Structure Test",
            "email": "structure@test.com",
            "subject": "Testing Response Structure",
            "message": "This message tests the response structure from the API"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Check StandardResponseMiddleware wrapper
        assert "success" in data
        assert "data" in data
        assert "error" in data
        assert data["success"] == True
        assert data["error"] is None
        
        # Check inner data
        assert "message" in data["data"]
        assert "email_id" in data["data"]


class TestHealthEndpoint:
    """Regression test for health endpoint"""
    
    def test_health_check(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        # Health endpoint uses StandardResponseMiddleware
        if "data" in data:
            assert data["data"]["status"] == "healthy"
        else:
            assert data["status"] == "healthy"


class TestFrontendRoutes:
    """Tests for frontend route accessibility"""
    
    def test_privacy_page_accessible(self):
        """GET /privacy returns 200"""
        response = requests.get(f"{BASE_URL}/privacy")
        assert response.status_code == 200
    
    def test_support_page_accessible(self):
        """GET /support returns 200"""
        response = requests.get(f"{BASE_URL}/support")
        assert response.status_code == 200
    
    def test_landing_page_accessible(self):
        """GET / returns 200"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
