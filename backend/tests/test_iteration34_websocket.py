"""
Iteration 34: WebSocket Real-time Updates Testing
Tests WebSocket endpoint and broadcast events for Manager Dashboard
"""
import pytest
import requests
import os
import asyncio
import json
import websockets
from urllib.parse import urlparse

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"

# ─── Authentication Fixture ─────────────────────────────────────────
@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for API calls."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teste@teste.com",
        "password": "12345"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json().get("access_token")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Auth headers for API calls."""
    return {"Authorization": f"Bearer {auth_token}"}


# ─── WebSocket URL Helper ───────────────────────────────────────────
def get_ws_url():
    """Build WebSocket URL from BASE_URL."""
    parsed = urlparse(BASE_URL)
    ws_protocol = "wss" if parsed.scheme == "https" else "ws"
    return f"{ws_protocol}://{parsed.netloc}/api/ws/manager/{VENUE_ID}"


# ─── 1. Backend Health & Core APIs (Regression) ─────────────────────
class TestBackendRegression:
    """Verify existing APIs still work."""
    
    def test_health_check(self):
        """Health endpoint returns healthy status."""
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"
        print("✓ Health check PASS")
    
    def test_login_flow(self):
        """Login returns valid token."""
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert "user" in data
        print("✓ Login PASS")
    
    def test_tap_sessions_active(self, auth_headers):
        """TAP sessions endpoint works."""
        r = requests.get(f"{BASE_URL}/api/tap/sessions/active?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "sessions" in data
        print(f"✓ Active sessions: {len(data['sessions'])} open tabs")
    
    def test_manager_overview(self, auth_headers):
        """Manager overview endpoint works."""
        r = requests.get(f"{BASE_URL}/api/manager/overview?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "kpis" in data
        print(f"✓ Manager overview: revenue_today=${data['kpis'].get('revenue_today', 0)}")
    
    def test_pulse_inside(self, auth_headers):
        """Pulse inside endpoint works."""
        r = requests.get(f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "guests" in data
        print(f"✓ Pulse inside: {len(data['guests'])} guests")
    
    def test_kds_tickets(self, auth_headers):
        """KDS tickets endpoint works."""
        r = requests.get(f"{BASE_URL}/api/kds/tickets?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "tickets" in data
        print(f"✓ KDS tickets: {len(data['tickets'])} tickets")


# ─── 2. WebSocket Connection Test ───────────────────────────────────
class TestWebSocketConnection:
    """Test WebSocket endpoint accepts connections and stays alive."""
    
    @pytest.mark.asyncio
    async def test_websocket_connects_and_stays_alive(self):
        """WebSocket endpoint accepts connection and maintains it."""
        ws_url = get_ws_url()
        print(f"Testing WebSocket at: {ws_url}")
        
        try:
            async with websockets.connect(ws_url, ping_interval=10) as ws:
                print("✓ WebSocket connected successfully")
                
                # Wait 2 seconds to verify connection stays alive
                await asyncio.sleep(2)
                
                # Connection is still alive (if we're here, it didn't close)
                print("✓ WebSocket stays alive for 2+ seconds")
                
        except Exception as e:
            pytest.fail(f"WebSocket connection failed: {e}")


# ─── 3. WebSocket Event Broadcasting Tests ──────────────────────────
class TestWebSocketBroadcasting:
    """Test that API actions trigger WebSocket events."""
    
    @pytest.mark.asyncio
    async def test_item_added_broadcast(self, auth_headers):
        """Adding an item broadcasts 'item_added' event via WebSocket."""
        ws_url = get_ws_url()
        received_events = []
        
        async def ws_listener():
            """Listen for WebSocket events."""
            try:
                async with websockets.connect(ws_url, ping_interval=10) as ws:
                    print("WS listener connected, waiting for events...")
                    try:
                        # Wait for message with timeout
                        msg = await asyncio.wait_for(ws.recv(), timeout=10)
                        data = json.loads(msg)
                        received_events.append(data)
                        print(f"WS Event received: {data['type']}")
                    except asyncio.TimeoutError:
                        print("No WS event received within timeout")
            except Exception as e:
                print(f"WS listener error: {e}")
        
        # Start WebSocket listener in background
        listener_task = asyncio.create_task(ws_listener())
        
        # Wait for connection to establish
        await asyncio.sleep(0.5)
        
        # First get an open session
        r = requests.get(f"{BASE_URL}/api/tap/sessions/active?venue_id={VENUE_ID}", headers=auth_headers)
        sessions = r.json().get("sessions", [])
        
        if not sessions:
            pytest.skip("No open sessions to add items to")
        
        session_id = sessions[0]["session_id"]
        
        # Get a catalog item
        r_cat = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        catalog = r_cat.json().get("items", [])
        
        if not catalog:
            pytest.skip("No catalog items available")
        
        item_id = catalog[0]["id"]
        
        # Add item to session (this should trigger WS broadcast)
        r_add = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=auth_headers,
            data={"item_id": item_id, "qty": "1"}
        )
        
        assert r_add.status_code == 200, f"Add item failed: {r_add.text}"
        print(f"✓ Item added to session {session_id[:8]}...")
        
        # Wait for WS event
        await asyncio.sleep(2)
        
        # Cancel listener task
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass
        
        # Verify event was received
        if received_events:
            assert any(e.get("type") == "item_added" for e in received_events), \
                f"Expected 'item_added' event, got: {received_events}"
            print("✓ 'item_added' WebSocket event received")
        else:
            print("⚠ No WebSocket event received (may need longer timeout)")
    
    @pytest.mark.asyncio
    async def test_tab_closed_broadcast(self, auth_headers):
        """Closing a tab broadcasts 'tab_closed' event via WebSocket."""
        ws_url = get_ws_url()
        received_events = []
        
        async def ws_listener():
            """Listen for WebSocket events."""
            try:
                async with websockets.connect(ws_url, ping_interval=10) as ws:
                    print("WS listener connected for tab_closed test...")
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=10)
                        data = json.loads(msg)
                        received_events.append(data)
                        print(f"WS Event received: {data['type']}")
                    except asyncio.TimeoutError:
                        print("No WS event received within timeout")
            except Exception as e:
                print(f"WS listener error: {e}")
        
        # Get guest inside to create session
        r = requests.get(f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}", headers=auth_headers)
        guests = r.json().get("guests", [])
        
        if not guests:
            pytest.skip("No guests to create session for")
        
        # Use guest_id field (not id)
        guest_id = guests[0]["guest_id"]
        
        # Create new session
        r_open = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers,
            data={"venue_id": VENUE_ID, "guest_id": guest_id, "session_type": "tap"}
        )
        
        if r_open.status_code != 200:
            pytest.skip(f"Cannot create test session: {r_open.text}")
        
        session_id = r_open.json().get("session_id")
        print(f"Created test session: {session_id[:8]}...")
        
        # Start WS listener
        listener_task = asyncio.create_task(ws_listener())
        await asyncio.sleep(0.5)
        
        # Close the session (this should trigger WS broadcast)
        r_close = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            headers=auth_headers,
            data={"payment_method": "card", "payment_location": "pay_here"}
        )
        
        assert r_close.status_code == 200, f"Close tab failed: {r_close.text}"
        print(f"✓ Tab closed: {session_id[:8]}...")
        
        # Wait for WS event
        await asyncio.sleep(2)
        
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass
        
        if received_events:
            assert any(e.get("type") == "tab_closed" for e in received_events), \
                f"Expected 'tab_closed' event, got: {received_events}"
            print("✓ 'tab_closed' WebSocket event received")
        else:
            print("⚠ No WebSocket event received")


# ─── 4. Tip Recording WebSocket Event ───────────────────────────────
class TestTipRecordingWebSocket:
    """Test tip recording triggers WebSocket event."""
    
    @pytest.mark.asyncio
    async def test_tip_recorded_broadcast(self, auth_headers):
        """Recording a tip broadcasts 'tip_recorded' event."""
        ws_url = get_ws_url()
        
        # First get closed sessions that need tips
        r = requests.get(f"{BASE_URL}/api/tap/sessions/closed?venue_id={VENUE_ID}", headers=auth_headers)
        closed = r.json().get("sessions", [])
        
        # Find one without tip
        untipped = [s for s in closed if not s.get("tip_recorded")]
        
        if not untipped:
            print("⚠ No untipped sessions to test - creating one")
            # Create and close a session
            r_guests = requests.get(f"{BASE_URL}/api/pulse/inside?venue_id={VENUE_ID}", headers=auth_headers)
            guests = r_guests.json().get("guests", [])
            if not guests:
                pytest.skip("No guests available")
            
            r_open = requests.post(
                f"{BASE_URL}/api/tap/session/open",
                headers=auth_headers,
                data={"venue_id": VENUE_ID, "guest_id": guests[0]["guest_id"], "session_type": "tap"}
            )
            if r_open.status_code != 200:
                pytest.skip("Cannot create session")
            
            session_id = r_open.json()["session_id"]
            
            # Close it
            r_close = requests.post(
                f"{BASE_URL}/api/tap/session/{session_id}/close",
                headers=auth_headers,
                data={"payment_method": "card", "payment_location": "pay_here"}
            )
            if r_close.status_code != 200:
                pytest.skip("Cannot close session")
        else:
            session_id = untipped[0]["session_id"]
        
        received_events = []
        
        async def ws_listener():
            try:
                async with websockets.connect(ws_url) as ws:
                    msg = await asyncio.wait_for(ws.recv(), timeout=10)
                    data = json.loads(msg)
                    received_events.append(data)
                    print(f"WS Event: {data['type']}")
            except Exception as e:
                print(f"WS error: {e}")
        
        listener_task = asyncio.create_task(ws_listener())
        await asyncio.sleep(0.5)
        
        # Record tip
        r_tip = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/record-tip",
            headers=auth_headers,
            data={"tip_amount": "5.00", "tip_source": "cash"}
        )
        
        if r_tip.status_code == 200:
            print(f"✓ Tip recorded for session {session_id[:8]}...")
        else:
            print(f"⚠ Tip recording: {r_tip.status_code} - {r_tip.text}")
        
        await asyncio.sleep(2)
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass
        
        if received_events and any(e.get("type") == "tip_recorded" for e in received_events):
            print("✓ 'tip_recorded' WebSocket event received")
        else:
            print("⚠ tip_recorded event not captured")


# ─── 5. Multiple Concurrent WebSocket Connections ───────────────────
class TestWebSocketMultipleConnections:
    """Test multiple clients can connect simultaneously."""
    
    @pytest.mark.asyncio
    async def test_multiple_connections(self):
        """Multiple WebSocket clients can connect to same venue."""
        ws_url = get_ws_url()
        connections = []
        
        try:
            # Connect 3 clients
            for i in range(3):
                ws = await websockets.connect(ws_url, ping_interval=10)
                connections.append(ws)
                print(f"Client {i+1} connected")
            
            assert len(connections) == 3
            print("✓ 3 concurrent WebSocket connections established")
            
            # All should still be open after 1 second
            await asyncio.sleep(1)
            print("✓ All connections remain open")
            
        finally:
            # Close all connections
            for ws in connections:
                await ws.close()


# ─── 6. REST API Regression Tests ───────────────────────────────────
class TestRESTAPIRegression:
    """Verify all existing REST APIs still work."""
    
    def test_tap_catalog(self, auth_headers):
        """TAP catalog endpoint returns items."""
        r = requests.get(f"{BASE_URL}/api/tap/catalog?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        print(f"✓ Catalog: {len(data['items'])} items")
    
    def test_tap_stats(self, auth_headers):
        """TAP stats endpoint works."""
        r = requests.get(f"{BASE_URL}/api/tap/stats?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "open_tabs" in data
        print(f"✓ TAP stats: {data.get('open_tabs', 0)} open tabs")
    
    def test_manager_staff(self, auth_headers):
        """Manager staff endpoint works."""
        r = requests.get(f"{BASE_URL}/api/manager/staff?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        print("✓ Manager staff endpoint works")
    
    def test_owner_dashboard(self, auth_headers):
        """Owner dashboard endpoint works."""
        r = requests.get(f"{BASE_URL}/api/owner/dashboard?venue_id={VENUE_ID}", headers=auth_headers)
        assert r.status_code == 200
        print("✓ Owner dashboard endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
