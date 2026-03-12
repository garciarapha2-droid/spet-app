"""
Iteration 41: Testing Operational Rules 1 & 2 + Regression
- Rule 1: ID verification exists ONLY in Table module (code review passed - TapPage has no IDVerificationModal)
- Rule 2: All financial values are positive
- Previous fixes: tips attribution, Inside Tabs, payment flow
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for teste@teste.com"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teste@teste.com",
        "password": "12345"
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
def ceo_token():
    """Get auth token for CEO (garcia.rapha2@gmail.com)"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "garcia.rapha2@gmail.com",
        "password": "1234"
    })
    assert resp.status_code == 200, f"CEO Login failed: {resp.text}"
    return resp.json()["access_token"]


class TestRule2PositiveFinancials:
    """Rule 2: Demo financial values must all be positive (revenue > staff costs)"""
    
    def test_shift_overview_positive_result(self, auth_token):
        """GET /api/manager/shift-overview should show result > 0 and status = 'positive'"""
        resp = requests.get(
            f"{BASE_URL}/api/manager/shift-overview",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"API failed: {resp.text}"
        data = resp.json()
        
        # Verify result is positive
        assert data["result"] > 0, f"Expected positive result, got {data['result']}"
        assert data["status"] == "positive", f"Expected status 'positive', got {data['status']}"
        
        # Verify revenue > staff_cost
        assert data["revenue"] > data["staff_cost"], \
            f"Revenue ({data['revenue']}) should be > staff_cost ({data['staff_cost']})"
        
        print(f"PASS: shift-overview result=${data['result']}, status={data['status']}")
    
    def test_manager_overview_positive_revenue(self, auth_token):
        """GET /api/manager/overview should show revenue_today > 0"""
        resp = requests.get(
            f"{BASE_URL}/api/manager/overview",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"API failed: {resp.text}"
        data = resp.json()
        
        # Verify revenue_today is positive
        assert data["kpis"]["revenue_today"] > 0, \
            f"Expected positive revenue_today, got {data['kpis']['revenue_today']}"
        
        print(f"PASS: manager/overview revenue_today=${data['kpis']['revenue_today']}")
    
    def test_ceo_health_positive_net_profit(self, ceo_token):
        """GET /api/ceo/health should show net_profit > 0"""
        resp = requests.get(
            f"{BASE_URL}/api/ceo/health",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert resp.status_code == 200, f"API failed: {resp.text}"
        data = resp.json()
        
        # Verify net_profit is positive
        assert data["kpis"]["net_profit"] > 0, \
            f"Expected positive net_profit, got {data['kpis']['net_profit']}"
        
        print(f"PASS: ceo/health net_profit=${data['kpis']['net_profit']}")


class TestStaffEarningsTipAttribution:
    """Previous fix: Tips are attributed to specific staff members"""
    
    def test_staff_costs_tip_breakdown(self, auth_token):
        """GET /api/manager/staff-costs should show tips attributed to specific staff"""
        resp = requests.get(
            f"{BASE_URL}/api/manager/staff-costs",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"API failed: {resp.text}"
        data = resp.json()
        
        # Find staff with tips
        staff_with_tips = [s for s in data["staff"] if s["tips"] > 0]
        assert len(staff_with_tips) > 0, "At least one staff member should have tips"
        
        # Verify Carlos Silva has tips
        carlos = next((s for s in data["staff"] if s["name"] == "Carlos Silva"), None)
        assert carlos is not None, "Carlos Silva should exist in staff"
        assert carlos["tips"] > 0, f"Carlos Silva should have tips, got {carlos['tips']}"
        
        # Verify total earnings calculation
        for staff in data["staff"]:
            expected_total = round(staff["wages"] + staff["tips"], 2)
            assert abs(staff["total"] - expected_total) < 0.01, \
                f"{staff['name']}: total ({staff['total']}) != wages ({staff['wages']}) + tips ({staff['tips']})"
        
        print(f"PASS: Staff tips - Carlos={carlos['tips']}")
        
    def test_staff_with_tips(self, auth_token):
        """Verify Ana Perez and Marco Rossi also have tips attributed"""
        resp = requests.get(
            f"{BASE_URL}/api/manager/staff-costs",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = resp.json()
        
        # Check Ana Perez
        ana = next((s for s in data["staff"] if s["name"] == "Ana Perez"), None)
        assert ana is not None, "Ana Perez should exist"
        assert ana["tips"] > 0, f"Ana Perez should have tips, got {ana.get('tips', 0)}"
        
        # Check Marco Rossi
        marco = next((s for s in data["staff"] if s["name"] == "Marco Rossi"), None)
        assert marco is not None, "Marco Rossi should exist"
        assert marco["tips"] > 0, f"Marco Rossi should have tips, got {marco.get('tips', 0)}"
        
        print(f"PASS: Ana tips={ana['tips']}, Marco tips={marco['tips']}")


class TestInsideTabsAllGuests:
    """Previous fix: Inside Tabs shows all guests including closed sessions"""
    
    def test_pulse_inside_all_guests(self, auth_token):
        """GET /api/pulse/inside should return all guests including closed sessions"""
        resp = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200, f"API failed: {resp.text}"
        data = resp.json()
        
        # Should have 7 guests total
        assert data["total"] == 7, f"Expected 7 total guests, got {data['total']}"
        assert len(data["guests"]) == 7, f"Expected 7 guests in list, got {len(data['guests'])}"
        
        # Verify Alex Turner with closed tab is present
        alex = next((g for g in data["guests"] if g["guest_name"] == "Alex Turner"), None)
        assert alex is not None, "Alex Turner should be in guests list"
        assert alex["tab_number"] == 105, f"Alex should have tab #105, got {alex.get('tab_number')}"
        assert alex["tab_status"] == "closed", f"Alex's tab should be closed, got {alex.get('tab_status')}"
        assert alex["tab_total"] == 43.0, f"Alex's tab total should be $43, got {alex.get('tab_total')}"
        
        print(f"PASS: pulse/inside has {data['total']} guests including Alex Turner (closed tab)")
    
    def test_pulse_inside_has_open_and_closed(self, auth_token):
        """Verify mix of open and closed sessions"""
        resp = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        data = resp.json()
        
        open_sessions = [g for g in data["guests"] if g.get("tab_status") == "open"]
        closed_sessions = [g for g in data["guests"] if g.get("tab_status") == "closed"]
        
        assert len(open_sessions) >= 1, "Should have at least 1 open session"
        assert len(closed_sessions) >= 1, "Should have at least 1 closed session"
        
        print(f"PASS: {len(open_sessions)} open, {len(closed_sessions)} closed sessions")


class TestAuthentication:
    """Test login credentials"""
    
    def test_teste_login(self):
        """teste@teste.com / 12345 can login"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "teste@teste.com"
        print("PASS: teste@teste.com login successful")
    
    def test_ceo_login(self):
        """garcia.rapha2@gmail.com / 1234 can login (CEO)"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "garcia.rapha2@gmail.com",
            "password": "1234"
        })
        assert resp.status_code == 200, f"CEO Login failed: {resp.text}"
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "garcia.rapha2@gmail.com"
        print("PASS: CEO garcia.rapha2@gmail.com login successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
