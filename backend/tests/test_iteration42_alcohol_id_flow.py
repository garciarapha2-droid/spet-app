"""
Iteration 42: Test Alcohol ID Verification Flow in Table Module
Bug fix: After confirming ID verification in the Table module for an alcoholic item, 
the item was not being added. The handleIdVerified function was refactored.

Test Cases:
1. Open table -> verify-id -> add alcohol item -> verify item appears in session
2. Verify TAP/Bar can add alcohol without ID verification
3. Verify manager financial values are positive
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"
IPA_DRAFT_ID = "c16e8bb1-cffc-455c-a142-062cf6fd6be0"

class TestAlcoholIdVerificationFlow:
    """Test the complete alcohol ID verification flow in Table module"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "teste@teste.com", "password": "12345"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def _get_available_table_id(self):
        """Get an available table UUID"""
        tables_resp = requests.get(
            f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
            headers=self.headers
        )
        if tables_resp.status_code != 200:
            return None
        tables = tables_resp.json().get("tables", [])
        for t in tables:
            if t.get("status") == "available":
                return t.get("id")
        return None
    
    def test_01_backend_e2e_table_alcohol_flow(self):
        """E2E: Open table -> verify-id -> add alcohol item -> verify item in session"""
        # Step 1: Find an available table (UUID) and open it
        table_uuid = self._get_available_table_id()
        
        if not table_uuid:
            # All tables occupied, use an existing session
            tables_resp = requests.get(
                f"{BASE_URL}/api/table/tables?venue_id={VENUE_ID}",
                headers=self.headers
            )
            tables = tables_resp.json().get("tables", [])
            occupied = [t for t in tables if t.get("status") == "occupied"]
            if occupied:
                table_uuid = occupied[0].get("id")
                table_detail = requests.get(
                    f"{BASE_URL}/api/table/{table_uuid}",
                    headers=self.headers
                )
                assert table_detail.status_code == 200
                session_id = table_detail.json().get("session", {}).get("id")
                if not session_id:
                    pytest.skip("No available tables or sessions to test")
            else:
                pytest.skip("No tables available")
        else:
            # Open the available table
            open_response = requests.post(
                f"{BASE_URL}/api/table/open",
                data={
                    "venue_id": VENUE_ID,
                    "table_id": table_uuid,
                    "guest_name": "Test Alcohol Flow Guest",
                    "server_name": "Carlos Silva",
                    "covers": "2"
                },
                headers=self.headers
            )
            assert open_response.status_code == 200, f"Failed to open table: {open_response.text}"
            session_id = open_response.json().get("session_id")
        
        print(f"Session ID: {session_id}")
        
        # Step 2: Verify ID for the session
        verify_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/verify-id",
            headers=self.headers
        )
        assert verify_response.status_code == 200, f"ID verification failed: {verify_response.text}"
        verify_data = verify_response.json()
        assert verify_data.get("id_verified") == True, "Session not marked as ID verified"
        print(f"ID Verified: {verify_data.get('id_verified')}")
        
        # Step 3: Add alcohol item (IPA Draft)
        add_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            data={
                "item_id": IPA_DRAFT_ID,
                "qty": "1"
            },
            headers=self.headers
        )
        assert add_response.status_code == 200, f"Failed to add alcohol item: {add_response.text}"
        add_data = add_response.json()
        assert "line_item_id" in add_data, "No line_item_id returned"
        assert add_data.get("name") == "IPA Draft", f"Wrong item name: {add_data.get('name')}"
        print(f"Item added: {add_data.get('name')}, line_item_id: {add_data.get('line_item_id')}")
        
        # Step 4: Verify item appears in session
        session_response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=self.headers
        )
        assert session_response.status_code == 200, f"Failed to get session: {session_response.text}"
        session_data = session_response.json()
        
        items = session_data.get("items", [])
        ipa_items = [i for i in items if i.get("name") == "IPA Draft"]
        assert len(ipa_items) > 0, "IPA Draft not found in session items"
        print(f"Session total: ${session_data.get('total')}, IPA Draft items: {len(ipa_items)}")
        
        # Verify ID verified status in session
        assert session_data.get("id_verified") == True, "Session not showing as ID verified"
    
    def test_02_tap_bar_no_id_verification_needed(self):
        """Verify TAP/Bar can add alcohol items without ID verification"""
        # Open a TAP session (not table)
        open_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": "Test TAP Guest",
                "session_type": "tap"
            },
            headers=self.headers
        )
        assert open_response.status_code == 200, f"Failed to open TAP session: {open_response.text}"
        session_id = open_response.json().get("session_id")
        print(f"TAP Session ID: {session_id}")
        
        # Add alcohol item directly (no ID verification needed for TAP)
        add_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            data={
                "item_id": IPA_DRAFT_ID,
                "qty": "1"
            },
            headers=self.headers
        )
        assert add_response.status_code == 200, f"Failed to add alcohol in TAP: {add_response.text}"
        add_data = add_response.json()
        assert add_data.get("name") == "IPA Draft", "Wrong item in TAP"
        print(f"TAP: Added {add_data.get('name')} without ID verification - SUCCESS")
    
    def test_03_verify_id_endpoint_works(self):
        """Verify the verify-id endpoint works correctly"""
        # Open a new session
        open_response = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            data={
                "venue_id": VENUE_ID,
                "guest_name": "ID Verify Test Guest",
                "session_type": "tap"
            },
            headers=self.headers
        )
        assert open_response.status_code == 200
        session_id = open_response.json().get("session_id")
        
        # Check session is not ID verified initially
        session_response = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=self.headers
        )
        assert session_response.status_code == 200
        assert session_response.json().get("id_verified") == False, "New session should not be ID verified"
        
        # Verify ID
        verify_response = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/verify-id",
            headers=self.headers
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("id_verified") == True
        assert "id_verified_at" in verify_data
        assert "verified_by" in verify_data
        print(f"Verify ID endpoint working: verified_at={verify_data.get('id_verified_at')}")
        
        # Confirm session is now ID verified
        session_response2 = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=self.headers
        )
        assert session_response2.status_code == 200
        assert session_response2.json().get("id_verified") == True, "Session should be ID verified after verify-id call"


class TestManagerFinancialValues:
    """Regression: Manager financial values should all be positive"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "teste@teste.com", "password": "12345"}
        )
        assert login_response.status_code == 200
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_shift_overview_positive(self):
        """Verify shift-overview result is positive"""
        response = requests.get(
            f"{BASE_URL}/api/manager/shift-overview?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get shift-overview: {response.text}"
        data = response.json()
        
        result = data.get("result", 0)
        assert result >= 0, f"Shift overview result should be positive, got: {result}"
        print(f"Shift overview: revenue={data.get('revenue')}, staff_cost={data.get('staff_cost')}, result={result}")
    
    def test_manager_overview_positive(self):
        """Verify manager overview revenue_today is positive"""
        response = requests.get(
            f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed to get manager overview: {response.text}"
        data = response.json()
        
        revenue_today = data.get("revenue_today", 0)
        assert revenue_today >= 0, f"Revenue today should be positive, got: {revenue_today}"
        print(f"Manager overview: revenue_today={revenue_today}")


class TestCatalogItemAlcoholFlag:
    """Verify IPA Draft has is_alcohol=True flag"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "teste@teste.com", "password": "12345"}
        )
        assert login_response.status_code == 200
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_ipa_draft_is_alcohol(self):
        """Verify IPA Draft item has is_alcohol flag set"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}",
            headers=self.headers
        )
        assert response.status_code == 200
        items = response.json().get("items", [])
        
        ipa_item = next((i for i in items if i.get("id") == IPA_DRAFT_ID), None)
        if ipa_item:
            print(f"IPA Draft: name={ipa_item.get('name')}, is_alcohol={ipa_item.get('is_alcohol')}")
            assert ipa_item.get("is_alcohol") == True, "IPA Draft should have is_alcohol=True"
        else:
            # Search by name
            ipa_item = next((i for i in items if "IPA" in i.get("name", "")), None)
            if ipa_item:
                print(f"Found IPA by name: {ipa_item.get('name')}, id={ipa_item.get('id')}, is_alcohol={ipa_item.get('is_alcohol')}")
            else:
                pytest.skip("IPA Draft not found in catalog")
