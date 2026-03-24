"""
Iteration 87: CEO Analytics Migration Tests
Tests for Security, Reports, Revenue Targets analytics endpoints
and Customer detail endpoint - all from real PostgreSQL data.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"


@pytest.fixture(scope="module")
def auth_token():
    """Get CEO authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": CEO_EMAIL,
        "password": CEO_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    # Token is at response.data.access_token
    token = data.get("data", {}).get("access_token") or data.get("access_token")
    assert token, f"No token in response: {data}"
    return token


@pytest.fixture
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }


class TestSecurityAnalytics:
    """Tests for GET /api/crm/analytics/security endpoint"""
    
    def test_security_analytics_returns_200(self, auth_headers):
        """Security analytics endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/security", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_security_analytics_has_alerts(self, auth_headers):
        """Security analytics returns alerts array"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/security", headers=auth_headers)
        data = response.json()
        # API wraps in {success, data}
        result = data.get("data", data)
        assert "alerts" in result, f"Missing 'alerts' in response: {result.keys()}"
        assert isinstance(result["alerts"], list), "alerts should be a list"
    
    def test_security_analytics_has_risk_score(self, auth_headers):
        """Security analytics returns risk_score"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/security", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "risk_score" in result, f"Missing 'risk_score' in response: {result.keys()}"
        assert isinstance(result["risk_score"], (int, float)), "risk_score should be numeric"
        assert 0 <= result["risk_score"] <= 100, f"risk_score should be 0-100, got {result['risk_score']}"
    
    def test_security_analytics_has_module_usage(self, auth_headers):
        """Security analytics returns module_usage array"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/security", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "module_usage" in result, f"Missing 'module_usage' in response: {result.keys()}"
        assert isinstance(result["module_usage"], list), "module_usage should be a list"
        # Each module should have module name and percentage
        if result["module_usage"]:
            first = result["module_usage"][0]
            assert "module" in first, "module_usage item should have 'module'"
            assert "percentage" in first, "module_usage item should have 'percentage'"
    
    def test_security_analytics_has_summary(self, auth_headers):
        """Security analytics returns summary with counts"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/security", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "summary" in result, f"Missing 'summary' in response: {result.keys()}"
        summary = result["summary"]
        assert "total_alerts" in summary, "summary should have total_alerts"
        assert "critical" in summary, "summary should have critical count"
        assert "warning" in summary, "summary should have warning count"
        assert "info" in summary, "summary should have info count"
        assert "venues_at_risk" in summary, "summary should have venues_at_risk"
    
    def test_security_alerts_have_customer_info(self, auth_headers):
        """Each alert should have customer info for View button"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/security", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        alerts = result.get("alerts", [])
        if alerts:
            alert = alerts[0]
            assert "customer" in alert, "alert should have customer info"
            assert "id" in alert["customer"], "customer should have id"
            assert "company_name" in alert["customer"], "customer should have company_name"


class TestReportsAnalytics:
    """Tests for GET /api/crm/analytics/reports endpoint"""
    
    def test_reports_analytics_returns_200(self, auth_headers):
        """Reports analytics endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/reports", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_reports_analytics_has_funnel(self, auth_headers):
        """Reports analytics returns funnel array"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/reports", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "funnel" in result, f"Missing 'funnel' in response: {result.keys()}"
        assert isinstance(result["funnel"], list), "funnel should be a list"
        # Funnel should have 6 stages
        assert len(result["funnel"]) == 6, f"Expected 6 funnel stages, got {len(result['funnel'])}"
        # Each stage should have key, stage, color, count, value
        first = result["funnel"][0]
        assert "key" in first, "funnel item should have 'key'"
        assert "stage" in first, "funnel item should have 'stage'"
        assert "color" in first, "funnel item should have 'color'"
        assert "count" in first, "funnel item should have 'count'"
        assert "value" in first, "funnel item should have 'value'"
    
    def test_reports_analytics_has_loss_reasons(self, auth_headers):
        """Reports analytics returns loss_reasons array"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/reports", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "loss_reasons" in result, f"Missing 'loss_reasons' in response: {result.keys()}"
        assert isinstance(result["loss_reasons"], list), "loss_reasons should be a list"
        # Each reason should have reason, count, percentage
        if result["loss_reasons"]:
            first = result["loss_reasons"][0]
            assert "reason" in first, "loss_reason item should have 'reason'"
            assert "count" in first, "loss_reason item should have 'count'"
            assert "percentage" in first, "loss_reason item should have 'percentage'"
    
    def test_reports_analytics_has_pipeline_history(self, auth_headers):
        """Reports analytics returns pipeline_history array"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/reports", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "pipeline_history" in result, f"Missing 'pipeline_history' in response: {result.keys()}"
        assert isinstance(result["pipeline_history"], list), "pipeline_history should be a list"
        # Each item should have month and value
        if result["pipeline_history"]:
            first = result["pipeline_history"][0]
            assert "month" in first, "pipeline_history item should have 'month'"
            assert "value" in first, "pipeline_history item should have 'value'"
    
    def test_reports_analytics_has_metrics(self, auth_headers):
        """Reports analytics returns metrics object"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/reports", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "metrics" in result, f"Missing 'metrics' in response: {result.keys()}"
        metrics = result["metrics"]
        assert "active_deals" in metrics, "metrics should have active_deals"
        assert "won_deals" in metrics, "metrics should have won_deals"
        assert "lost_deals" in metrics, "metrics should have lost_deals"
        assert "conversion_rate" in metrics, "metrics should have conversion_rate"
        assert "total_pipeline_value" in metrics, "metrics should have total_pipeline_value"
        assert "total_mrr" in metrics, "metrics should have total_mrr"


class TestRevenueTargets:
    """Tests for GET /api/crm/analytics/revenue-targets endpoint"""
    
    def test_revenue_targets_returns_200(self, auth_headers):
        """Revenue targets endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/revenue-targets", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_revenue_targets_has_weekly(self, auth_headers):
        """Revenue targets returns weekly target"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/revenue-targets", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "weekly" in result, f"Missing 'weekly' in response: {result.keys()}"
        assert "current" in result["weekly"], "weekly should have current"
        assert "target" in result["weekly"], "weekly should have target"
    
    def test_revenue_targets_has_monthly(self, auth_headers):
        """Revenue targets returns monthly target"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/revenue-targets", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "monthly" in result, f"Missing 'monthly' in response: {result.keys()}"
        assert "current" in result["monthly"], "monthly should have current"
        assert "target" in result["monthly"], "monthly should have target"
    
    def test_revenue_targets_has_annual(self, auth_headers):
        """Revenue targets returns annual target"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/revenue-targets", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        assert "annual" in result, f"Missing 'annual' in response: {result.keys()}"
        assert "current" in result["annual"], "annual should have current"
        assert "target" in result["annual"], "annual should have target"
    
    def test_revenue_targets_values_are_numeric(self, auth_headers):
        """Revenue target values should be numeric"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics/revenue-targets", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        for period in ["weekly", "monthly", "annual"]:
            assert isinstance(result[period]["current"], (int, float)), f"{period}.current should be numeric"
            assert isinstance(result[period]["target"], (int, float)), f"{period}.target should be numeric"


class TestCustomerById:
    """Tests for GET /api/crm/customers/{id} endpoint"""
    
    def test_get_customers_list(self, auth_headers):
        """Get customers list to get a valid ID"""
        response = requests.get(f"{BASE_URL}/api/crm/customers", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        result = data.get("data", data)
        assert "customers" in result, f"Missing 'customers' in response: {result.keys()}"
        assert len(result["customers"]) > 0, "Should have at least 1 customer"
        return result["customers"]
    
    def test_get_customer_by_id(self, auth_headers):
        """Get single customer by ID"""
        # First get list to get a valid ID
        response = requests.get(f"{BASE_URL}/api/crm/customers", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        customers = result.get("customers", [])
        assert len(customers) > 0, "Need at least 1 customer to test"
        
        customer_id = customers[0]["id"]
        
        # Now get by ID
        response = requests.get(f"{BASE_URL}/api/crm/customers/{customer_id}", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        customer = data.get("data", data)
        
        # Verify customer fields
        assert "id" in customer, "customer should have id"
        assert "company_name" in customer, "customer should have company_name"
        assert "contact_name" in customer, "customer should have contact_name"
        assert "plan_id" in customer, "customer should have plan_id"
        assert "mrr" in customer, "customer should have mrr"
        assert "status" in customer, "customer should have status"
        assert "modules_enabled" in customer, "customer should have modules_enabled"
    
    def test_get_customer_not_found(self, auth_headers):
        """Get non-existent customer returns 404"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/crm/customers/{fake_id}", headers=auth_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestCustomersSearch:
    """Tests for customer search functionality"""
    
    def test_customers_search_by_name(self, auth_headers):
        """Search customers by company name"""
        response = requests.get(f"{BASE_URL}/api/crm/customers?search=Bar", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        result = data.get("data", data)
        customers = result.get("customers", [])
        # All results should contain 'Bar' in company_name, contact_name, or email
        for c in customers:
            match = (
                "bar" in c.get("company_name", "").lower() or
                "bar" in c.get("contact_name", "").lower() or
                "bar" in c.get("contact_email", "").lower()
            )
            assert match, f"Customer {c['company_name']} doesn't match search 'Bar'"


class TestDataIntegrity:
    """Tests to verify real data from PostgreSQL"""
    
    def test_customers_count(self, auth_headers):
        """Should have 11 customers as per context"""
        response = requests.get(f"{BASE_URL}/api/crm/customers", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        customers = result.get("customers", [])
        # Context says 11 customers (9 active, 1 churned, 1 paused)
        assert len(customers) >= 10, f"Expected at least 10 customers, got {len(customers)}"
        print(f"Total customers: {len(customers)}")
    
    def test_deals_count(self, auth_headers):
        """Should have 10 deals as per context"""
        response = requests.get(f"{BASE_URL}/api/crm/deals", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        deals = result.get("deals", [])
        # Context says 10 deals
        assert len(deals) >= 10, f"Expected at least 10 deals, got {len(deals)}"
        print(f"Total deals: {len(deals)}")
    
    def test_closed_lost_deals_for_loss_reasons(self, auth_headers):
        """Should have closed_lost deals for loss reasons analysis"""
        response = requests.get(f"{BASE_URL}/api/crm/deals?stage=closed_lost", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        deals = result.get("deals", [])
        # Context says 5 closed_lost deals
        assert len(deals) >= 5, f"Expected at least 5 closed_lost deals, got {len(deals)}"
        print(f"Closed lost deals: {len(deals)}")


class TestRegressionPipeline:
    """Regression tests for Pipeline page (should still work)"""
    
    def test_deals_endpoint(self, auth_headers):
        """Deals endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/crm/deals", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_deal_by_id(self, auth_headers):
        """Get deal by ID still works"""
        # Get list first
        response = requests.get(f"{BASE_URL}/api/crm/deals", headers=auth_headers)
        data = response.json()
        result = data.get("data", data)
        deals = result.get("deals", [])
        if deals:
            deal_id = deals[0]["id"]
            response = requests.get(f"{BASE_URL}/api/crm/deals/{deal_id}", headers=auth_headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


class TestRegressionCustomerBase:
    """Regression tests for Customer Base page (should still work)"""
    
    def test_customers_endpoint(self, auth_headers):
        """Customers endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/crm/customers", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_customers_filter_by_status(self, auth_headers):
        """Filter customers by status still works"""
        response = requests.get(f"{BASE_URL}/api/crm/customers?status=active", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        result = data.get("data", data)
        customers = result.get("customers", [])
        for c in customers:
            assert c["status"] == "active", f"Customer {c['company_name']} has status {c['status']}, expected active"
    
    def test_customers_filter_by_plan(self, auth_headers):
        """Filter customers by plan still works"""
        response = requests.get(f"{BASE_URL}/api/crm/customers?plan_id=os", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
