"""
Iteration 19: Conversational AI Features Testing
- Owner Dashboard AI: POST /api/owner/ai-insights with question param, next_steps in response
- Manager Dashboard AI: POST /api/manager/shift-ai with question param, next_steps in response
- Manager Dashboard: GET /api/manager/staff-costs returns wages, tips, total fields
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teste@teste.com",
        "password": "12345"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    return data.get("access_token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/x-www-form-urlencoded"
    }


# ─── OWNER AI INSIGHTS TESTS ────────────────────────────────────────────

class TestOwnerAIInsights:
    """Tests for Owner Dashboard AI conversational features"""

    def test_ai_insights_without_question(self, auth_headers):
        """POST /api/owner/ai-insights without question returns general analysis"""
        response = requests.post(
            f"{BASE_URL}/api/owner/ai-insights",
            headers=auth_headers,
            data={}
        )
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data
        assert "disclaimer" in data
        assert isinstance(data["insights"], list)
        print(f"General AI insights returned: {len(data['insights'])} insight(s)")

    def test_ai_insights_with_question(self, auth_headers):
        """POST /api/owner/ai-insights accepts optional 'question' form field"""
        response = requests.post(
            f"{BASE_URL}/api/owner/ai-insights",
            headers=auth_headers,
            data={"question": "How is my venue performing today?"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data
        assert isinstance(data["insights"], list)
        print(f"Question-based AI insights returned: {len(data['insights'])} insight(s)")

    def test_ai_insights_response_structure(self, auth_headers):
        """AI response has correct structure: summary, what_we_see, recommended_actions, next_steps"""
        response = requests.post(
            f"{BASE_URL}/api/owner/ai-insights",
            headers=auth_headers,
            data={}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["insights"]) > 0:
            insight = data["insights"][0]
            # Required fields
            assert "summary" in insight, "Missing 'summary' field"
            assert "what_we_see" in insight, "Missing 'what_we_see' field"
            assert "recommended_actions" in insight, "Missing 'recommended_actions' field"
            assert isinstance(insight["recommended_actions"], list), "recommended_actions should be array"
            
            # next_steps is MANDATORY per requirements
            assert "next_steps" in insight, "Missing 'next_steps' field"
            assert isinstance(insight["next_steps"], list), "next_steps should be array"
            assert len(insight["next_steps"]) >= 1, "next_steps should have at least 1 item"
            
            print(f"Insight structure valid. next_steps count: {len(insight.get('next_steps', []))}")
            print(f"Sample next_steps: {insight.get('next_steps', [])[:2]}")


# ─── MANAGER SHIFT AI TESTS ─────────────────────────────────────────────

class TestManagerShiftAI:
    """Tests for Manager Dashboard Shift AI conversational features"""

    def test_shift_ai_returns_next_steps(self, auth_headers):
        """POST /api/manager/shift-ai returns response with 'next_steps' array"""
        today = time.strftime("%Y-%m-%d")
        response = requests.post(
            f"{BASE_URL}/api/manager/shift-ai",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "date_from": today,
                "date_to": today
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "insight" in data
        insight = data["insight"]
        
        # Required fields
        assert "summary" in insight
        assert "what_we_see" in insight
        assert "recommended_actions" in insight
        
        # next_steps is MANDATORY
        assert "next_steps" in insight, "Missing 'next_steps' field in shift AI response"
        assert isinstance(insight["next_steps"], list), "next_steps should be array"
        
        # classification field for shift AI
        assert "classification" in insight, "Missing 'classification' field"
        assert insight["classification"] in ["healthy", "tight", "underperforming", "unknown"]
        
        print(f"Shift AI response valid. Classification: {insight['classification']}")
        print(f"next_steps count: {len(insight.get('next_steps', []))}")

    def test_shift_ai_with_question(self, auth_headers):
        """POST /api/manager/shift-ai accepts question parameter for conversational flow"""
        today = time.strftime("%Y-%m-%d")
        response = requests.post(
            f"{BASE_URL}/api/manager/shift-ai",
            headers=auth_headers,
            data={
                "venue_id": VENUE_ID,
                "date_from": today,
                "date_to": today,
                "question": "Should I reduce staff on weekdays?"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "insight" in data
        assert "next_steps" in data["insight"]
        print("Shift AI accepted question parameter successfully")


# ─── STAFF COSTS TESTS ──────────────────────────────────────────────────

class TestStaffCosts:
    """Tests for Manager Dashboard staff costs with wages/tips/total columns"""

    def test_staff_costs_returns_wages_tips_total(self, auth_headers):
        """GET /api/manager/staff-costs returns staff with wages, tips, total fields"""
        today = time.strftime("%Y-%m-%d")
        response = requests.get(
            f"{BASE_URL}/api/manager/staff-costs",
            params={
                "venue_id": VENUE_ID,
                "date_from": today,
                "date_to": today
            },
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "staff" in data
        assert "total_cost" in data
        assert isinstance(data["staff"], list)
        
        if len(data["staff"]) > 0:
            staff_member = data["staff"][0]
            # Required fields per requirements
            assert "name" in staff_member, "Missing 'name' field"
            assert "wages" in staff_member, "Missing 'wages' field"
            assert "tips" in staff_member, "Missing 'tips' field"
            assert "total" in staff_member, "Missing 'total' field"
            
            # Validate types
            assert isinstance(staff_member["wages"], (int, float))
            assert isinstance(staff_member["tips"], (int, float))
            assert isinstance(staff_member["total"], (int, float))
            
            # total should equal wages + tips
            expected_total = staff_member["wages"] + staff_member["tips"]
            assert abs(staff_member["total"] - expected_total) < 0.01, "total != wages + tips"
            
            print(f"Staff breakdown valid: {staff_member['name']} - Wages: ${staff_member['wages']}, Tips: ${staff_member['tips']}, Total: ${staff_member['total']}")

    def test_staff_costs_has_hourly_info(self, auth_headers):
        """Staff costs include hourly_rate and hours_worked"""
        today = time.strftime("%Y-%m-%d")
        response = requests.get(
            f"{BASE_URL}/api/manager/staff-costs",
            params={
                "venue_id": VENUE_ID,
                "date_from": today,
                "date_to": today
            },
            headers={"Authorization": auth_headers["Authorization"]}
        )
        assert response.status_code == 200
        data = response.json()
        
        if len(data["staff"]) > 0:
            staff_member = data["staff"][0]
            assert "hourly_rate" in staff_member
            assert "hours_worked" in staff_member
            print(f"Staff has hourly info: ${staff_member['hourly_rate']}/hr x {staff_member['hours_worked']}h")


# ─── AUTHENTICATION TESTS ───────────────────────────────────────────────

class TestAuthEndpoints:
    """Verify login returns access_token"""

    def test_login_returns_access_token(self):
        """Login response should include access_token field"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data, "Login should return 'access_token' field"
        print("Login successfully returns access_token")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
