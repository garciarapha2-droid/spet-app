"""
Test Suite for Iteration 18: Shift vs Operations Feature Block
Tests all shift-ops endpoints:
- GET /api/manager/shift-overview - Revenue, tables_closed, avg_ticket, staff_cost, result, status
- GET /api/manager/staff-costs - Total cost + staff breakdown
- PUT /api/manager/staff-customize/{id} - Update staff role/hourly_rate
- GET /api/manager/staff-roles - Custom roles for venue
- POST /api/manager/staff-roles - Create new custom role
- DELETE /api/manager/staff-roles/{id} - Soft-delete role
- GET /api/manager/shift-history - Per-day performance history
- GET /api/manager/shift-chart - Revenue vs Cost chart data
- POST /api/manager/shift-snapshot - Save cost snapshot
- POST /api/manager/shift-ai - AI analysis using GPT-5.2
- Regression tests for Overview, Staff, Tables by Server
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("token")


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestShiftOverviewEndpoint:
    """Tests for GET /api/manager/shift-overview"""
    
    def test_shift_overview_returns_all_kpis(self, api_client):
        """Verify shift-overview returns revenue, tables_closed, avg_ticket, staff_cost, result, status"""
        response = api_client.get(f"{BASE_URL}/api/manager/shift-overview", params={
            "venue_id": VENUE_ID
        })
        assert response.status_code == 200, f"Shift overview failed: {response.text}"
        data = response.json()
        
        # Verify all required fields
        assert "revenue" in data, "Missing revenue field"
        assert "tables_closed" in data, "Missing tables_closed field"
        assert "avg_ticket" in data, "Missing avg_ticket field"
        assert "staff_cost" in data, "Missing staff_cost field"
        assert "result" in data, "Missing result (net) field"
        assert "status" in data, "Missing status field"
        assert "period" in data, "Missing period field"
        
        # Verify status is one of valid values
        assert data["status"] in ["positive", "tight", "negative"], f"Invalid status: {data['status']}"
        
        # Verify types
        assert isinstance(data["revenue"], (int, float))
        assert isinstance(data["tables_closed"], int)
        assert isinstance(data["staff_cost"], (int, float))
        assert isinstance(data["result"], (int, float))
        
        print(f"Shift Overview: Revenue=${data['revenue']}, Cost=${data['staff_cost']}, Result=${data['result']}, Status={data['status']}")

    def test_shift_overview_with_date_range(self, api_client):
        """Verify shift-overview accepts date_from and date_to parameters"""
        response = api_client.get(f"{BASE_URL}/api/manager/shift-overview", params={
            "venue_id": VENUE_ID,
            "date_from": "2025-01-01",
            "date_to": "2025-01-31"
        })
        assert response.status_code == 200, f"Shift overview with dates failed: {response.text}"
        data = response.json()
        assert "period" in data
        print(f"Shift Overview with date range: {data['period']}")


class TestStaffCostsEndpoint:
    """Tests for GET /api/manager/staff-costs"""
    
    def test_staff_costs_returns_breakdown(self, api_client):
        """Verify staff-costs returns total_cost and staff breakdown"""
        response = api_client.get(f"{BASE_URL}/api/manager/staff-costs", params={
            "venue_id": VENUE_ID
        })
        assert response.status_code == 200, f"Staff costs failed: {response.text}"
        data = response.json()
        
        # Verify required fields
        assert "total_cost" in data, "Missing total_cost field"
        assert "staff" in data, "Missing staff breakdown"
        
        # Verify staff has required fields
        if data["staff"]:
            staff = data["staff"][0]
            assert "name" in staff, "Staff missing name"
            assert "role" in staff, "Staff missing role"
            assert "hourly_rate" in staff, "Staff missing hourly_rate"
            assert "hours_worked" in staff, "Staff missing hours_worked"
            assert "earned" in staff, "Staff missing earned"
            
        print(f"Staff Costs: Total=${data['total_cost']}, Staff count={len(data['staff'])}")
        for s in data["staff"]:
            print(f"  - {s['name']} ({s['role']}): ${s['hourly_rate']}/hr x {s['hours_worked']}h = ${s['earned']}")


class TestStaffCustomizeEndpoint:
    """Tests for PUT /api/manager/staff-customize/{id}"""
    
    def test_customize_staff_hourly_rate(self, api_client):
        """Verify staff-customize can update hourly_rate"""
        # First get staff list to get a valid ID
        response = api_client.get(f"{BASE_URL}/api/manager/staff-costs", params={
            "venue_id": VENUE_ID
        })
        assert response.status_code == 200
        staff = response.json().get("staff", [])
        
        if staff:
            staff_id = staff[0]["id"]
            original_rate = staff[0]["hourly_rate"]
            
            # Update hourly rate
            new_rate = original_rate + 1
            form_data = {"hourly_rate": str(new_rate)}
            update_response = requests.put(
                f"{BASE_URL}/api/manager/staff-customize/{staff_id}",
                data=form_data,
                headers={"Authorization": api_client.headers["Authorization"]}
            )
            assert update_response.status_code == 200, f"Update failed: {update_response.text}"
            assert update_response.json().get("updated") == True
            
            # Verify change persisted
            verify_response = api_client.get(f"{BASE_URL}/api/manager/staff-costs", params={
                "venue_id": VENUE_ID
            })
            updated_staff = next((s for s in verify_response.json()["staff"] if s["id"] == staff_id), None)
            assert updated_staff is not None
            assert updated_staff["hourly_rate"] == new_rate, "Hourly rate not updated"
            
            # Restore original rate
            requests.put(
                f"{BASE_URL}/api/manager/staff-customize/{staff_id}",
                data={"hourly_rate": str(original_rate)},
                headers={"Authorization": api_client.headers["Authorization"]}
            )
            
            print(f"Customize Staff: Updated {staff[0]['name']} rate from ${original_rate} to ${new_rate}")
        else:
            pytest.skip("No staff available to test")


class TestStaffRolesEndpoints:
    """Tests for staff roles CRUD endpoints"""
    
    def test_get_staff_roles(self, api_client):
        """Verify GET /api/manager/staff-roles returns roles"""
        response = api_client.get(f"{BASE_URL}/api/manager/staff-roles", params={
            "venue_id": VENUE_ID
        })
        assert response.status_code == 200, f"Get roles failed: {response.text}"
        data = response.json()
        assert "roles" in data
        print(f"Staff Roles: {len(data['roles'])} roles found")
        for r in data["roles"]:
            print(f"  - {r['name']}: ${r['hourly_rate']}/hr")

    def test_create_and_delete_staff_role(self, api_client):
        """Verify POST creates role and DELETE soft-deletes it"""
        # Create a new role
        role_name = f"TEST_Role_{int(time.time())}"
        create_response = requests.post(
            f"{BASE_URL}/api/manager/staff-roles",
            data={
                "venue_id": VENUE_ID,
                "name": role_name,
                "hourly_rate": "25.50"
            },
            headers={"Authorization": api_client.headers["Authorization"]}
        )
        assert create_response.status_code == 200, f"Create role failed: {create_response.text}"
        created = create_response.json()
        assert created.get("name") == role_name
        assert created.get("hourly_rate") == 25.50
        role_id = created.get("id")
        
        print(f"Created role: {role_name} (ID: {role_id})")
        
        # Verify role exists
        list_response = api_client.get(f"{BASE_URL}/api/manager/staff-roles", params={
            "venue_id": VENUE_ID
        })
        roles = list_response.json().get("roles", [])
        assert any(r["id"] == role_id for r in roles), "Created role not in list"
        
        # Delete the role
        delete_response = requests.delete(
            f"{BASE_URL}/api/manager/staff-roles/{role_id}",
            params={"venue_id": VENUE_ID},
            headers={"Authorization": api_client.headers["Authorization"]}
        )
        assert delete_response.status_code == 200, f"Delete role failed: {delete_response.text}"
        assert delete_response.json().get("deleted") == True
        
        # Verify role no longer in active list
        verify_response = api_client.get(f"{BASE_URL}/api/manager/staff-roles", params={
            "venue_id": VENUE_ID
        })
        roles_after = verify_response.json().get("roles", [])
        assert not any(r["id"] == role_id for r in roles_after), "Role still exists after delete"
        
        print(f"Deleted role: {role_name}")


class TestShiftHistoryEndpoint:
    """Tests for GET /api/manager/shift-history"""
    
    def test_shift_history_returns_daily_data(self, api_client):
        """Verify shift-history returns per-day performance"""
        response = api_client.get(f"{BASE_URL}/api/manager/shift-history", params={
            "venue_id": VENUE_ID,
            "days": 30
        })
        assert response.status_code == 200, f"Shift history failed: {response.text}"
        data = response.json()
        
        assert "history" in data
        assert "days" in data
        
        if data["history"]:
            day = data["history"][0]
            assert "date" in day
            assert "day_name" in day
            assert "revenue" in day
            assert "staff_cost" in day
            assert "result" in day
            assert "status" in day
            assert day["status"] in ["positive", "tight", "negative"]
            
            print(f"Shift History: {len(data['history'])} days with data")
            for d in data["history"][:5]:
                print(f"  - {d['date']} ({d['day_name'][:3]}): Rev=${d['revenue']}, Cost=${d['staff_cost']}, Result=${d['result']} [{d['status']}]")
        else:
            print("Shift History: No historical data available")


class TestShiftChartEndpoint:
    """Tests for GET /api/manager/shift-chart"""
    
    def test_shift_chart_returns_daily_rev_cost(self, api_client):
        """Verify shift-chart returns revenue and cost per day"""
        response = api_client.get(f"{BASE_URL}/api/manager/shift-chart", params={
            "venue_id": VENUE_ID,
            "period": "30d"
        })
        assert response.status_code == 200, f"Shift chart failed: {response.text}"
        data = response.json()
        
        assert "data" in data
        assert "period" in data
        
        if data["data"]:
            point = data["data"][0]
            assert "date" in point
            assert "label" in point
            assert "revenue" in point
            assert "cost" in point
            
            print(f"Shift Chart: {len(data['data'])} data points, period={data['period']}")
        else:
            print("Shift Chart: No data points available")

    def test_shift_chart_period_filters(self, api_client):
        """Verify chart accepts different period filters"""
        for period in ["today", "7d", "30d", "year"]:
            response = api_client.get(f"{BASE_URL}/api/manager/shift-chart", params={
                "venue_id": VENUE_ID,
                "period": period
            })
            assert response.status_code == 200, f"Chart period={period} failed: {response.text}"
            print(f"Chart period '{period}': OK")


class TestShiftSnapshotEndpoint:
    """Tests for POST /api/manager/shift-snapshot"""
    
    def test_shift_snapshot_saves_costs(self, api_client):
        """Verify shift-snapshot saves cost data for today"""
        response = requests.post(
            f"{BASE_URL}/api/manager/shift-snapshot",
            data={"venue_id": VENUE_ID},
            headers={"Authorization": api_client.headers["Authorization"]}
        )
        assert response.status_code == 200, f"Shift snapshot failed: {response.text}"
        data = response.json()
        
        assert data.get("saved") == True
        assert "date" in data
        assert "staff_cost" in data
        
        print(f"Shift Snapshot: Saved for {data['date']}, cost=${data['staff_cost']}")


class TestShiftAIEndpoint:
    """Tests for POST /api/manager/shift-ai - GPT-5.2 Analysis"""
    
    def test_shift_ai_generates_analysis(self, api_client):
        """Verify shift-ai returns AI analysis with proper structure"""
        today = time.strftime("%Y-%m-%d")
        response = requests.post(
            f"{BASE_URL}/api/manager/shift-ai",
            data={
                "venue_id": VENUE_ID,
                "date_from": today,
                "date_to": today
            },
            headers={"Authorization": api_client.headers["Authorization"]},
            timeout=30  # AI takes time
        )
        assert response.status_code == 200, f"Shift AI failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "insight" in data, "Missing insight field"
        assert "disclaimer" in data, "Missing disclaimer field"
        
        insight = data["insight"]
        if insight.get("summary") != "LLM not configured":
            # If AI is configured, verify insight structure
            assert "summary" in insight, "Insight missing summary"
            assert "what_we_see" in insight, "Insight missing what_we_see"
            assert "recommended_actions" in insight, "Insight missing recommended_actions"
            assert "classification" in insight, "Insight missing classification"
            assert insight["classification"] in ["healthy", "tight", "underperforming", "unknown"]
            
            print(f"AI Analysis Result:")
            print(f"  Classification: {insight['classification']}")
            print(f"  Summary: {insight['summary'][:100]}...")
            print(f"  Actions: {len(insight.get('recommended_actions', []))} recommendations")
        else:
            print("AI Analysis: LLM not configured (expected in test env)")
        
        print(f"Disclaimer present: {bool(data.get('disclaimer'))}")

    def test_shift_ai_with_question(self, api_client):
        """Verify shift-ai accepts optional question parameter"""
        today = time.strftime("%Y-%m-%d")
        response = requests.post(
            f"{BASE_URL}/api/manager/shift-ai",
            data={
                "venue_id": VENUE_ID,
                "date_from": today,
                "date_to": today,
                "question": "Is my staffing efficient?"
            },
            headers={"Authorization": api_client.headers["Authorization"]},
            timeout=30
        )
        assert response.status_code == 200, f"Shift AI with question failed: {response.text}"
        print("AI Analysis with custom question: OK")


class TestRegressionManagerFeatures:
    """Regression tests for existing Manager features"""
    
    def test_manager_overview_still_works(self, api_client):
        """Verify Manager Overview endpoint works"""
        response = api_client.get(f"{BASE_URL}/api/manager/overview", params={
            "venue_id": VENUE_ID
        })
        assert response.status_code == 200, f"Manager overview failed: {response.text}"
        data = response.json()
        assert "kpis" in data
        assert "charts" in data
        print("Regression: Manager Overview - PASS")

    def test_manager_staff_still_works(self, api_client):
        """Verify Manager Staff endpoint works"""
        response = api_client.get(f"{BASE_URL}/api/manager/staff", params={
            "venue_id": VENUE_ID
        })
        assert response.status_code == 200, f"Manager staff failed: {response.text}"
        data = response.json()
        assert "staff" in data or "barmen" in data
        print("Regression: Manager Staff - PASS")

    def test_tables_by_server_still_works(self, api_client):
        """Verify Tables by Server endpoint works"""
        response = api_client.get(f"{BASE_URL}/api/manager/tables-by-server", params={
            "venue_id": VENUE_ID
        })
        assert response.status_code == 200, f"Tables by server failed: {response.text}"
        data = response.json()
        assert "servers" in data or "unassigned" in data
        print("Regression: Tables by Server - PASS")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
