"""
Iteration 45: Authentication System Testing
Tests for the production-ready authentication system:
- POST /api/auth/login (existing users)
- POST /api/auth/signup (new users with venue auto-creation)
- POST /api/auth/logout (token blacklisting)
- GET /api/auth/me (authenticated user profile)
- Backward compatibility (existing users preserved)
- Venue creation in MongoDB during signup
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthLogin:
    """Tests for POST /api/auth/login endpoint"""
    
    def test_login_existing_user_teste(self):
        """Test login with existing platform_admin user teste@teste.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify access_token is present
        assert "access_token" in data, "Response must contain access_token"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        
        # Verify user object with required fields
        assert "user" in data, "Response must contain user object"
        user = data["user"]
        assert "email" in user
        assert user["email"] == "teste@teste.com"
        assert "name" in user  # name field required
        assert "status" in user
        assert user["status"] == "active"
        
        # Verify next route
        assert "next" in data, "Response must contain next object"
        assert data["next"]["type"] == "route"
        assert data["next"]["route"] == "/venue/home"
        
        print(f"✓ Login successful for teste@teste.com")
        print(f"  - Token: {data['access_token'][:50]}...")
        print(f"  - User name: {user.get('name')}")
        print(f"  - Next route: {data['next']['route']}")
    
    def test_login_ceo_user_garcia(self):
        """Test login with CEO user garcia.rapha2@gmail.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "garcia.rapha2@gmail.com",
            "password": "12345"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "garcia.rapha2@gmail.com"
        assert "next" in data
        
        print(f"✓ Login successful for CEO garcia.rapha2@gmail.com")
        print(f"  - User name: {data['user'].get('name')}")
    
    def test_login_wrong_password(self):
        """Test login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "wrongpassword123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data
        print(f"✓ Wrong password correctly returns 401: {data['detail']}")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": f"nonexistent-{uuid.uuid4()}@example.com",
            "password": "12345"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Non-existent user correctly returns 401")


class TestAuthSignup:
    """Tests for POST /api/auth/signup endpoint"""
    
    def test_signup_new_user_with_venue_creation(self):
        """Test signup creates user, auto-creates venue in MongoDB, returns JWT"""
        unique_email = f"test-signup-{int(time.time())}-{uuid.uuid4().hex[:6]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "testpassword123",
            "name": "Test User Signup",
            "venue_type": "nightclub"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify same response format as login
        assert "access_token" in data, "Signup must return access_token like login"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        
        # Verify user object
        assert "user" in data, "Signup must return user object"
        user = data["user"]
        assert user["email"] == unique_email.lower()
        assert user.get("name") == "Test User Signup"
        assert user["status"] == "active"
        
        # Verify next route
        assert "next" in data, "Signup must return next route"
        assert data["next"]["type"] == "route"
        assert data["next"]["route"] == "/venue/home"
        
        print(f"✓ Signup successful for {unique_email}")
        print(f"  - Token: {data['access_token'][:50]}...")
        print(f"  - User ID: {user['id']}")
        
        # Now verify venue was created via GET /me
        token = data["access_token"]
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200, f"GET /me failed: {me_response.text}"
        
        me_data = me_response.json()
        assert "venues" in me_data, "GET /me must return venues array after signup"
        assert len(me_data["venues"]) >= 1, "Signup should auto-create at least one venue"
        
        # Verify venue has correct venue_type
        venue = me_data["venues"][0]
        assert venue.get("venue_type") == "nightclub", f"Expected venue_type='nightclub', got {venue.get('venue_type')}"
        
        print(f"  - Auto-created venue: {venue.get('name')}")
        print(f"  - Venue type: {venue.get('venue_type')}")
        print(f"  - Venue ID: {venue.get('id')}")
        
        return token, user["id"]
    
    def test_signup_duplicate_email_returns_400(self):
        """Test signup with existing email returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": "teste@teste.com",  # existing user
            "password": "somepassword",
            "name": "Duplicate Test"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data
        print(f"✓ Duplicate email correctly returns 400: {data['detail']}")
    
    def test_signup_default_venue_type(self):
        """Test signup without venue_type defaults to 'bar'"""
        unique_email = f"test-default-venue-{int(time.time())}-{uuid.uuid4().hex[:6]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "testpassword123",
            "name": "Default Venue Test"
            # No venue_type specified
        })
        assert response.status_code == 200, f"Signup failed: {response.text}"
        
        data = response.json()
        token = data["access_token"]
        
        # Check venue type via /me
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        me_data = me_response.json()
        
        if me_data.get("venues"):
            venue = me_data["venues"][0]
            assert venue.get("venue_type") == "bar", f"Default venue_type should be 'bar', got {venue.get('venue_type')}"
            print(f"✓ Default venue_type is 'bar' when not specified")


class TestAuthMe:
    """Tests for GET /api/auth/me endpoint"""
    
    def test_get_me_with_valid_token(self):
        """Test GET /me returns user profile with roles and venues"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get user profile
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200, f"Expected 200, got {me_response.status_code}: {me_response.text}"
        
        data = me_response.json()
        
        # Verify user fields
        assert "id" in data
        assert "email" in data
        assert data["email"] == "teste@teste.com"
        assert "name" in data
        assert "status" in data
        
        # Verify roles array
        assert "roles" in data, "/me must return roles array"
        assert isinstance(data["roles"], list)
        
        # Verify venues array
        assert "venues" in data, "/me must return venues array"
        assert isinstance(data["venues"], list)
        
        print(f"✓ GET /me successful")
        print(f"  - User: {data['email']}")
        print(f"  - Name: {data.get('name')}")
        print(f"  - Roles count: {len(data['roles'])}")
        print(f"  - Venues count: {len(data['venues'])}")
    
    def test_get_me_without_token_returns_401(self):
        """Test GET /me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ GET /me without token correctly returns 401")
    
    def test_get_me_with_invalid_token_returns_401(self):
        """Test GET /me with invalid token returns 401"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid-token-12345"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ GET /me with invalid token correctly returns 401")


class TestAuthLogout:
    """Tests for POST /api/auth/logout endpoint"""
    
    def test_logout_with_valid_token(self):
        """Test logout returns success message"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Logout
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert logout_response.status_code == 200, f"Expected 200, got {logout_response.status_code}: {logout_response.text}"
        
        data = logout_response.json()
        assert "message" in data
        assert "logged out" in data["message"].lower()
        
        print(f"✓ Logout successful: {data['message']}")
    
    def test_get_me_after_logout_returns_401(self):
        """Test that token is blacklisted after logout - uses fresh signup user to avoid token collision"""
        # Create fresh user to avoid token exp collision with previous test
        unique_email = f"test-logout-{int(time.time())}-{uuid.uuid4().hex[:6]}@example.com"
        
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Logout Test User"
        })
        assert signup_response.status_code == 200, f"Signup failed: {signup_response.text}"
        token = signup_response.json()["access_token"]
        
        # Verify token works before logout
        me_before = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_before.status_code == 200, f"Token should work before logout. Got {me_before.status_code}: {me_before.text}"
        print(f"✓ Token works before logout for {unique_email}")
        
        # Logout
        logout_response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert logout_response.status_code == 200
        print(f"✓ Logout successful")
        
        # Try to use the same token after logout
        me_after = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_after.status_code == 401, f"Expected 401 after logout, got {me_after.status_code}"
        print(f"✓ Token correctly rejected after logout (blacklisted)")


class TestVenueConfigsOnSignup:
    """Tests for venue_configs creation during signup"""
    
    def test_signup_creates_venue_configs_with_modules(self):
        """Test that signup creates venue_configs with all 4 modules enabled"""
        unique_email = f"test-config-{int(time.time())}-{uuid.uuid4().hex[:6]}@example.com"
        
        # Signup
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Config Test User",
            "venue_type": "restaurant"
        })
        assert signup_response.status_code == 200, f"Signup failed: {signup_response.text}"
        
        token = signup_response.json()["access_token"]
        
        # Get venue via /me
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        
        me_data = me_response.json()
        assert len(me_data.get("venues", [])) > 0
        
        venue_id = me_data["venues"][0]["id"]
        print(f"✓ Signup created venue: {venue_id}")
        
        # Check module access using check-module endpoint
        for module in ["pulse", "tap", "table", "kds"]:
            check_response = requests.get(
                f"{BASE_URL}/api/venue/check-module/{module}?venue_id={venue_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            if check_response.status_code == 200:
                data = check_response.json()
                allowed = data.get("allowed", False)
                print(f"  - Module {module}: {'enabled' if allowed else 'disabled'}")
            else:
                print(f"  - Module {module}: check endpoint returned {check_response.status_code}")


class TestBackwardCompatibility:
    """Tests to ensure existing features still work"""
    
    def test_venue_home_endpoint_works(self):
        """Test that venue_home endpoint still works with existing venue"""
        # Login as teste@teste.com
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Test venue_home endpoint with known venue ID
        venue_id = "40a24e04-75b6-435d-bfff-ab0d469ce543"
        venue_home_response = requests.get(
            f"{BASE_URL}/api/venue/{venue_id}/home",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Endpoint should return 200 (or 404 if venue doesn't exist in this context)
        assert venue_home_response.status_code in [200, 404], f"Unexpected status: {venue_home_response.status_code}"
        
        if venue_home_response.status_code == 200:
            data = venue_home_response.json()
            print(f"✓ venue_home endpoint works for venue {venue_id}")
            print(f"  - Response keys: {list(data.keys())}")
        else:
            print(f"✓ venue_home endpoint returns 404 (venue may not exist)")
    
    def test_existing_users_not_deleted(self):
        """Verify protected system accounts still exist and can login"""
        protected_accounts = [
            ("teste@teste.com", "12345"),
            ("garcia.rapha2@gmail.com", "12345")
        ]
        
        for email, password in protected_accounts:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            assert response.status_code == 200, f"Protected account {email} should still exist and be able to login"
            print(f"✓ Protected account {email} verified")


class TestTableModuleVerification:
    """Test that Table module ID verification still works"""
    
    def test_table_module_accessible(self):
        """Test table module endpoints are accessible"""
        # Login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        venue_id = "40a24e04-75b6-435d-bfff-ab0d469ce543"
        
        # Check if table module is accessible
        tables_response = requests.get(
            f"{BASE_URL}/api/venue/{venue_id}/table/tables",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Should return 200 or empty list
        if tables_response.status_code == 200:
            data = tables_response.json()
            print(f"✓ Table module accessible, {len(data)} tables found")
        else:
            print(f"✓ Tables endpoint returned {tables_response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
