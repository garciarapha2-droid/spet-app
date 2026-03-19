"""
Iteration 59: CEO Operating System - Multi-Dashboard Tests
Tests all 8 dashboard sections with 7 NEW endpoints:
- /api/ceo/overview-metrics
- /api/ceo/revenue-detailed
- /api/ceo/growth-metrics
- /api/ceo/marketing-funnel
- /api/ceo/sales-performance
- /api/ceo/customer-lifecycle
- /api/ceo/risk-dashboard
Also tests existing endpoints and access control.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test Credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
REGULAR_EMAIL = "teste@teste.com"
REGULAR_PASSWORD = "12345"


@pytest.fixture(scope="module")
def ceo_token():
    """Get CEO authentication token."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": CEO_EMAIL,
        "password": CEO_PASSWORD
    })
    assert response.status_code == 200, f"CEO login failed: {response.text}"
    data = response.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture(scope="module")
def regular_token():
    """Get regular user authentication token."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": REGULAR_EMAIL,
        "password": REGULAR_PASSWORD
    })
    assert response.status_code == 200, f"Regular login failed: {response.text}"
    data = response.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture(scope="module")
def ceo_headers(ceo_token):
    """CEO authorization headers."""
    return {"Authorization": f"Bearer {ceo_token}"}


@pytest.fixture(scope="module")
def regular_headers(regular_token):
    """Regular user authorization headers."""
    return {"Authorization": f"Bearer {regular_token}"}


class TestCEOAuthentication:
    """Authentication and access control tests."""

    def test_ceo_login_returns_token(self):
        """CEO user can login and receives token."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL, "password": CEO_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data or "token" in data
        print("PASS: CEO login returns token")

    def test_regular_user_login(self):
        """Regular user can login."""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": REGULAR_EMAIL, "password": REGULAR_PASSWORD
        })
        assert response.status_code == 200
        print("PASS: Regular user login works")


class TestCEOOverviewDashboard:
    """Overview dashboard - hero metrics, charts, growth data."""

    def test_overview_metrics_endpoint(self, ceo_headers):
        """GET /api/ceo/overview-metrics returns expected structure."""
        response = requests.get(f"{BASE_URL}/api/ceo/overview-metrics", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Check metrics structure
        assert "metrics" in data
        m = data["metrics"]
        required_metrics = ["mrr", "net_new_mrr", "active_customers", "churn_rate", "arpu", "ltv", "cac", "ltv_cac_ratio", "growth_pct"]
        for metric in required_metrics:
            assert metric in m, f"Missing metric: {metric}"
        
        # Check charts structure
        assert "charts" in data
        charts = data["charts"]
        assert "mrr_trend" in charts
        assert "customer_trend" in charts
        assert "revenue_breakdown" in charts
        print(f"PASS: Overview metrics - MRR: ${m.get('mrr', 0):,.2f}, Customers: {m.get('active_customers', 0)}")

    def test_overview_metrics_requires_ceo_role(self, regular_headers):
        """Regular user gets 403 on overview-metrics."""
        response = requests.get(f"{BASE_URL}/api/ceo/overview-metrics", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Overview metrics blocked for non-CEO")


class TestCEORevenueDashboard:
    """Revenue dashboard - MRR breakdown, ARR, cash flow."""

    def test_revenue_detailed_endpoint(self, ceo_headers):
        """GET /api/ceo/revenue-detailed returns revenue analytics."""
        response = requests.get(f"{BASE_URL}/api/ceo/revenue-detailed", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "metrics" in data
        m = data["metrics"]
        required = ["mrr", "expansion_mrr", "contraction_mrr", "churned_mrr", "net_new_mrr", "arr", "net_cash_flow"]
        for metric in required:
            assert metric in m, f"Missing: {metric}"
        
        assert "charts" in data
        charts = data["charts"]
        assert "daily_revenue" in charts
        assert "monthly_mrr" in charts
        assert "cash_flow" in charts
        print(f"PASS: Revenue detailed - ARR: ${m.get('arr', 0):,.2f}")

    def test_revenue_detailed_requires_ceo(self, regular_headers):
        """Regular user gets 403 on revenue-detailed."""
        response = requests.get(f"{BASE_URL}/api/ceo/revenue-detailed", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Revenue detailed blocked for non-CEO")


class TestCEOGrowthDashboard:
    """Growth dashboard - LTV, CAC, unit economics."""

    def test_growth_metrics_endpoint(self, ceo_headers):
        """GET /api/ceo/growth-metrics returns growth analytics."""
        response = requests.get(f"{BASE_URL}/api/ceo/growth-metrics", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "metrics" in data
        m = data["metrics"]
        required = ["ltv", "cac", "ltv_cac_ratio", "payback_months", "arpu"]
        for metric in required:
            assert metric in m, f"Missing: {metric}"
        
        assert "charts" in data
        charts = data["charts"]
        assert "new_customers" in charts
        assert "churn_trend" in charts
        assert "ltv_vs_cac" in charts
        print(f"PASS: Growth metrics - LTV: ${m.get('ltv', 0):,.2f}, CAC: ${m.get('cac', 0):,.2f}")

    def test_growth_metrics_requires_ceo(self, regular_headers):
        """Regular user gets 403 on growth-metrics."""
        response = requests.get(f"{BASE_URL}/api/ceo/growth-metrics", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Growth metrics blocked for non-CEO")


class TestCEOMarketingDashboard:
    """Marketing dashboard - funnel, sources, conversion rates."""

    def test_marketing_funnel_endpoint(self, ceo_headers):
        """GET /api/ceo/marketing-funnel returns funnel data."""
        response = requests.get(f"{BASE_URL}/api/ceo/marketing-funnel", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "metrics" in data
        m = data["metrics"]
        required = ["total_leads", "leads_today", "leads_this_month", "lead_to_trial", "trial_to_paid"]
        for metric in required:
            assert metric in m, f"Missing: {metric}"
        
        assert "charts" in data
        charts = data["charts"]
        assert "funnel" in charts
        assert "sources" in charts
        assert "monthly_leads" in charts
        
        # Verify funnel stages
        funnel = charts.get("funnel", [])
        if funnel:
            stages = [f["stage"] for f in funnel]
            assert "Awareness" in stages or len(stages) > 0
        print(f"PASS: Marketing funnel - Total Leads: {m.get('total_leads', 0)}")

    def test_marketing_funnel_requires_ceo(self, regular_headers):
        """Regular user gets 403 on marketing-funnel."""
        response = requests.get(f"{BASE_URL}/api/ceo/marketing-funnel", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Marketing funnel blocked for non-CEO")


class TestCEOSalesDashboard:
    """Sales dashboard - pipeline, performance, leads."""

    def test_sales_performance_endpoint(self, ceo_headers):
        """GET /api/ceo/sales-performance returns sales data."""
        response = requests.get(f"{BASE_URL}/api/ceo/sales-performance", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "metrics" in data
        m = data["metrics"]
        assert "total_sales" in m
        assert "avg_sale" in m
        assert "count_sales" in m
        
        assert "charts" in data
        assert "monthly_sales" in data["charts"]
        print(f"PASS: Sales performance - Total Sales: ${m.get('total_sales', 0):,.2f}")

    def test_sales_performance_requires_ceo(self, regular_headers):
        """Regular user gets 403 on sales-performance."""
        response = requests.get(f"{BASE_URL}/api/ceo/sales-performance", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Sales performance blocked for non-CEO")

    def test_leads_endpoint(self, ceo_headers):
        """GET /api/ceo/leads returns lead list for Kanban."""
        response = requests.get(f"{BASE_URL}/api/ceo/leads", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "leads" in data
        assert "total" in data
        leads = data.get("leads", [])
        if leads:
            # Check lead structure
            lead = leads[0]
            assert "id" in lead
            assert "full_name" in lead
            assert "email" in lead
            assert "status" in lead
        print(f"PASS: Leads endpoint - Total: {data.get('total', 0)}")


class TestCEOCustomersDashboard:
    """Customers dashboard - lifecycle, retention, ARPU."""

    def test_customer_lifecycle_endpoint(self, ceo_headers):
        """GET /api/ceo/customer-lifecycle returns customer data."""
        response = requests.get(f"{BASE_URL}/api/ceo/customer-lifecycle", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "metrics" in data
        m = data["metrics"]
        required = ["total_customers", "new_this_month", "lost_this_month", "retention_rate", "churn_rate", "rev_per_customer"]
        for metric in required:
            assert metric in m, f"Missing: {metric}"
        
        assert "charts" in data
        charts = data["charts"]
        assert "customer_growth" in charts
        assert "rev_per_customer" in charts
        print(f"PASS: Customer lifecycle - Retention: {m.get('retention_rate', 0)}%")

    def test_customer_lifecycle_requires_ceo(self, regular_headers):
        """Regular user gets 403 on customer-lifecycle."""
        response = requests.get(f"{BASE_URL}/api/ceo/customer-lifecycle", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Customer lifecycle blocked for non-CEO")


class TestCEOProductDashboard:
    """Product dashboard - module adoption metrics."""

    def test_modules_endpoint(self, ceo_headers):
        """GET /api/ceo/modules returns module adoption data."""
        response = requests.get(f"{BASE_URL}/api/ceo/modules", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "modules" in data
        assert "total_venues" in data
        modules = data.get("modules", [])
        
        if modules:
            module = modules[0]
            assert "name" in module
            assert "active" in module
            assert "adoption_pct" in module
        print(f"PASS: Module adoption - {len(modules)} modules, {data.get('total_venues', 0)} venues")

    def test_modules_requires_ceo(self, regular_headers):
        """Regular user gets 403 on modules."""
        response = requests.get(f"{BASE_URL}/api/ceo/modules", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Modules blocked for non-CEO")


class TestCEORiskDashboard:
    """Risk dashboard - alerts, risk score, incidents."""

    def test_risk_dashboard_endpoint(self, ceo_headers):
        """GET /api/ceo/risk-dashboard returns risk data."""
        response = requests.get(f"{BASE_URL}/api/ceo/risk-dashboard", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "metrics" in data
        m = data["metrics"]
        required = ["total_incidents", "critical_incidents", "open_tasks", "risk_score"]
        for metric in required:
            assert metric in m, f"Missing: {metric}"
        
        assert "alerts" in data
        assert "severity_breakdown" in data
        print(f"PASS: Risk dashboard - Risk Score: {m.get('risk_score', 0)}/100")

    def test_risk_dashboard_requires_ceo(self, regular_headers):
        """Regular user gets 403 on risk-dashboard."""
        response = requests.get(f"{BASE_URL}/api/ceo/risk-dashboard", headers=regular_headers)
        assert response.status_code == 403
        print("PASS: Risk dashboard blocked for non-CEO")

    def test_alerts_endpoint(self, ceo_headers):
        """GET /api/ceo/alerts returns risk alerts."""
        response = requests.get(f"{BASE_URL}/api/ceo/alerts", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "alerts" in data
        assert "total" in data
        alerts = data.get("alerts", [])
        if alerts:
            alert = alerts[0]
            assert "type" in alert
            assert "severity" in alert
            assert "message" in alert
        print(f"PASS: Alerts endpoint - {data.get('total', 0)} alerts")


class TestCEOTargets:
    """Revenue targets sidebar functionality."""

    def test_get_targets(self, ceo_headers):
        """GET /api/ceo/targets returns weekly/monthly/annual targets."""
        response = requests.get(f"{BASE_URL}/api/ceo/targets", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "targets" in data
        targets = data["targets"]
        for period in ["weekly", "monthly", "annual"]:
            assert period in targets
            target = targets[period]
            assert "goal" in target
            assert "actual" in target
            assert "pct" in target
        print("PASS: Targets endpoint returns all periods")

    def test_update_targets(self, ceo_headers):
        """POST /api/ceo/targets updates target values."""
        # Update monthly target using form data
        response = requests.post(
            f"{BASE_URL}/api/ceo/targets",
            headers=ceo_headers,
            data={
                'monthly_value': '60000',
                'monthly_type': 'revenue'
            }
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        result = response.json()
        assert result.get("status") == "updated"
        print("PASS: Targets can be updated")


class TestCEOExistingEndpoints:
    """Test existing CEO endpoints still work."""

    def test_health_endpoint(self, ceo_headers):
        """GET /api/ceo/health returns KPIs."""
        response = requests.get(f"{BASE_URL}/api/ceo/health", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "kpis" in data
        print("PASS: Health endpoint works")

    def test_companies_endpoint(self, ceo_headers):
        """GET /api/ceo/companies returns company list."""
        response = requests.get(f"{BASE_URL}/api/ceo/companies", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "companies" in data
        print(f"PASS: Companies endpoint - {len(data.get('companies', []))} companies")

    def test_pipeline_endpoint(self, ceo_headers):
        """GET /api/ceo/pipeline returns growth funnel."""
        response = requests.get(f"{BASE_URL}/api/ceo/pipeline", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "pipeline" in data
        print("PASS: Pipeline endpoint works")

    def test_users_endpoint(self, ceo_headers):
        """GET /api/ceo/users returns user list."""
        response = requests.get(f"{BASE_URL}/api/ceo/users", headers=ceo_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "users" in data
        print(f"PASS: Users endpoint - {len(data.get('users', []))} users")


class TestCEOLeadUpdates:
    """Test lead status update functionality."""

    def test_update_lead_status(self, ceo_headers):
        """PUT /api/ceo/leads/{id}/status updates lead status."""
        # First get a lead
        response = requests.get(f"{BASE_URL}/api/ceo/leads", headers=ceo_headers)
        assert response.status_code == 200
        leads = response.json().get("leads", [])
        
        if not leads:
            pytest.skip("No leads to test")
        
        lead_id = leads[0]["id"]
        original_status = leads[0]["status"]
        
        # Update lead status using form data
        response = requests.put(
            f"{BASE_URL}/api/ceo/leads/{lead_id}/status",
            headers=ceo_headers,
            data={'status': 'contacted'}
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        # Restore original status
        requests.put(
            f"{BASE_URL}/api/ceo/leads/{lead_id}/status",
            headers=ceo_headers,
            data={'status': original_status or 'new'}
        )
        print("PASS: Lead status can be updated")


class TestCEOAccessControl:
    """Access control - verify all CEO endpoints block non-CEO users."""

    @pytest.mark.parametrize("endpoint", [
        "/api/ceo/health",
        "/api/ceo/overview-metrics",
        "/api/ceo/revenue-detailed",
        "/api/ceo/growth-metrics",
        "/api/ceo/marketing-funnel",
        "/api/ceo/sales-performance",
        "/api/ceo/customer-lifecycle",
        "/api/ceo/risk-dashboard",
        "/api/ceo/companies",
        "/api/ceo/modules",
        "/api/ceo/alerts",
        "/api/ceo/pipeline",
        "/api/ceo/users",
        "/api/ceo/leads",
        "/api/ceo/targets",
    ])
    def test_endpoint_requires_ceo(self, regular_headers, endpoint):
        """Non-CEO users get 403 on CEO endpoints."""
        response = requests.get(f"{BASE_URL}{endpoint}", headers=regular_headers)
        assert response.status_code == 403, f"{endpoint} should block non-CEO: got {response.status_code}"
        print(f"PASS: {endpoint} blocked for non-CEO")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
