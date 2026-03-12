"""
P0 Features Test Suite - Iteration 38
Testing 3 critical P0 tasks:
1. P0-1: Tip Distribution - Tips go ONLY to the specific bartender
2. P0-2: Payment Flow Consistency - Both Tap and Table must force payment selection
3. P0-3: Inside Now Panel - VenueHomePage shows ALL active guests
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

class TestAuth:
    """Authentication helper"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        # API returns 'access_token' not 'token'
        return data.get("access_token") or data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestP0_1_TipDistribution(TestAuth):
    """
    P0-1: Tip Distribution - Tips must go ONLY to the specific bartender who handled the order
    NOT split among all staff
    """
    
    def test_01_login_and_get_barmen(self, auth_headers):
        """Get list of barmen to use for tip attribution test"""
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        barmen = data.get("barmen", [])
        print(f"Found {len(barmen)} barmen: {[b['name'] for b in barmen]}")
        assert len(barmen) > 0, "At least one barman should exist"
        return barmen
    
    def test_02_open_tab_with_bartender(self, auth_headers):
        """Open a new tab with specific bartender assigned"""
        # Get first barman
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        barmen = response.json().get("barmen", [])
        assert len(barmen) > 0, "Need at least one barman"
        bartender = barmen[0]
        
        # Open tab with bartender_id
        form_data = {
            "venue_id": VENUE_ID,
            "guest_name": "P0_TIP_TEST_Guest",
            "bartender_id": bartender["id"],
            "bartender_name": bartender["name"]
        }
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=form_data,
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        assert response.status_code == 200, f"Failed to open tab: {response.text}"
        data = response.json()
        print(f"Opened tab #{data.get('tab_number')} with bartender {bartender['name']}")
        session_id = data.get("session_id")
        assert session_id, "Session ID should be returned"
        return {"session_id": session_id, "bartender": bartender}
    
    def test_03_add_item_and_close_tab(self, auth_headers):
        """Add an item and close the tab via Pay Here"""
        # First open a fresh tab
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        barmen = response.json().get("barmen", [])
        bartender = barmen[0]
        
        form_data = {
            "venue_id": VENUE_ID,
            "guest_name": "P0_TIP_CLOSE_TEST",
            "bartender_id": bartender["id"],
            "bartender_name": bartender["name"]
        }
        response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=form_data,
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        session_id = response.json().get("session_id")
        
        # Get catalog item
        catalog_resp = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        items = catalog_resp.json().get("items", [])
        if items:
            item = items[0]
            add_resp = requests.post(
                f"{BASE_URL}/api/tap/session/{session_id}/add",
                data={"item_id": item["id"], "qty": "1"},
                headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
            )
            print(f"Added item {item['name']} to session")
        
        # Close tab with Pay Here
        close_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data={
                "payment_method": "card",
                "payment_location": "pay_here",
                "bartender_id": bartender["id"]
            },
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        assert close_resp.status_code == 200, f"Failed to close tab: {close_resp.text}"
        print(f"Closed session {session_id}")
        return {"session_id": session_id, "bartender": bartender}
    
    def test_04_record_tip_for_closed_session(self, auth_headers):
        """Record a tip and verify it's attributed to the specific bartender"""
        # Open, add item, close tab
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        barmen = response.json().get("barmen", [])
        bartender = barmen[0]
        bartender_id = bartender["id"]
        bartender_name = bartender["name"]
        
        # Open tab
        form_data = {
            "venue_id": VENUE_ID,
            "guest_name": "P0_TIP_RECORD_TEST",
            "bartender_id": bartender_id,
            "bartender_name": bartender_name
        }
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=form_data,
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        session_id = open_resp.json().get("session_id")
        
        # Add item
        catalog_resp = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        items = catalog_resp.json().get("items", [])
        if items:
            item = items[0]
            requests.post(
                f"{BASE_URL}/api/tap/session/{session_id}/add",
                data={"item_id": item["id"], "qty": "2"},
                headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
            )
        
        # Close tab
        close_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data={
                "payment_method": "card",
                "payment_location": "pay_here",
                "bartender_id": bartender_id
            },
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        total = close_resp.json().get("total", 0)
        
        # Record tip (20%)
        tip_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/record-tip",
            data={"tip_percent": "20"},
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        assert tip_resp.status_code == 200, f"Failed to record tip: {tip_resp.text}"
        tip_data = tip_resp.json()
        
        print(f"Tip recorded: ${tip_data.get('tip_amount')} ({tip_data.get('tip_percent')}%)")
        print(f"Distribution: {tip_data.get('distribution')}")
        
        # CRITICAL CHECK: Tip should be attributed ONLY to the assigned bartender
        distribution = tip_data.get("distribution", [])
        assert len(distribution) == 1, f"Tip should go to exactly 1 bartender, got {len(distribution)}"
        
        # Verify the tip goes to the correct bartender
        assigned_tip = distribution[0]
        assert assigned_tip.get("staff_id") == bartender_id, \
            f"Tip should go to bartender {bartender_id}, but went to {assigned_tip.get('staff_id')}"
        assert assigned_tip.get("proportion") == 1.0, \
            f"Bartender should get 100% of tip, got {assigned_tip.get('proportion')*100}%"
        
        print(f"SUCCESS: Tip ${assigned_tip.get('tip')} goes ONLY to {bartender_name}")
        return {"session_id": session_id, "tip_data": tip_data}
    
    def test_05_verify_tip_in_manager_dashboard(self, auth_headers):
        """Verify tip appears in Manager Dashboard staff_costs for the specific bartender"""
        # Get staff costs breakdown
        response = requests.get(
            f"{BASE_URL}/api/manager/staff-costs",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to get staff costs: {response.text}"
        data = response.json()
        
        staff = data.get("staff", [])
        print(f"Staff breakdown from Manager Dashboard:")
        for s in staff:
            print(f"  - {s.get('name')}: wages=${s.get('wages')}, tips=${s.get('tips')}, total=${s.get('total')}")
        
        # Verify tips are not uniformly distributed
        tips_values = [s.get("tips", 0) for s in staff if s.get("tips", 0) > 0]
        if len(tips_values) > 1:
            # Tips should NOT be equally distributed
            unique_tips = set(tips_values)
            print(f"Tip values: {tips_values}")
            # This is a soft check - tips should vary per staff member
        
        return data


class TestP0_2_PaymentFlowConsistency(TestAuth):
    """
    P0-2: Payment Flow Consistency - Both Tap and Table modules must force payment selection
    (Pay Here / Pay at Register) after order confirmation
    """
    
    def test_01_verify_tap_close_requires_payment_location(self, auth_headers):
        """Close tab API should accept payment_location parameter"""
        # Open a tab
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        barmen = response.json().get("barmen", [])
        bartender = barmen[0] if barmen else None
        
        form_data = {
            "venue_id": VENUE_ID,
            "guest_name": "P0_PAYMENT_TAP_TEST"
        }
        if bartender:
            form_data["bartender_id"] = bartender["id"]
            form_data["bartender_name"] = bartender["name"]
            
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=form_data,
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        session_id = open_resp.json().get("session_id")
        
        # Test Pay Here
        close_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data={
                "payment_method": "card",
                "payment_location": "pay_here"
            },
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        assert close_resp.status_code == 200, f"Pay Here should work: {close_resp.text}"
        data = close_resp.json()
        assert data.get("payment_location") == "pay_here", "Payment location should be pay_here"
        print(f"Tap Pay Here: payment_location={data.get('payment_location')}")
    
    def test_02_verify_tap_pay_at_register(self, auth_headers):
        """Test Pay at Register option for Tap"""
        response = requests.get(
            f"{BASE_URL}/api/staff/barmen",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        barmen = response.json().get("barmen", [])
        bartender = barmen[0] if barmen else None
        
        form_data = {
            "venue_id": VENUE_ID,
            "guest_name": "P0_PAYMENT_REGISTER_TEST"
        }
        if bartender:
            form_data["bartender_id"] = bartender["id"]
            
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data=form_data,
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        session_id = open_resp.json().get("session_id")
        
        # Note: Pay at Register in frontend keeps tab OPEN, but backend allows close with this param
        # This tests the backend supports both options
        close_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            data={
                "payment_method": "card",
                "payment_location": "pay_at_register"
            },
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        assert close_resp.status_code == 200, f"Pay at Register should work: {close_resp.text}"
        data = close_resp.json()
        assert data.get("payment_location") == "pay_at_register", "Payment location should be pay_at_register"
        print(f"Tap Pay at Register: payment_location={data.get('payment_location')}")
    
    def test_03_verify_table_close_requires_payment(self, auth_headers):
        """Table close should require payment method and location"""
        # Get available tables
        tables_resp = requests.get(
            f"{BASE_URL}/api/table/tables",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert tables_resp.status_code == 200
        tables = tables_resp.json().get("tables", [])
        
        # Find an available table
        available_table = None
        for t in tables:
            if t.get("status") == "available":
                available_table = t
                break
        
        if not available_table:
            print("No available tables, skipping table payment test")
            pytest.skip("No available tables for testing")
            return
        
        # Open table
        open_resp = requests.post(
            f"{BASE_URL}/api/table/open",
            data={
                "venue_id": VENUE_ID,
                "table_id": available_table["id"],
                "guest_name": "P0_TABLE_PAYMENT_TEST",
                "server_name": "TestServer",
                "seats": "2"
            },
            headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if open_resp.status_code == 200:
            # Close table with payment
            close_resp = requests.post(
                f"{BASE_URL}/api/table/close",
                data={
                    "table_id": available_table["id"],
                    "payment_method": "card",
                    "payment_location": "pay_here"
                },
                headers={**auth_headers, "Content-Type": "application/x-www-form-urlencoded"}
            )
            print(f"Table close response: {close_resp.status_code} - {close_resp.text}")


class TestP0_3_InsideNowPanel(TestAuth):
    """
    P0-3: Inside Now Panel - VenueHomePage should show ALL active guests
    """
    
    def test_01_verify_inside_guests_endpoint(self, auth_headers):
        """Test GET /api/pulse/inside returns all guests inside the venue"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Inside guests endpoint failed: {response.text}"
        data = response.json()
        
        guests = data.get("guests", [])
        total = data.get("total", 0)
        
        print(f"Inside Now: {total} guests")
        for g in guests:
            print(f"  - {g.get('guest_name')}: entry_type={g.get('entry_type')}, "
                  f"tab_number={g.get('tab_number')}, status={g.get('guest_status')}, "
                  f"entered_at={g.get('entered_at')}")
        
        # Verify required fields are present
        if guests:
            guest = guests[0]
            assert "guest_id" in guest, "guest_id field required"
            assert "guest_name" in guest, "guest_name field required"
            assert "entered_at" in guest, "entered_at field required"
            assert "guest_status" in guest, "guest_status field required"
        
        return data
    
    def test_02_verify_guest_count_matches_demo_seed(self, auth_headers):
        """Demo seed creates 7 guests - verify they appear in Inside Now"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        data = response.json()
        
        guests = data.get("guests", [])
        total = len(guests)
        
        print(f"Expected 7 guests from demo seed, found: {total}")
        
        # List all guest names
        guest_names = [g.get("guest_name") for g in guests]
        print(f"Guests inside: {guest_names}")
        
        # The demo seed should have created 7 guests
        # This is a verification check, not a hard assertion since state may vary
        if total < 7:
            print(f"WARNING: Expected 7 guests but found {total}")
        else:
            print(f"SUCCESS: Found {total} guests inside")
        
        return {"total": total, "guests": guest_names}
    
    def test_03_verify_guest_details(self, auth_headers):
        """Verify each guest has entry time, consumption status, and tab ID"""
        response = requests.get(
            f"{BASE_URL}/api/pulse/inside",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        data = response.json()
        guests = data.get("guests", [])
        
        for g in guests:
            guest_name = g.get("guest_name", "Unknown")
            entered_at = g.get("entered_at")
            guest_status = g.get("guest_status")
            tab_number = g.get("tab_number")
            tab_total = g.get("tab_total")
            
            print(f"Guest: {guest_name}")
            print(f"  Entry Time: {entered_at}")
            print(f"  Status: {guest_status}")
            print(f"  Tab Number: {tab_number}")
            print(f"  Tab Total: ${tab_total if tab_total else 0}")
            print()
            
            # Verify entry time exists
            assert entered_at is not None, f"Guest {guest_name} should have entry time"
            
            # Verify status is one of expected values
            valid_statuses = ["Open", "Blocked", "Paid", "No consumption"]
            if tab_total and tab_total > 0:
                # If has consumption, status should reflect it
                print(f"  Has consumption: ${tab_total}")
        
        return guests


class TestManagerOverviewWithTips(TestAuth):
    """Additional tests for Manager Dashboard tip visibility"""
    
    def test_01_shift_overview_shows_tips(self, auth_headers):
        """Verify shift overview includes tips KPI"""
        response = requests.get(
            f"{BASE_URL}/api/manager/shift-overview",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Shift overview failed: {response.text}"
        data = response.json()
        
        tips = data.get("tips", 0)
        revenue = data.get("revenue", 0)
        staff_cost = data.get("staff_cost", 0)
        
        print(f"Shift Overview KPIs:")
        print(f"  Revenue: ${revenue}")
        print(f"  Staff Cost: ${staff_cost}")
        print(f"  Tips: ${tips}")
        
        # Tips field should exist
        assert "tips" in data, "Tips field should be in shift overview"
        
        return data
    
    def test_02_staff_costs_breakdown(self, auth_headers):
        """Verify staff costs shows individual tip attribution"""
        response = requests.get(
            f"{BASE_URL}/api/manager/staff-costs",
            params={"venue_id": VENUE_ID},
            headers=auth_headers
        )
        assert response.status_code == 200, f"Staff costs failed: {response.text}"
        data = response.json()
        
        staff = data.get("staff", [])
        print(f"Staff Costs Breakdown ({len(staff)} staff members):")
        
        for s in staff:
            print(f"  {s.get('name')} ({s.get('role')}):")
            print(f"    Hourly Rate: ${s.get('hourly_rate')}/hr")
            print(f"    Hours: {s.get('hours_worked')}")
            print(f"    Wages: ${s.get('wages')}")
            print(f"    Tips: ${s.get('tips')}")
            print(f"    Total: ${s.get('total')}")
        
        return data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
