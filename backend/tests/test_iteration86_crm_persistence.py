"""
Iteration 86: CRM + Pipeline + Customer Base with REAL PostgreSQL persistence
Tests: Deals CRUD, Activities CRUD, Customers CRUD, Mark as Won flow
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
NON_CEO_EMAIL = "teste@teste.com"
NON_CEO_PASSWORD = "12345"


@pytest.fixture(scope="module")
def ceo_token():
    """Get CEO authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": CEO_EMAIL,
        "password": CEO_PASSWORD
    })
    assert response.status_code == 200, f"CEO login failed: {response.text}"
    data = response.json()
    # API returns access_token in data envelope
    token = data.get("data", {}).get("access_token") or data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture(scope="module")
def non_ceo_token():
    """Get non-CEO authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": NON_CEO_EMAIL,
        "password": NON_CEO_PASSWORD
    })
    assert response.status_code == 200, f"Non-CEO login failed: {response.text}"
    data = response.json()
    # API returns access_token in data envelope
    token = data.get("data", {}).get("access_token") or data.get("access_token") or data.get("token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture
def ceo_headers(ceo_token):
    """Headers with CEO auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ceo_token}"
    }


@pytest.fixture
def non_ceo_headers(non_ceo_token):
    """Headers with non-CEO auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {non_ceo_token}"
    }


class TestCeoLogin:
    """Test CEO login and role verification"""
    
    def test_ceo_login_success(self):
        """CEO user can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        # Check envelope format
        assert data.get("success") == True or "token" in data or "data" in data
        user_data = data.get("data", {}).get("user") or data.get("user", {})
        assert user_data.get("role") == "CEO", f"Expected CEO role, got: {user_data}"
    
    def test_non_ceo_login_success(self):
        """Non-CEO user can login but has USER role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": NON_CEO_EMAIL,
            "password": NON_CEO_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        user_data = data.get("data", {}).get("user") or data.get("user", {})
        assert user_data.get("role") != "CEO", f"Non-CEO user should not have CEO role: {user_data}"


class TestDealsAPI:
    """Test /api/crm/deals endpoints"""
    
    def test_list_deals(self, ceo_headers):
        """GET /api/crm/deals returns list of deals from Postgres"""
        response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        # Handle envelope format
        deals = data.get("data", {}).get("deals") or data.get("deals", [])
        assert isinstance(deals, list), f"Expected list of deals, got: {type(deals)}"
        assert len(deals) >= 5, f"Expected at least 5 seeded deals, got {len(deals)}"
        
        # Verify deal structure
        if deals:
            deal = deals[0]
            required_fields = ["id", "contact_name", "contact_email", "company_name", "plan_id", "stage", "deal_value"]
            for field in required_fields:
                assert field in deal, f"Missing field '{field}' in deal: {deal}"
    
    def test_list_deals_by_stage(self, ceo_headers):
        """GET /api/crm/deals?stage=lead filters by stage"""
        response = requests.get(f"{BASE_URL}/api/crm/deals?stage=lead", headers=ceo_headers)
        assert response.status_code == 200
        data = response.json()
        deals = data.get("data", {}).get("deals") or data.get("deals", [])
        # All returned deals should be in 'lead' stage
        for deal in deals:
            assert deal.get("stage") == "lead", f"Expected stage 'lead', got: {deal.get('stage')}"
    
    def test_get_deal_by_id(self, ceo_headers):
        """GET /api/crm/deals/:id returns single deal with activities"""
        # First get list to find a deal ID
        list_response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        assert len(deals) > 0, "No deals found"
        
        deal_id = deals[0]["id"]
        response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        deal = data.get("data") or data
        
        assert deal.get("id") == deal_id
        assert "activities" in deal, "Deal should include activities array"
        assert isinstance(deal.get("activities"), list)
    
    def test_update_deal(self, ceo_headers):
        """PUT /api/crm/deals/:id updates deal and persists"""
        # Get a deal
        list_response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        deal = deals[0]
        deal_id = deal["id"]
        
        # Update notes
        new_notes = f"TEST_Updated notes at {time.time()}"
        update_response = requests.put(
            f"{BASE_URL}/api/crm/deals/{deal_id}",
            headers=ceo_headers,
            json={"notes": new_notes}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify persistence by fetching again
        verify_response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        updated_deal = verify_response.json().get("data") or verify_response.json()
        assert updated_deal.get("notes") == new_notes, f"Notes not persisted: {updated_deal.get('notes')}"
    
    def test_update_deal_stage(self, ceo_headers):
        """PUT /api/crm/deals/:id can update stage"""
        # Get a deal in 'lead' stage
        list_response = requests.get(f"{BASE_URL}/api/crm/deals?stage=lead", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        
        if not deals:
            pytest.skip("No deals in 'lead' stage to test")
        
        deal_id = deals[0]["id"]
        
        # Update to qualified
        update_response = requests.put(
            f"{BASE_URL}/api/crm/deals/{deal_id}",
            headers=ceo_headers,
            json={"stage": "qualified"}
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        updated_deal = verify_response.json().get("data") or verify_response.json()
        assert updated_deal.get("stage") == "qualified"
        
        # Revert back to lead
        requests.put(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers, json={"stage": "lead"})


class TestActivitiesAPI:
    """Test deal activities CRUD"""
    
    def test_add_activity(self, ceo_headers):
        """POST /api/crm/deals/:id/activities creates activity"""
        # Get a deal
        list_response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        deal_id = deals[0]["id"]
        
        # Add activity
        activity_data = {
            "type": "call",
            "description": f"TEST_Activity created at {time.time()}"
        }
        response = requests.post(
            f"{BASE_URL}/api/crm/deals/{deal_id}/activities",
            headers=ceo_headers,
            json=activity_data
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        activity = data.get("data") or data
        
        assert activity.get("type") == "call"
        assert "TEST_Activity" in activity.get("description", "")
        assert "id" in activity
        
        return activity.get("id")
    
    def test_activity_appears_in_deal(self, ceo_headers):
        """Activity appears in deal's activities list"""
        # Get a deal
        list_response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        deal_id = deals[0]["id"]
        
        # Add activity
        activity_data = {
            "type": "meeting",
            "description": f"TEST_Meeting at {time.time()}"
        }
        requests.post(f"{BASE_URL}/api/crm/deals/{deal_id}/activities", headers=ceo_headers, json=activity_data)
        
        # Fetch deal and check activities
        deal_response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        deal = deal_response.json().get("data") or deal_response.json()
        activities = deal.get("activities", [])
        
        # Find our test activity
        test_activities = [a for a in activities if "TEST_Meeting" in a.get("description", "")]
        assert len(test_activities) > 0, f"Test activity not found in deal activities: {activities}"
    
    def test_update_activity(self, ceo_headers):
        """PUT /api/crm/activities/:id updates activity"""
        # Get a deal with activities
        list_response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        deal_id = deals[0]["id"]
        
        # Add activity first
        activity_data = {"type": "note", "description": "TEST_Original description"}
        add_response = requests.post(f"{BASE_URL}/api/crm/deals/{deal_id}/activities", headers=ceo_headers, json=activity_data)
        activity = add_response.json().get("data") or add_response.json()
        activity_id = activity.get("id")
        
        # Update activity
        new_description = f"TEST_Updated description at {time.time()}"
        update_response = requests.put(
            f"{BASE_URL}/api/crm/activities/{activity_id}",
            headers=ceo_headers,
            json={"description": new_description}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify by fetching deal
        deal_response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        deal = deal_response.json().get("data") or deal_response.json()
        activities = deal.get("activities", [])
        updated_activity = next((a for a in activities if a.get("id") == activity_id), None)
        assert updated_activity is not None, "Activity not found after update"
        assert updated_activity.get("description") == new_description
    
    def test_delete_activity(self, ceo_headers):
        """DELETE /api/crm/activities/:id removes activity"""
        # Get a deal
        list_response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        deal_id = deals[0]["id"]
        
        # Add activity
        activity_data = {"type": "note", "description": "TEST_To be deleted"}
        add_response = requests.post(f"{BASE_URL}/api/crm/deals/{deal_id}/activities", headers=ceo_headers, json=activity_data)
        activity = add_response.json().get("data") or add_response.json()
        activity_id = activity.get("id")
        
        # Delete activity
        delete_response = requests.delete(f"{BASE_URL}/api/crm/activities/{activity_id}", headers=ceo_headers)
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify deletion
        deal_response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        deal = deal_response.json().get("data") or deal_response.json()
        activities = deal.get("activities", [])
        deleted_activity = next((a for a in activities if a.get("id") == activity_id), None)
        assert deleted_activity is None, "Activity should be deleted"


class TestCustomersAPI:
    """Test /api/crm/customers endpoints"""
    
    def test_list_customers(self, ceo_headers):
        """GET /api/crm/customers returns customers from Postgres"""
        response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        customers = data.get("data", {}).get("customers") or data.get("customers", [])
        assert isinstance(customers, list)
        
        # Should have at least BrewHouse POA from seed data
        if customers:
            customer = customers[0]
            required_fields = ["id", "company_name", "contact_name", "contact_email", "plan_id", "status", "mrr"]
            for field in required_fields:
                assert field in customer, f"Missing field '{field}' in customer: {customer}"
    
    def test_list_customers_filter_status(self, ceo_headers):
        """GET /api/crm/customers?status=active filters by status"""
        response = requests.get(f"{BASE_URL}/api/crm/customers?status=active", headers=ceo_headers)
        assert response.status_code == 200
        data = response.json()
        customers = data.get("data", {}).get("customers") or data.get("customers", [])
        
        for customer in customers:
            assert customer.get("status") == "active", f"Expected active status, got: {customer.get('status')}"
    
    def test_list_customers_filter_plan(self, ceo_headers):
        """GET /api/crm/customers?plan_id=core filters by plan"""
        response = requests.get(f"{BASE_URL}/api/crm/customers?plan_id=core", headers=ceo_headers)
        assert response.status_code == 200
        data = response.json()
        customers = data.get("data", {}).get("customers") or data.get("customers", [])
        
        for customer in customers:
            assert customer.get("plan_id") == "core", f"Expected core plan, got: {customer.get('plan_id')}"
    
    def test_list_customers_search(self, ceo_headers):
        """GET /api/crm/customers?search=brew searches by company name"""
        response = requests.get(f"{BASE_URL}/api/crm/customers?search=brew", headers=ceo_headers)
        assert response.status_code == 200
        data = response.json()
        customers = data.get("data", {}).get("customers") or data.get("customers", [])
        
        # If BrewHouse exists, it should be found
        if customers:
            found_brew = any("brew" in c.get("company_name", "").lower() for c in customers)
            assert found_brew, f"Search for 'brew' should find BrewHouse: {customers}"
    
    def test_update_customer(self, ceo_headers):
        """PUT /api/crm/customers/:id updates customer"""
        # Get a customer
        list_response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        customers = list_response.json().get("data", {}).get("customers") or list_response.json().get("customers", [])
        
        if not customers:
            pytest.skip("No customers to test update")
        
        customer_id = customers[0]["id"]
        original_notes = customers[0].get("notes", "")
        
        # Update notes
        new_notes = f"TEST_Customer notes at {time.time()}"
        update_response = requests.put(
            f"{BASE_URL}/api/crm/customers/{customer_id}",
            headers=ceo_headers,
            json={"notes": new_notes}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        # Verify persistence
        verify_response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        customers = verify_response.json().get("data", {}).get("customers") or verify_response.json().get("customers", [])
        updated_customer = next((c for c in customers if c.get("id") == customer_id), None)
        assert updated_customer is not None
        assert updated_customer.get("notes") == new_notes
        
        # Revert
        requests.put(f"{BASE_URL}/api/crm/customers/{customer_id}", headers=ceo_headers, json={"notes": original_notes})
    
    def test_update_customer_status(self, ceo_headers):
        """PUT /api/crm/customers/:id can update status"""
        list_response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        customers = list_response.json().get("data", {}).get("customers") or list_response.json().get("customers", [])
        
        if not customers:
            pytest.skip("No customers to test")
        
        customer_id = customers[0]["id"]
        original_status = customers[0].get("status")
        
        # Update to paused
        update_response = requests.put(
            f"{BASE_URL}/api/crm/customers/{customer_id}",
            headers=ceo_headers,
            json={"status": "paused"}
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        customers = verify_response.json().get("data", {}).get("customers") or verify_response.json().get("customers", [])
        updated_customer = next((c for c in customers if c.get("id") == customer_id), None)
        assert updated_customer.get("status") == "paused"
        
        # Revert
        requests.put(f"{BASE_URL}/api/crm/customers/{customer_id}", headers=ceo_headers, json={"status": original_status or "active"})
    
    def test_update_customer_modules(self, ceo_headers):
        """PUT /api/crm/customers/:id can update modules_enabled"""
        list_response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        customers = list_response.json().get("data", {}).get("customers") or list_response.json().get("customers", [])
        
        if not customers:
            pytest.skip("No customers to test")
        
        customer_id = customers[0]["id"]
        original_modules = customers[0].get("modules_enabled", [])
        
        # Update modules
        new_modules = ["pulse", "tap", "table", "kds"]
        update_response = requests.put(
            f"{BASE_URL}/api/crm/customers/{customer_id}",
            headers=ceo_headers,
            json={"modules_enabled": new_modules}
        )
        assert update_response.status_code == 200
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        customers = verify_response.json().get("data", {}).get("customers") or verify_response.json().get("customers", [])
        updated_customer = next((c for c in customers if c.get("id") == customer_id), None)
        assert set(updated_customer.get("modules_enabled", [])) == set(new_modules)
        
        # Revert
        requests.put(f"{BASE_URL}/api/crm/customers/{customer_id}", headers=ceo_headers, json={"modules_enabled": original_modules})


class TestMarkAsWonFlow:
    """Test the Mark as Won flow: deal -> customer creation"""
    
    def test_create_deal_and_mark_as_won(self, ceo_headers):
        """POST /api/crm/deals/:id/won marks deal as won and creates customer"""
        # Create a new test deal
        deal_data = {
            "contact_name": "TEST_Won Contact",
            "contact_email": f"test_won_{int(time.time())}@test.com",
            "contact_phone": "+1234567890",
            "company_name": f"TEST_Won Company {int(time.time())}",
            "address": "123 Test St",
            "plan_id": "flow",
            "stage": "negotiation",
            "deal_value": 299,
            "notes": "Test deal for Mark as Won"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/crm/deals", headers=ceo_headers, json=deal_data)
        assert create_response.status_code == 200, f"Create deal failed: {create_response.text}"
        deal = create_response.json().get("data") or create_response.json()
        deal_id = deal.get("id")
        
        # Mark as Won
        won_response = requests.post(f"{BASE_URL}/api/crm/deals/{deal_id}/won", headers=ceo_headers)
        assert won_response.status_code == 200, f"Mark as Won failed: {won_response.text}"
        won_data = won_response.json()
        
        # Check response includes customer
        customer = won_data.get("data", {}).get("customer") or won_data.get("customer")
        assert customer is not None, f"No customer in response: {won_data}"
        assert customer.get("company_name") == deal_data["company_name"]
        assert customer.get("status") == "active"
        
        # Verify deal is now closed_won
        deal_response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        updated_deal = deal_response.json().get("data") or deal_response.json()
        assert updated_deal.get("stage") == "closed_won"
        
        # Verify customer appears in customers list
        customers_response = requests.get(f"{BASE_URL}/api/crm/customers", headers=ceo_headers)
        customers = customers_response.json().get("data", {}).get("customers") or customers_response.json().get("customers", [])
        new_customer = next((c for c in customers if c.get("company_name") == deal_data["company_name"]), None)
        assert new_customer is not None, f"New customer not found in list: {[c.get('company_name') for c in customers]}"
        
        # Verify customer has correct modules for 'flow' plan
        expected_modules = ["pulse", "tap", "table"]
        assert set(new_customer.get("modules_enabled", [])) == set(expected_modules), f"Wrong modules: {new_customer.get('modules_enabled')}"
    
    def test_mark_as_won_already_won_fails(self, ceo_headers):
        """POST /api/crm/deals/:id/won on already won deal returns 400"""
        # Get a closed_won deal
        list_response = requests.get(f"{BASE_URL}/api/crm/deals?stage=closed_won", headers=ceo_headers)
        deals = list_response.json().get("data", {}).get("deals") or list_response.json().get("deals", [])
        
        if not deals:
            pytest.skip("No closed_won deals to test")
        
        deal_id = deals[0]["id"]
        
        # Try to mark as won again
        response = requests.post(f"{BASE_URL}/api/crm/deals/{deal_id}/won", headers=ceo_headers)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"


class TestMarkAsLostFlow:
    """Test the Mark as Lost flow"""
    
    def test_mark_deal_as_lost(self, ceo_headers):
        """POST /api/crm/deals/:id/lost marks deal as lost"""
        # Create a test deal
        deal_data = {
            "contact_name": "TEST_Lost Contact",
            "contact_email": f"test_lost_{int(time.time())}@test.com",
            "company_name": f"TEST_Lost Company {int(time.time())}",
            "plan_id": "core",
            "stage": "proposal",
            "deal_value": 149
        }
        
        create_response = requests.post(f"{BASE_URL}/api/crm/deals", headers=ceo_headers, json=deal_data)
        deal = create_response.json().get("data") or create_response.json()
        deal_id = deal.get("id")
        
        # Mark as Lost
        lost_response = requests.post(f"{BASE_URL}/api/crm/deals/{deal_id}/lost", headers=ceo_headers)
        assert lost_response.status_code == 200, f"Mark as Lost failed: {lost_response.text}"
        
        # Verify deal is now closed_lost
        deal_response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=ceo_headers)
        updated_deal = deal_response.json().get("data") or deal_response.json()
        assert updated_deal.get("stage") == "closed_lost"
        
        # Verify activity was logged
        activities = updated_deal.get("activities", [])
        lost_activity = next((a for a in activities if "LOST" in a.get("description", "")), None)
        assert lost_activity is not None, f"Lost activity not logged: {activities}"


class TestKanbanStageDistribution:
    """Test that deals are distributed across kanban stages"""
    
    def test_deals_in_multiple_stages(self, ceo_headers):
        """Verify deals exist in multiple stages for kanban display"""
        response = requests.get(f"{BASE_URL}/api/crm/deals", headers=ceo_headers)
        deals = response.json().get("data", {}).get("deals") or response.json().get("deals", [])
        
        # Count deals by stage
        stage_counts = {}
        for deal in deals:
            stage = deal.get("stage")
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
        
        print(f"Stage distribution: {stage_counts}")
        
        # Should have deals in at least 3 different stages (from seed data)
        visible_stages = ["lead", "qualified", "proposal", "negotiation", "closed_won"]
        visible_count = sum(1 for s in visible_stages if stage_counts.get(s, 0) > 0)
        assert visible_count >= 3, f"Expected deals in at least 3 stages, got: {stage_counts}"


class TestAuthRequired:
    """Test that CRM endpoints require authentication"""
    
    def test_deals_requires_auth(self):
        """GET /api/crm/deals without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/crm/deals")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_customers_requires_auth(self):
        """GET /api/crm/customers without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/crm/customers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
