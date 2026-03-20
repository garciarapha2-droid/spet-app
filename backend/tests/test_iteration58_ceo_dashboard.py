"""
Iteration 58: CEO Dashboard Premium UX Testing
Tests all CEO dashboard sections: CRM, Health, Revenue, Companies, Modules, Users, Alerts, Pipeline
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://emergent-debug-12.preview.emergentagent.com')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
REGULAR_EMAIL = "teste@teste.com"
REGULAR_PASSWORD = "12345"


@pytest.fixture(scope="module")
def ceo_token():
    """Get CEO authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("CEO authentication failed")


@pytest.fixture(scope="module")
def regular_token():
    """Get regular user authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": REGULAR_EMAIL, "password": REGULAR_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Regular user authentication failed")


class TestCEOAuthentication:
    """Test CEO authentication and access control"""
    
    def test_ceo_login_success(self):
        """CEO user can login successfully"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": CEO_EMAIL, "password": CEO_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        user = data.get("user", {})
        assert user.get("role") == "CEO"
        print(f"PASS: CEO login successful, role={user.get('role')}")
    
    def test_regular_user_denied_ceo_endpoints(self, regular_token):
        """Regular users should get 403 on CEO endpoints"""
        headers = {"Authorization": f"Bearer {regular_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/health", headers=headers)
        assert response.status_code == 403
        print(f"PASS: Regular user correctly denied CEO access (403)")


class TestCEOHealthSection:
    """Test Business Health section APIs"""
    
    def test_get_health_kpis(self, ceo_token):
        """Get business health KPIs"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/health", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "kpis" in data
        kpis = data["kpis"]
        # Validate expected KPI fields
        expected_fields = ["mrr", "gross_revenue", "active_companies", "active_venues", 
                         "churn_rate", "activation_rate", "growth_pct", "revenue_today", "revenue_ytd"]
        for field in expected_fields:
            assert field in kpis, f"Missing KPI field: {field}"
        print(f"PASS: Health KPIs returned with MRR=${kpis.get('mrr', 0)}, Customers={kpis.get('active_companies', 0)}")
    
    def test_get_kpi_breakdown_mrr(self, ceo_token):
        """Get MRR breakdown by venue"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/kpi-breakdown", headers=headers, params={"kpi": "mrr"})
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "venues" in data
        print(f"PASS: MRR breakdown returned, total=${data.get('total', 0)}, venues={len(data.get('venues', []))}")


class TestCEORevenueSection:
    """Test Revenue section APIs"""
    
    def test_get_revenue_default_month(self, ceo_token):
        """Get revenue chart data for default period (month)"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/revenue", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "chart" in data
        assert "period" in data
        print(f"PASS: Revenue chart returned, period={data.get('period')}, data_points={len(data.get('chart', []))}")
    
    def test_get_revenue_week(self, ceo_token):
        """Get revenue chart data for week"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/revenue", headers=headers, params={"period": "week"})
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "week"
        print(f"PASS: Weekly revenue returned, data_points={len(data.get('chart', []))}")
    
    def test_get_revenue_year(self, ceo_token):
        """Get revenue chart data for year"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/revenue", headers=headers, params={"period": "year"})
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "year"
        print(f"PASS: Yearly revenue returned, data_points={len(data.get('chart', []))}")


class TestCEOTargetsSection:
    """Test Targets/Goals section APIs"""
    
    def test_get_targets(self, ceo_token):
        """Get CEO targets and progress"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/targets", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "targets" in data
        targets = data["targets"]
        # Validate target periods
        for period in ["weekly", "monthly", "annual"]:
            assert period in targets, f"Missing target period: {period}"
            assert "goal" in targets[period]
            assert "actual" in targets[period]
            assert "pct" in targets[period]
        print(f"PASS: Targets returned - Weekly: {targets['weekly'].get('pct', 0)}%, Monthly: {targets['monthly'].get('pct', 0)}%")
    
    def test_update_targets(self, ceo_token):
        """Update CEO targets"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        form_data = {
            "weekly_value": 15000,
            "weekly_type": "revenue",
            "monthly_value": 60000,
            "monthly_type": "revenue"
        }
        response = requests.post(f"{BASE_URL}/api/ceo/targets", headers=headers, data=form_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "updated"
        print(f"PASS: Targets updated successfully")


class TestCEOCompaniesSection:
    """Test Companies section APIs"""
    
    def test_get_companies(self, ceo_token):
        """Get all companies with venues and MRR"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/companies", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        companies = data["companies"]
        if companies:
            company = companies[0]
            assert "user_id" in company
            assert "email" in company
            assert "mrr" in company
            assert "venues" in company
            assert "status" in company
        print(f"PASS: Companies returned, total={data.get('total', 0)}")


class TestCEOModulesSection:
    """Test Modules Adoption section APIs"""
    
    def test_get_modules(self, ceo_token):
        """Get module adoption metrics"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/modules", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "modules" in data
        assert "total_venues" in data
        modules = data["modules"]
        # Validate expected modules
        module_keys = [m.get("key") for m in modules]
        for expected in ["pulse", "tap", "table", "kds"]:
            assert expected in module_keys, f"Missing module: {expected}"
        # Check adoption data structure
        if modules:
            module = modules[0]
            assert "name" in module
            assert "active" in module
            assert "adoption_pct" in module
        print(f"PASS: Modules returned, total_venues={data.get('total_venues', 0)}")


class TestCEOUsersSection:
    """Test Users section APIs"""
    
    def test_get_users(self, ceo_token):
        """Get all users with roles"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/users", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        users = data["users"]
        if users:
            user = users[0]
            assert "id" in user
            assert "email" in user
            assert "status" in user
            assert "roles" in user
        print(f"PASS: Users returned, total={len(users)}")
    
    def test_create_and_delete_user(self, ceo_token):
        """Create and delete a test user"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        # Create user
        test_email = "test_iter58@example.com"
        form_data = {
            "email": test_email,
            "password": "testpass123",
            "role": "server"
        }
        response = requests.post(f"{BASE_URL}/api/ceo/users", headers=headers, data=form_data)
        # May already exist or succeed
        if response.status_code == 400:
            print(f"PASS: User creation correctly rejected (already exists)")
            return
        assert response.status_code == 200
        data = response.json()
        user_id = data.get("user_id")
        print(f"PASS: User created with id={user_id}")
        
        # Delete user
        if user_id:
            response = requests.delete(f"{BASE_URL}/api/ceo/users/{user_id}", headers=headers)
            assert response.status_code == 200
            print(f"PASS: Test user deleted")


class TestCEOAlertsSection:
    """Test Risk & Alerts section APIs"""
    
    def test_get_alerts(self, ceo_token):
        """Get risk alerts"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/alerts", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        assert "total" in data
        alerts = data["alerts"]
        if alerts:
            alert = alerts[0]
            assert "type" in alert
            assert "severity" in alert
            assert "message" in alert
        print(f"PASS: Alerts returned, total={data.get('total', 0)}")


class TestCEOPipelineSection:
    """Test Growth Pipeline section APIs"""
    
    def test_get_pipeline(self, ceo_token):
        """Get growth funnel data"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/pipeline", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "pipeline" in data
        pipeline = data["pipeline"]
        expected_stages = ["leads", "paid", "activated", "active", "at_risk", "cancelled"]
        for stage in expected_stages:
            assert stage in pipeline, f"Missing pipeline stage: {stage}"
        print(f"PASS: Pipeline returned - Leads={pipeline.get('leads', 0)}, Active={pipeline.get('active', 0)}")


class TestCEOCRMSection:
    """Test CRM/Leads section APIs"""
    
    def test_get_leads(self, ceo_token):
        """Get all leads"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/leads", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "leads" in data
        assert "total" in data
        leads = data["leads"]
        if leads:
            lead = leads[0]
            assert "id" in lead
            assert "full_name" in lead
            assert "email" in lead
            assert "status" in lead
            assert "payment_status" in lead
            assert "source" in lead
        print(f"PASS: Leads returned, total={data.get('total', 0)}")
    
    def test_update_lead_status(self, ceo_token):
        """Update lead status"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        # First get a lead
        response = requests.get(f"{BASE_URL}/api/ceo/leads", headers=headers)
        leads = response.json().get("leads", [])
        if not leads:
            pytest.skip("No leads to test")
        
        lead_id = leads[0]["id"]
        original_status = leads[0].get("status", "new")
        
        # Update to contacted
        form_data = {"status": "contacted"}
        response = requests.put(f"{BASE_URL}/api/ceo/leads/{lead_id}/status", headers=headers, data=form_data)
        assert response.status_code == 200
        print(f"PASS: Lead status updated from {original_status} to contacted")
        
        # Restore original status
        form_data = {"status": original_status}
        requests.put(f"{BASE_URL}/api/ceo/leads/{lead_id}/status", headers=headers, data=form_data)


class TestCEOCompanyManagement:
    """Test company status and module management"""
    
    def test_get_companies_with_modules(self, ceo_token):
        """Verify company data includes modules"""
        headers = {"Authorization": f"Bearer {ceo_token}"}
        response = requests.get(f"{BASE_URL}/api/ceo/companies", headers=headers)
        data = response.json()
        companies = data.get("companies", [])
        if companies:
            company = companies[0]
            venues = company.get("venues", [])
            if venues:
                venue = venues[0]
                assert "modules" in venue
                print(f"PASS: Company venues have modules: {venue.get('modules', [])}")
            else:
                print(f"PASS: Company found but no venues")
        else:
            print(f"PASS: No companies to verify modules (empty list)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
