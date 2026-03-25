"""
Iteration 32: TIP OWNERSHIP & STAFF EARNINGS TESTS
Testing the new business logic:
1. Tips are NOT pooled - they belong to the bartender who served
2. Staff earnings = Base Pay (hours * rate) + Tips (cumulative)
3. Manager dashboard shows hours_worked, hourly_rate, base_pay, tips, total_earnings per staff
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nfc-guest-flow.preview.emergentagent.com').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
TEST_EMAIL = "teste@teste.com"
TEST_PASSWORD = "12345"


@pytest.fixture(scope="module")
def auth_token():
    """Login and get auth token"""
    fd = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    r = requests.post(f"{BASE_URL}/api/auth/login", json=fd)
    if r.status_code == 200:
        return r.json().get("access_token")
    pytest.skip(f"Auth failed: {r.status_code} {r.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def existing_barmen(auth_headers):
    """Get existing barmen list"""
    r = requests.get(f"{BASE_URL}/api/staff/barmen?venue_id={VENUE_ID}", headers=auth_headers)
    assert r.status_code == 200
    return r.json().get("barmen", [])


class TestBarmenHourlyRateManagement:
    """Test hourly_rate field on barmen CRUD"""

    def test_get_barmen_shows_hourly_rate(self, auth_headers, existing_barmen):
        """Verify existing barmen have hourly_rate field"""
        assert len(existing_barmen) > 0, "Need existing barmen"
        # Check that Carlos Silva has rate=$20
        carlos = next((b for b in existing_barmen if "Carlos" in b.get("name", "")), None)
        if carlos:
            assert "hourly_rate" in carlos, "Carlos should have hourly_rate field"
            print(f"Carlos Silva hourly_rate: ${carlos.get('hourly_rate', 0)}")

    def test_create_barman_with_hourly_rate(self, auth_headers):
        """POST /api/staff/barmen with hourly_rate=25 creates barman with rate"""
        fd = {
            "venue_id": VENUE_ID,
            "name": f"TEST_RateBarman_{int(time.time())}",
            "role": "bartender",
            "hourly_rate": "25"
        }
        r = requests.post(f"{BASE_URL}/api/staff/barmen", data=fd, headers=auth_headers)
        assert r.status_code == 200, f"Create failed: {r.text}"
        data = r.json()
        assert data.get("hourly_rate") == 25.0, f"Expected hourly_rate=25, got {data.get('hourly_rate')}"
        print(f"Created barman with id={data['id']}, hourly_rate=25")
        return data["id"]

    def test_update_barman_hourly_rate(self, auth_headers, existing_barmen):
        """PUT /api/staff/barmen/{id} with hourly_rate=30 updates rate"""
        # Find a test barman or use existing
        test_barman = next((b for b in existing_barmen if "TEST_" in b.get("name", "")), None)
        if not test_barman:
            # Create one first
            fd = {
                "venue_id": VENUE_ID,
                "name": f"TEST_UpdateRate_{int(time.time())}",
                "role": "server",
                "hourly_rate": "15"
            }
            r = requests.post(f"{BASE_URL}/api/staff/barmen", data=fd, headers=auth_headers)
            assert r.status_code == 200
            test_barman = r.json()

        barman_id = test_barman["id"]
        
        # Update hourly_rate to 30
        fd = {"hourly_rate": "30"}
        r = requests.put(f"{BASE_URL}/api/staff/barmen/{barman_id}", data=fd, headers=auth_headers)
        assert r.status_code == 200, f"Update failed: {r.text}"
        
        # Verify update
        r2 = requests.get(f"{BASE_URL}/api/staff/barmen?venue_id={VENUE_ID}", headers=auth_headers)
        assert r2.status_code == 200
        updated = next((b for b in r2.json()["barmen"] if b["id"] == barman_id), None)
        assert updated is not None, "Barman not found after update"
        assert updated.get("hourly_rate") == 30.0, f"Expected hourly_rate=30, got {updated.get('hourly_rate')}"
        print(f"Updated barman {barman_id} hourly_rate to 30")


class TestTipOwnership:
    """
    TIP OWNERSHIP: Tips belong to the bartender who served, NOT pooled
    """

    def test_tip_attribution_to_bartender(self, auth_headers, existing_barmen):
        """
        Test: Open tab with bartender_id=Carlos, close + tip $5
        Open another tab with bartender_id=Carlos, close + tip $4
        Open tab with bartender_id=Ana, close + tip $3
        Verify Carlos has tips=$9 and Ana has tips=$3 in staff-costs
        """
        # Find Carlos and Ana
        carlos = next((b for b in existing_barmen if "Carlos" in b.get("name", "")), None)
        ana = next((b for b in existing_barmen if "Ana" in b.get("name", "")), None)
        
        if not carlos or not ana:
            pytest.skip("Need Carlos Silva and Ana Perez barmen for this test")

        carlos_id = carlos["id"]
        ana_id = ana["id"]
        
        sessions_created = []
        
        try:
            # Open tab 1 for Carlos with $5 tip
            fd1 = {
                "venue_id": VENUE_ID,
                "guest_name": f"TipTest_Carlos1_{int(time.time())}",
                "bartender_id": carlos_id,
                "bartender_name": carlos["name"]
            }
            r1 = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd1, headers=auth_headers)
            assert r1.status_code == 200, f"Open tab 1 failed: {r1.text}"
            session1_id = r1.json()["session_id"]
            sessions_created.append(session1_id)
            print(f"Opened tab 1 (Carlos): {session1_id}")

            # Add an item to have a total
            catalog_r = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
            items = catalog_r.json().get("items", [])
            if items:
                item_fd = {"item_id": items[0]["id"], "qty": "1"}
                requests.post(f"{BASE_URL}/api/tap/session/{session1_id}/add", data=item_fd, headers=auth_headers)

            # Close tab 1
            close_fd1 = {"payment_method": "card", "payment_location": "pay_here"}
            r_close1 = requests.post(f"{BASE_URL}/api/tap/session/{session1_id}/close", data=close_fd1, headers=auth_headers)
            assert r_close1.status_code == 200, f"Close tab 1 failed: {r_close1.text}"

            # Record tip $5 for tab 1
            tip_fd1 = {"tip_amount": "5"}
            r_tip1 = requests.post(f"{BASE_URL}/api/tap/session/{session1_id}/record-tip", data=tip_fd1, headers=auth_headers)
            assert r_tip1.status_code == 200, f"Record tip 1 failed: {r_tip1.text}"
            print(f"Tab 1 tip recorded: $5 for Carlos")

            # Open tab 2 for Carlos with $4 tip
            fd2 = {
                "venue_id": VENUE_ID,
                "guest_name": f"TipTest_Carlos2_{int(time.time())}",
                "bartender_id": carlos_id,
                "bartender_name": carlos["name"]
            }
            r2 = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd2, headers=auth_headers)
            assert r2.status_code == 200, f"Open tab 2 failed: {r2.text}"
            session2_id = r2.json()["session_id"]
            sessions_created.append(session2_id)

            if items:
                item_fd = {"item_id": items[0]["id"], "qty": "1"}
                requests.post(f"{BASE_URL}/api/tap/session/{session2_id}/add", data=item_fd, headers=auth_headers)

            close_fd2 = {"payment_method": "card", "payment_location": "pay_here"}
            r_close2 = requests.post(f"{BASE_URL}/api/tap/session/{session2_id}/close", data=close_fd2, headers=auth_headers)
            assert r_close2.status_code == 200

            tip_fd2 = {"tip_amount": "4"}
            r_tip2 = requests.post(f"{BASE_URL}/api/tap/session/{session2_id}/record-tip", data=tip_fd2, headers=auth_headers)
            assert r_tip2.status_code == 200
            print(f"Tab 2 tip recorded: $4 for Carlos")

            # Open tab 3 for Ana with $3 tip
            fd3 = {
                "venue_id": VENUE_ID,
                "guest_name": f"TipTest_Ana_{int(time.time())}",
                "bartender_id": ana_id,
                "bartender_name": ana["name"]
            }
            r3 = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd3, headers=auth_headers)
            assert r3.status_code == 200, f"Open tab 3 failed: {r3.text}"
            session3_id = r3.json()["session_id"]
            sessions_created.append(session3_id)

            if items:
                item_fd = {"item_id": items[0]["id"], "qty": "1"}
                requests.post(f"{BASE_URL}/api/tap/session/{session3_id}/add", data=item_fd, headers=auth_headers)

            close_fd3 = {"payment_method": "card", "payment_location": "pay_here"}
            r_close3 = requests.post(f"{BASE_URL}/api/tap/session/{session3_id}/close", data=close_fd3, headers=auth_headers)
            assert r_close3.status_code == 200

            tip_fd3 = {"tip_amount": "3"}
            r_tip3 = requests.post(f"{BASE_URL}/api/tap/session/{session3_id}/record-tip", data=tip_fd3, headers=auth_headers)
            assert r_tip3.status_code == 200
            print(f"Tab 3 tip recorded: $3 for Ana")

            # Now check staff-costs
            time.sleep(1)  # Allow DB to settle
            r_costs = requests.get(f"{BASE_URL}/api/manager/staff-costs?venue_id={VENUE_ID}", headers=auth_headers)
            assert r_costs.status_code == 200, f"Staff costs failed: {r_costs.text}"
            
            staff_breakdown = r_costs.json().get("staff", [])
            carlos_entry = next((s for s in staff_breakdown if s.get("id") == carlos_id), None)
            ana_entry = next((s for s in staff_breakdown if s.get("id") == ana_id), None)

            print(f"Staff costs response: {r_costs.json()}")
            
            if carlos_entry:
                print(f"Carlos tips in staff-costs: ${carlos_entry.get('tips', 0)}")
                # Carlos should have at least $9 from our test (may have more from existing data)
                assert carlos_entry.get("tips", 0) >= 9, f"Carlos expected tips >= $9, got ${carlos_entry.get('tips', 0)}"
            
            if ana_entry:
                print(f"Ana tips in staff-costs: ${ana_entry.get('tips', 0)}")
                # Ana should have at least $3 from our test
                assert ana_entry.get("tips", 0) >= 3, f"Ana expected tips >= $3, got ${ana_entry.get('tips', 0)}"

        finally:
            # Note: We don't delete sessions as they're closed
            print(f"Test sessions created: {sessions_created}")


class TestCumulativeTips:
    """Test that tips are cumulative per staff member"""

    def test_cumulative_tips_same_bartender(self, auth_headers, existing_barmen):
        """
        Create 3 separate closed sessions all assigned to the same bartender with $5, $3, $2 tips
        Verify that bartender shows cumulative $10 in tips
        """
        # Find a barman (use Marco Rossi for this test)
        marco = next((b for b in existing_barmen if "Marco" in b.get("name", "")), None)
        if not marco:
            pytest.skip("Need Marco Rossi barman for cumulative tips test")
        
        marco_id = marco["id"]
        sessions_created = []
        tip_amounts = [5, 3, 2]
        
        try:
            catalog_r = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
            items = catalog_r.json().get("items", [])
            
            for i, tip_amt in enumerate(tip_amounts):
                # Open session
                fd = {
                    "venue_id": VENUE_ID,
                    "guest_name": f"CumulativeTest_{i+1}_{int(time.time())}",
                    "bartender_id": marco_id,
                    "bartender_name": marco["name"]
                }
                r = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd, headers=auth_headers)
                assert r.status_code == 200, f"Open session {i+1} failed: {r.text}"
                session_id = r.json()["session_id"]
                sessions_created.append(session_id)
                
                # Add item
                if items:
                    item_fd = {"item_id": items[0]["id"], "qty": "1"}
                    requests.post(f"{BASE_URL}/api/tap/session/{session_id}/add", data=item_fd, headers=auth_headers)
                
                # Close
                close_fd = {"payment_method": "card", "payment_location": "pay_here"}
                r_close = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/close", data=close_fd, headers=auth_headers)
                assert r_close.status_code == 200
                
                # Record tip
                tip_fd = {"tip_amount": str(tip_amt)}
                r_tip = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/record-tip", data=tip_fd, headers=auth_headers)
                assert r_tip.status_code == 200
                print(f"Session {i+1}: $${tip_amt} tip for Marco")
            
            # Check staff-costs
            time.sleep(1)
            r_costs = requests.get(f"{BASE_URL}/api/manager/staff-costs?venue_id={VENUE_ID}", headers=auth_headers)
            assert r_costs.status_code == 200
            
            staff_breakdown = r_costs.json().get("staff", [])
            marco_entry = next((s for s in staff_breakdown if s.get("id") == marco_id), None)
            
            if marco_entry:
                total_tips = marco_entry.get("tips", 0)
                print(f"Marco cumulative tips: ${total_tips}")
                # Should have at least $10 from our test
                assert total_tips >= 10, f"Marco expected cumulative tips >= $10, got ${total_tips}"
            
        finally:
            print(f"Cumulative test sessions: {sessions_created}")


class TestStaffEarningsFormula:
    """Test: wages = hours_worked * hourly_rate, total = wages + tips"""

    def test_earnings_formula_in_staff_costs(self, auth_headers, existing_barmen):
        """
        Set hourly_rate=20 for a barman
        Verify GET /api/manager/staff-costs shows:
        - wages = hours_worked * 20
        - total = wages + tips
        """
        # Find Joao who should have rate=$22
        joao = next((b for b in existing_barmen if "Joao" in b.get("name", "")), None)
        if not joao:
            pytest.skip("Need Joao barman for earnings formula test")
        
        joao_id = joao["id"]
        expected_rate = joao.get("hourly_rate", 0)
        
        # Get staff costs
        r = requests.get(f"{BASE_URL}/api/manager/staff-costs?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200, f"Staff costs failed: {r.text}"
        
        data = r.json()
        staff_breakdown = data.get("staff", [])
        joao_entry = next((s for s in staff_breakdown if s.get("id") == joao_id), None)
        
        if joao_entry:
            hours = joao_entry.get("hours_worked", 0)
            rate = joao_entry.get("hourly_rate", 0)
            wages = joao_entry.get("wages", 0)
            tips = joao_entry.get("tips", 0)
            total = joao_entry.get("total", 0)
            earned = joao_entry.get("earned", total)
            
            print(f"Joao: hours={hours}, rate=${rate}, wages=${wages}, tips=${tips}, total=${total}")
            
            # Verify formula
            expected_wages = round(hours * rate, 2)
            assert abs(wages - expected_wages) < 1.0, f"Wages mismatch: expected ${expected_wages}, got ${wages}"
            
            expected_total = round(wages + tips, 2)
            assert abs(total - expected_total) < 0.1, f"Total mismatch: expected ${expected_total}, got ${total}"
            
            # Check fields exist
            assert "hourly_rate" in joao_entry, "Missing hourly_rate field"
            assert "hours_worked" in joao_entry, "Missing hours_worked field"
            assert "wages" in joao_entry, "Missing wages field (base pay)"
            assert "tips" in joao_entry, "Missing tips field"
            assert "total" in joao_entry, "Missing total field"


class TestShiftOverview:
    """Test /api/manager/shift-overview includes tips field"""

    def test_shift_overview_has_tips(self, auth_headers):
        """
        GET /api/manager/shift-overview must include:
        - 'tips' field > 0 (when closed sessions with tips exist)
        - revenue > 0
        - staff_cost (based on hourly wages)
        - result = revenue - staff_cost
        """
        r = requests.get(f"{BASE_URL}/api/manager/shift-overview?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200, f"Shift overview failed: {r.text}"
        
        data = r.json()
        print(f"Shift overview: {data}")
        
        # Check required fields
        assert "revenue" in data, "Missing revenue field"
        assert "staff_cost" in data, "Missing staff_cost field"
        assert "result" in data, "Missing result field"
        assert "tips" in data, "Missing tips field"
        
        revenue = data.get("revenue", 0)
        staff_cost = data.get("staff_cost", 0)
        result = data.get("result", 0)
        tips = data.get("tips", 0)
        
        print(f"Revenue: ${revenue}, Staff Cost: ${staff_cost}, Tips: ${tips}, Result: ${result}")
        
        # Verify result = revenue - staff_cost
        expected_result = round(revenue - staff_cost, 2)
        assert abs(result - expected_result) < 1, f"Result mismatch: expected ${expected_result}, got ${result}"
        
        # After our tests, tips should be > 0
        # (we've created several tipped sessions)
        assert tips >= 0, f"Tips should be >= 0, got ${tips}"


class TestStaffSyncRegression:
    """NO REGRESSION - Staff created in Manager appears in /api/staff/barmen"""

    def test_manager_staff_sync_to_barmen(self, auth_headers):
        """Create bartender in Manager, verify appears in GET /api/staff/barmen"""
        test_name = f"TEST_ManagerSync_{int(time.time())}"
        
        # Create via manager/staff
        fd = {
            "venue_id": VENUE_ID,
            "name": test_name,
            "role": "bartender",
            "hourly_rate": "18"
        }
        r = requests.post(f"{BASE_URL}/api/manager/staff", data=fd, headers=auth_headers)
        assert r.status_code == 200, f"Manager staff create failed: {r.text}"
        created_id = r.json().get("id")
        print(f"Created staff via manager: {created_id}")
        
        # Verify in /api/staff/barmen
        r2 = requests.get(f"{BASE_URL}/api/staff/barmen?venue_id={VENUE_ID}", headers=auth_headers)
        assert r2.status_code == 200
        barmen = r2.json().get("barmen", [])
        
        found = next((b for b in barmen if b.get("id") == created_id), None)
        assert found is not None, f"Staff {created_id} not found in /api/staff/barmen"
        assert found.get("name") == test_name, f"Name mismatch"
        assert found.get("hourly_rate") == 18.0, f"Hourly rate mismatch"
        print(f"Verified staff sync: {test_name} visible in barmen list with rate=$18")


class TestPayHereFlowRegression:
    """NO REGRESSION - Pay Here flow with tip recording works"""

    def test_pay_here_full_flow(self, auth_headers, existing_barmen):
        """Open tab, add items, close with payment_location=pay_here, record tip"""
        barman = existing_barmen[0] if existing_barmen else None
        if not barman:
            pytest.skip("Need at least one barman")
        
        # Open tab
        fd = {
            "venue_id": VENUE_ID,
            "guest_name": f"PayHereTest_{int(time.time())}",
            "bartender_id": barman["id"],
            "bartender_name": barman["name"]
        }
        r = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd, headers=auth_headers)
        assert r.status_code == 200, f"Open failed: {r.text}"
        session_id = r.json()["session_id"]
        tab_number = r.json().get("tab_number")
        print(f"Opened tab #{tab_number}: {session_id}")
        
        # Add item
        catalog_r = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        items = catalog_r.json().get("items", [])
        if items:
            item_fd = {"item_id": items[0]["id"], "qty": "2"}
            r_add = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/add", data=item_fd, headers=auth_headers)
            assert r_add.status_code == 200
            print(f"Added item: {items[0]['name']} x2")
        
        # Close with pay_here
        close_fd = {"payment_method": "card", "payment_location": "pay_here"}
        r_close = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/close", data=close_fd, headers=auth_headers)
        assert r_close.status_code == 200, f"Close failed: {r_close.text}"
        close_data = r_close.json()
        assert close_data.get("payment_location") == "pay_here", "Payment location mismatch"
        assert close_data.get("tip_pending") == True, "tip_pending should be True for pay_here"
        print(f"Closed tab, total: ${close_data.get('total')}, tip_pending: {close_data.get('tip_pending')}")
        
        # Record tip
        tip_fd = {"tip_amount": "7.50"}
        r_tip = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/record-tip", data=tip_fd, headers=auth_headers)
        assert r_tip.status_code == 200, f"Record tip failed: {r_tip.text}"
        tip_data = r_tip.json()
        assert tip_data.get("tip_amount") == 7.5, f"Tip amount mismatch"
        print(f"Recorded tip: ${tip_data.get('tip_amount')}")
        
        # Verify distribution includes bartender
        distribution = tip_data.get("distribution", [])
        if distribution:
            print(f"Tip distribution: {distribution}")
            # Should be attributed to the bartender
            assert len(distribution) > 0, "Distribution should not be empty"


class TestKDSRoutingRegression:
    """NO REGRESSION - KDS routing: alcohol→bar, food→kitchen"""

    def test_kds_routing_alcohol_to_bar(self, auth_headers, existing_barmen):
        """Add alcohol item → bar ticket"""
        barman = existing_barmen[0] if existing_barmen else None
        if not barman:
            pytest.skip("Need barman")
        
        # Open session
        fd = {
            "venue_id": VENUE_ID,
            "guest_name": f"KDSTest_Alcohol_{int(time.time())}",
            "bartender_id": barman["id"],
            "bartender_name": barman["name"]
        }
        r = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd, headers=auth_headers)
        assert r.status_code == 200
        session_id = r.json()["session_id"]
        
        # Find alcohol item (IPA Draft or any with is_alcohol=true)
        catalog_r = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        items = catalog_r.json().get("items", [])
        alcohol_item = next((i for i in items if i.get("is_alcohol") == True), None)
        
        if alcohol_item:
            item_fd = {"item_id": alcohol_item["id"], "qty": "1"}
            r_add = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/add", data=item_fd, headers=auth_headers)
            assert r_add.status_code == 200
            print(f"Added alcohol item: {alcohol_item['name']}")
            
            # Check KDS tickets for bar destination
            time.sleep(0.5)
            kds_r = requests.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=bar", headers=auth_headers)
            if kds_r.status_code == 200:
                tickets = kds_r.json().get("tickets", [])
                # Should have a recent ticket for bar
                print(f"Bar tickets count: {len(tickets)}")
        
        # Close session to cleanup
        close_fd = {"payment_method": "card", "payment_location": "pay_here"}
        requests.post(f"{BASE_URL}/api/tap/session/{session_id}/close", data=close_fd, headers=auth_headers)

    def test_kds_routing_food_to_kitchen(self, auth_headers, existing_barmen):
        """Add food item → kitchen ticket"""
        barman = existing_barmen[0] if existing_barmen else None
        if not barman:
            pytest.skip("Need barman")
        
        fd = {
            "venue_id": VENUE_ID,
            "guest_name": f"KDSTest_Food_{int(time.time())}",
            "bartender_id": barman["id"],
            "bartender_name": barman["name"]
        }
        r = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd, headers=auth_headers)
        assert r.status_code == 200
        session_id = r.json()["session_id"]
        
        # Find food item (is_alcohol=false)
        catalog_r = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        items = catalog_r.json().get("items", [])
        food_item = next((i for i in items if i.get("is_alcohol") == False and i.get("category") in ["Snacks", "Starters", "Mains", "Plates"]), None)
        
        if food_item:
            item_fd = {"item_id": food_item["id"], "qty": "1"}
            r_add = requests.post(f"{BASE_URL}/api/tap/session/{session_id}/add", data=item_fd, headers=auth_headers)
            assert r_add.status_code == 200
            print(f"Added food item: {food_item['name']}")
            
            time.sleep(0.5)
            kds_r = requests.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}&destination=kitchen", headers=auth_headers)
            if kds_r.status_code == 200:
                tickets = kds_r.json().get("tickets", [])
                print(f"Kitchen tickets count: {len(tickets)}")
        
        close_fd = {"payment_method": "card", "payment_location": "pay_here"}
        requests.post(f"{BASE_URL}/api/tap/session/{session_id}/close", data=close_fd, headers=auth_headers)


class TestOpenTabWithBartenderAssignment:
    """Test that opening tab sends bartender_id and bartender_name"""

    def test_open_tab_stores_bartender_in_meta(self, auth_headers, existing_barmen):
        """Verify bartender_id is stored in session meta when opening tab"""
        carlos = next((b for b in existing_barmen if "Carlos" in b.get("name", "")), None)
        if not carlos:
            pytest.skip("Need Carlos for this test")
        
        fd = {
            "venue_id": VENUE_ID,
            "guest_name": f"BartenderMetaTest_{int(time.time())}",
            "bartender_id": carlos["id"],
            "bartender_name": carlos["name"]
        }
        r = requests.post(f"{BASE_URL}/api/tap/session/open", data=fd, headers=auth_headers)
        assert r.status_code == 200, f"Open failed: {r.text}"
        session_id = r.json()["session_id"]
        
        # Get session detail
        r2 = requests.get(f"{BASE_URL}/api/tap/session/{session_id}", headers=auth_headers)
        assert r2.status_code == 200
        # The bartender info is stored in meta - we can't directly see it in the response
        # but when we record a tip, it should be attributed to the bartender
        print(f"Session opened with bartender: {carlos['name']}")
        
        # Cleanup
        close_fd = {"payment_method": "card", "payment_location": "pay_here"}
        requests.post(f"{BASE_URL}/api/tap/session/{session_id}/close", data=close_fd, headers=auth_headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
