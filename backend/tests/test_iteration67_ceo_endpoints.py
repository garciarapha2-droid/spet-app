"""
Iteration 67: CEO Dashboard API Endpoints Testing

Tests CEO endpoints for:
1. GET /api/ceo/overview-metrics - MRR, net_new_mrr, active_customers, churn, arpu, ltv, cac, arr + charts
2. GET /api/ceo/health - kpis (mrr, gross_revenue, net_profit, active_companies, active_venues, churn_rate)
3. GET /api/ceo/revenue-detailed - MRR breakdown, ARR, net_cash_flow + charts
4. GET /api/ceo/cash-flow (NEW) - burn_rate, runway_months, profit_margin + charts
5. GET /api/ceo/revenue?period=month - chart array with revenue/profit/fees
6. GET /api/ceo/targets - targets data
7. GET /api/ceo/kpi-breakdown?kpi=mrr - venues breakdown
8. GET /api/ceo/sales-performance - metrics + monthly_sales chart
9. GET /api/ceo/marketing-funnel - metrics + funnel + sources + monthly_leads charts
10. GET /api/ceo/customer-lifecycle - metrics + customer_growth + rev_per_customer charts
11. GET /api/ceo/growth-metrics - ltv, cac, ltv_cac_ratio, payback_months + charts
12. GET /api/ceo/risk-dashboard - metrics + alerts + severity_breakdown
13. GET /api/auth/me - modules_enabled verification for different users
14. CEO endpoints return 403 for non-CEO user (teste@teste.com)
15. GET /api/health - basic health check

Credentials:
- CEO: garcia.rapha2@gmail.com / 12345
- Regular user: teste@teste.com / 12345
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://ops-clone.preview.emergentagent.com"

# Test credentials
CEO_EMAIL = "garcia.rapha2@gmail.com"
CEO_PASSWORD = "12345"
REGULAR_USER_EMAIL = "teste@teste.com"
REGULAR_USER_PASSWORD = "12345"


class TestHealthEndpoint:
    """Basic health check endpoint"""
    
    def test_health_endpoint_returns_healthy(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        # Response may be wrapped or direct
        status = data.get("data", {}).get("status") if "data" in data else data.get("status")
        assert status == "healthy", f"Expected healthy status, got: {data}"
        print("PASS: GET /api/health returns healthy")


class TestAuthMe:
    """Test /api/auth/me for different users and their modules_enabled"""
    
    @pytest.fixture
    def regular_user_token(self):
        """Get token for teste@teste.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": REGULAR_USER_EMAIL,
            "password": REGULAR_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        token = data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
        assert token, "No access_token in response"
        return token
    
    @pytest.fixture
    def ceo_token(self):
        """Get token for CEO user garcia.rapha2@gmail.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        assert response.status_code == 200, f"CEO login failed: {response.text}"
        data = response.json()
        token = data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
        assert token, "No access_token in response"
        return token
    
    def test_auth_me_regular_user_modules(self, regular_user_token):
        """GET /api/auth/me for teste@teste.com returns modules_enabled=[kds,pulse,table,tap]"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {regular_user_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        user_data = data.get("data", data)  # Handle wrapped or unwrapped response
        
        modules = user_data.get("modules_enabled", [])
        expected_modules = ["kds", "pulse", "table", "tap"]
        
        # Verify modules contain expected values
        for mod in expected_modules:
            assert mod in modules, f"Expected {mod} in modules_enabled, got: {modules}"
        
        print(f"PASS: teste@teste.com has modules_enabled={modules}")
    
    def test_auth_me_ceo_user_modules(self, ceo_token):
        """GET /api/auth/me for garcia.rapha2@gmail.com returns modules with ai/bar/finance/analytics"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        user_data = data.get("data", data)
        
        modules = user_data.get("modules_enabled", [])
        # CEO should have extended modules including ai, analytics, bar, finance
        expected_extra_modules = ["ai", "analytics", "bar", "finance"]
        
        for mod in expected_extra_modules:
            assert mod in modules, f"Expected {mod} in CEO modules_enabled, got: {modules}"
        
        # Verify user role is CEO
        role = user_data.get("role")
        assert role == "CEO", f"Expected CEO role, got: {role}"
        
        print(f"PASS: garcia.rapha2@gmail.com has role=CEO, modules_enabled={modules}")


class TestCEOEndpointsAccess:
    """Test that CEO endpoints require CEO role - 403 for regular users"""
    
    @pytest.fixture
    def regular_user_token(self):
        """Get token for regular user teste@teste.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": REGULAR_USER_EMAIL,
            "password": REGULAR_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_ceo_endpoint_forbidden_for_regular_user(self, regular_user_token):
        """CEO endpoints return 403 for non-CEO user"""
        endpoints = [
            "/api/ceo/overview-metrics",
            "/api/ceo/health",
            "/api/ceo/revenue-detailed",
            "/api/ceo/cash-flow",
        ]
        
        for endpoint in endpoints:
            response = requests.get(
                f"{BASE_URL}{endpoint}",
                headers={"Authorization": f"Bearer {regular_user_token}"}
            )
            assert response.status_code == 403, f"Expected 403 for {endpoint} with regular user, got {response.status_code}"
            print(f"PASS: {endpoint} returns 403 for non-CEO user")


class TestCEOOverviewMetrics:
    """Test GET /api/ceo/overview-metrics endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_overview_metrics_returns_metrics_and_charts(self, ceo_token):
        """GET /api/ceo/overview-metrics returns metrics (mrr, net_new_mrr, etc.) and charts"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/overview-metrics",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        # Verify metrics object
        metrics = content.get("metrics", {})
        expected_metrics = ["mrr", "net_new_mrr", "active_customers", "churn_rate", "arpu", "ltv", "cac", "arr"]
        for m in expected_metrics:
            assert m in metrics, f"Expected {m} in metrics, got: {list(metrics.keys())}"
        
        # Verify charts object
        charts = content.get("charts", {})
        expected_charts = ["mrr_trend", "customer_trend", "revenue_breakdown"]
        for c in expected_charts:
            assert c in charts, f"Expected {c} in charts, got: {list(charts.keys())}"
        
        print(f"PASS: overview-metrics has metrics={list(metrics.keys())} and charts={list(charts.keys())}")


class TestCEOHealth:
    """Test GET /api/ceo/health endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_health_returns_kpis(self, ceo_token):
        """GET /api/ceo/health returns kpis object"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/health",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        kpis = content.get("kpis", {})
        expected_kpis = ["mrr", "gross_revenue", "net_profit", "active_companies", "active_venues", "churn_rate"]
        for k in expected_kpis:
            assert k in kpis, f"Expected {k} in kpis, got: {list(kpis.keys())}"
        
        print(f"PASS: /api/ceo/health has kpis={list(kpis.keys())}")


class TestCEORevenueDetailed:
    """Test GET /api/ceo/revenue-detailed endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_revenue_detailed_returns_metrics_and_charts(self, ceo_token):
        """GET /api/ceo/revenue-detailed returns metrics and charts"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/revenue-detailed",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        metrics = content.get("metrics", {})
        expected_metrics = ["mrr", "expansion_mrr", "contraction_mrr", "churned_mrr", "net_new_mrr", "arr", "net_cash_flow"]
        for m in expected_metrics:
            assert m in metrics, f"Expected {m} in revenue-detailed metrics, got: {list(metrics.keys())}"
        
        charts = content.get("charts", {})
        expected_charts = ["daily_revenue", "monthly_mrr", "cash_flow"]
        for c in expected_charts:
            assert c in charts, f"Expected {c} in revenue-detailed charts, got: {list(charts.keys())}"
        
        print(f"PASS: revenue-detailed has metrics={list(metrics.keys())} and charts={list(charts.keys())}")


class TestCEOCashFlow:
    """Test GET /api/ceo/cash-flow endpoint (NEW)"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_cash_flow_returns_metrics_and_charts(self, ceo_token):
        """GET /api/ceo/cash-flow returns metrics (burn_rate, runway_months, profit_margin) and charts"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/cash-flow",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        # Verify metrics - including NEW fields
        metrics = content.get("metrics", {})
        expected_metrics = [
            "gross_revenue", "operating_costs", "net_cash_flow",
            "burn_rate", "runway_months", "mrr", "arr", "profit_margin"
        ]
        for m in expected_metrics:
            assert m in metrics, f"Expected {m} in cash-flow metrics, got: {list(metrics.keys())}"
        
        # Verify charts
        charts = content.get("charts", {})
        expected_charts = ["monthly_flow", "mrr_evolution", "cumulative_cash"]
        for c in expected_charts:
            assert c in charts, f"Expected {c} in cash-flow charts, got: {list(charts.keys())}"
        
        # Verify types for new fields
        assert isinstance(metrics["burn_rate"], (int, float)), f"burn_rate should be numeric"
        assert isinstance(metrics["runway_months"], (int, float)), f"runway_months should be numeric"
        assert isinstance(metrics["profit_margin"], (int, float)), f"profit_margin should be numeric"
        
        print(f"PASS: cash-flow has metrics={list(metrics.keys())} and charts={list(charts.keys())}")
        print(f"  burn_rate={metrics['burn_rate']}, runway_months={metrics['runway_months']}, profit_margin={metrics['profit_margin']}")


class TestCEORevenue:
    """Test GET /api/ceo/revenue?period=month endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_revenue_with_period_returns_chart(self, ceo_token):
        """GET /api/ceo/revenue?period=month returns chart array"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/revenue?period=month",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        chart = content.get("chart", [])
        assert isinstance(chart, list), f"Expected chart to be list, got: {type(chart)}"
        
        # Verify chart items have expected fields
        if chart:
            item = chart[0]
            expected_fields = ["revenue", "profit", "fees"]
            for f in expected_fields:
                assert f in item, f"Expected {f} in chart item, got: {list(item.keys())}"
        
        print(f"PASS: /api/ceo/revenue?period=month returns chart with {len(chart)} items")


class TestCEOTargets:
    """Test GET /api/ceo/targets endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_targets_returns_targets_data(self, ceo_token):
        """GET /api/ceo/targets returns targets object"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/targets",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        targets = content.get("targets", {})
        expected_targets = ["weekly", "monthly", "annual"]
        for t in expected_targets:
            assert t in targets, f"Expected {t} in targets, got: {list(targets.keys())}"
        
        print(f"PASS: /api/ceo/targets has targets={list(targets.keys())}")


class TestCEOKPIBreakdown:
    """Test GET /api/ceo/kpi-breakdown?kpi=mrr endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_kpi_breakdown_returns_venues(self, ceo_token):
        """GET /api/ceo/kpi-breakdown?kpi=mrr returns venues breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/kpi-breakdown?kpi=mrr",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        assert "kpi" in content, f"Expected kpi field in response"
        assert "venues" in content, f"Expected venues field in response"
        assert "total" in content, f"Expected total field in response"
        
        venues = content.get("venues", [])
        assert isinstance(venues, list), f"Expected venues to be list"
        
        print(f"PASS: /api/ceo/kpi-breakdown?kpi=mrr returns {len(venues)} venues with total={content.get('total')}")


class TestCEOSalesPerformance:
    """Test GET /api/ceo/sales-performance endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_sales_performance_returns_metrics_and_chart(self, ceo_token):
        """GET /api/ceo/sales-performance returns metrics and monthly_sales chart"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/sales-performance",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        metrics = content.get("metrics", {})
        charts = content.get("charts", {})
        
        assert "total_sales" in metrics, f"Expected total_sales in metrics"
        assert "monthly_sales" in charts, f"Expected monthly_sales in charts"
        
        print(f"PASS: sales-performance has metrics={list(metrics.keys())} and charts={list(charts.keys())}")


class TestCEOMarketingFunnel:
    """Test GET /api/ceo/marketing-funnel endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_marketing_funnel_returns_metrics_and_charts(self, ceo_token):
        """GET /api/ceo/marketing-funnel returns metrics, funnel, sources, and monthly_leads"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/marketing-funnel",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        metrics = content.get("metrics", {})
        charts = content.get("charts", {})
        
        expected_metrics = ["total_leads", "lead_to_trial", "trial_to_paid"]
        for m in expected_metrics:
            assert m in metrics, f"Expected {m} in marketing-funnel metrics"
        
        expected_charts = ["funnel", "sources", "monthly_leads"]
        for c in expected_charts:
            assert c in charts, f"Expected {c} in marketing-funnel charts"
        
        print(f"PASS: marketing-funnel has metrics and charts (funnel, sources, monthly_leads)")


class TestCEOCustomerLifecycle:
    """Test GET /api/ceo/customer-lifecycle endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_customer_lifecycle_returns_metrics_and_charts(self, ceo_token):
        """GET /api/ceo/customer-lifecycle returns metrics and charts"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/customer-lifecycle",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        metrics = content.get("metrics", {})
        charts = content.get("charts", {})
        
        expected_metrics = ["total_customers", "new_this_month", "retention_rate", "rev_per_customer"]
        for m in expected_metrics:
            assert m in metrics, f"Expected {m} in customer-lifecycle metrics"
        
        expected_charts = ["customer_growth", "rev_per_customer"]
        for c in expected_charts:
            assert c in charts, f"Expected {c} in customer-lifecycle charts"
        
        print(f"PASS: customer-lifecycle has metrics={list(metrics.keys())} and charts={list(charts.keys())}")


class TestCEOGrowthMetrics:
    """Test GET /api/ceo/growth-metrics endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_growth_metrics_returns_ltv_cac_payback(self, ceo_token):
        """GET /api/ceo/growth-metrics returns ltv, cac, ltv_cac_ratio, payback_months + charts"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/growth-metrics",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        metrics = content.get("metrics", {})
        charts = content.get("charts", {})
        
        expected_metrics = ["ltv", "cac", "ltv_cac_ratio", "payback_months"]
        for m in expected_metrics:
            assert m in metrics, f"Expected {m} in growth-metrics"
        
        assert "charts" in content, "Expected charts in response"
        
        print(f"PASS: growth-metrics has ltv={metrics.get('ltv')}, cac={metrics.get('cac')}, ltv_cac_ratio={metrics.get('ltv_cac_ratio')}, payback={metrics.get('payback_months')}")


class TestCEORiskDashboard:
    """Test GET /api/ceo/risk-dashboard endpoint"""
    
    @pytest.fixture
    def ceo_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CEO_EMAIL,
            "password": CEO_PASSWORD
        })
        data = response.json()
        return data.get("data", {}).get("access_token") if "data" in data else data.get("access_token")
    
    def test_risk_dashboard_returns_metrics_alerts_severity(self, ceo_token):
        """GET /api/ceo/risk-dashboard returns metrics, alerts, and severity_breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/ceo/risk-dashboard",
            headers={"Authorization": f"Bearer {ceo_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("data", data)
        
        metrics = content.get("metrics", {})
        assert "total_incidents" in metrics, f"Expected total_incidents in metrics"
        assert "risk_score" in metrics, f"Expected risk_score in metrics"
        
        assert "alerts" in content, f"Expected alerts in response"
        assert "severity_breakdown" in content, f"Expected severity_breakdown in response"
        
        print(f"PASS: risk-dashboard has metrics (risk_score={metrics.get('risk_score')}), alerts, severity_breakdown")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
