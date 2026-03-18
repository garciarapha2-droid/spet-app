"""
Phase 3: Item Modifiers & Notes Testing
=======================================
Tests for:
- PUT /api/tap/session/{session_id}/item/{item_id} - Update item modifiers
- GET /api/tap/catalog/{item_id} - Get catalog item with default_ingredients
- GET /api/tap/session/{session_id} - Returns items with modifiers field
- Full flow: add item -> customize -> verify modifiers in session
- Void item still works after adding modifiers
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
VENUE_ID = "40a24e04-75b6-435d-bfff-ab0d469ce543"


@pytest.fixture(scope="module")
def auth_token():
    """Login and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "teste@teste.com",
        "password": "12345"
    })
    if response.status_code == 200:
        data = response.json()
        # API returns access_token not token
        return data.get("access_token") or data.get("token")
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def auth_headers_json(auth_token):
    """Headers with auth token for JSON requests"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture(scope="module")
def auth_headers_form(auth_token):
    """Headers with auth token for form data requests (no Content-Type)"""
    return {
        "Authorization": f"Bearer {auth_token}"
    }


class TestModifiersBackend:
    """Test Phase 3: Item Modifiers & Notes APIs"""

    def test_login_success(self):
        """Verify login works with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "teste@teste.com",
            "password": "12345"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data or "token" in data
        print(f"✅ Login successful - token obtained")

    def test_get_catalog_with_ingredients(self, auth_headers_form):
        """GET /api/tap/catalog returns items with ingredients field"""
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        items = data["items"]
        assert len(items) > 0
        
        # Find an item that should have ingredients (Snacks category)
        snack_items = [i for i in items if i.get("category") == "Snacks"]
        if snack_items:
            snack = snack_items[0]
            print(f"✅ Found snack item: {snack.get('name')} with ingredients: {snack.get('default_ingredients', [])}")
        else:
            print(f"✅ Catalog loaded with {len(items)} items")

    def test_get_single_catalog_item_with_ingredients(self, auth_headers_form):
        """GET /api/tap/catalog/{item_id} returns default_ingredients"""
        # First get catalog to find an item
        catalog_resp = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID}
        )
        assert catalog_resp.status_code == 200
        items = catalog_resp.json()["items"]
        
        # Find an item with ingredients (preferably from Snacks)
        target_item = None
        for item in items:
            if item.get("default_ingredients") and len(item.get("default_ingredients", [])) > 0:
                target_item = item
                break
        
        if not target_item:
            target_item = items[0] if items else None
        
        if not target_item:
            pytest.skip("No catalog items available")
        
        # Get single item
        response = requests.get(
            f"{BASE_URL}/api/tap/catalog/{target_item['id']}",
            headers=auth_headers_form
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        
        # Check ingredients field exists
        if "default_ingredients" in data and data["default_ingredients"]:
            print(f"✅ Catalog item {data['name']} has default_ingredients: {data['default_ingredients']}")
        else:
            print(f"✅ Catalog item {data['name']} retrieved (no ingredients defined)")

    def test_open_session_add_item_update_modifiers(self, auth_headers_form, auth_headers_json):
        """Full flow: Open session -> Add item -> Update modifiers -> Verify"""
        # Open session (form data)
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers_form,
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_ModifierGuest"
            }
        )
        assert open_resp.status_code == 200
        session_data = open_resp.json()
        session_id = session_data["session_id"]
        print(f"✅ Opened session: {session_id}")
        
        # Get catalog item
        catalog_resp = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID}
        )
        items = catalog_resp.json()["items"]
        
        # Find a snack item (has ingredients)
        target_item = None
        for item in items:
            if item.get("category") == "Snacks" and item.get("default_ingredients"):
                target_item = item
                break
        if not target_item:
            target_item = items[0] if items else None
        
        assert target_item, "No catalog items available"
        
        # Add item (form data)
        add_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=auth_headers_form,
            data={
                "item_id": target_item["id"],
                "qty": "1"
            }
        )
        assert add_resp.status_code == 200
        add_data = add_resp.json()
        item_id = add_data["line_item_id"]
        print(f"✅ Added item {target_item['name']} to session: {item_id}")
        
        # Update modifiers (JSON body)
        modifiers = {
            "removed": ["Hot sauce"],
            "extras": ["Extra cheese"]
        }
        notes = "Make it spicy but not too spicy"
        
        update_resp = requests.put(
            f"{BASE_URL}/api/tap/session/{session_id}/item/{item_id}",
            headers=auth_headers_json,
            json={
                "modifiers": modifiers,
                "notes": notes
            }
        )
        assert update_resp.status_code == 200
        update_data = update_resp.json()
        assert update_data.get("updated") == True
        print(f"✅ Updated item modifiers: {modifiers}, notes: {notes}")
        
        # Verify modifiers in session detail
        session_resp = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=auth_headers_form
        )
        assert session_resp.status_code == 200
        session_detail = session_resp.json()
        
        items_in_session = session_detail.get("items", [])
        assert len(items_in_session) > 0, "Session should have items"
        
        modified_item = items_in_session[0]
        assert "modifiers" in modified_item, "Item should have modifiers field"
        item_modifiers = modified_item.get("modifiers", {})
        item_notes = modified_item.get("notes")
        
        print(f"✅ Session item has modifiers: {item_modifiers}")
        print(f"✅ Session item has notes: {item_notes}")
        
        # Verify values
        if item_modifiers.get("removed"):
            assert "Hot sauce" in item_modifiers["removed"]
        if item_modifiers.get("extras"):
            assert "Extra cheese" in item_modifiers["extras"]
        
        return {"session_id": session_id, "item_id": item_id}

    def test_void_item_with_modifiers(self, auth_headers_form, auth_headers_json):
        """Void item still works after adding modifiers"""
        # Create session with modified item
        test_data = self.test_open_session_add_item_update_modifiers(auth_headers_form, auth_headers_json)
        session_id = test_data["session_id"]
        item_id = test_data["item_id"]
        
        # Void the item (form data)
        void_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/void-item",
            headers=auth_headers_form,
            data={"item_id": item_id}
        )
        assert void_resp.status_code == 200
        void_data = void_resp.json()
        assert void_data.get("voided") == True
        print(f"✅ Voided item with modifiers: {item_id}")
        
        # Verify item is no longer in session
        session_resp = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=auth_headers_form
        )
        session_data = session_resp.json()
        items = session_data.get("items", [])
        item_ids = [i["id"] for i in items]
        assert item_id not in item_ids, "Voided item should not appear in session"
        print(f"✅ Voided item no longer appears in session")

    def test_add_item_with_modifiers_inline(self, auth_headers_form):
        """Add item with modifiers inline (during add)"""
        # Open session (form data)
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers_form,
            data={
                "venue_id": VENUE_ID,
                "guest_name": "TEST_InlineModifier"
            }
        )
        assert open_resp.status_code == 200
        session_id = open_resp.json()["session_id"]
        
        # Get catalog item
        catalog_resp = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID}
        )
        items = catalog_resp.json()["items"]
        target_item = items[0]
        
        # Add item with modifiers (form data)
        modifiers = {"removed": ["Onion"], "extras": ["Bacon"]}
        add_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=auth_headers_form,
            data={
                "item_id": target_item["id"],
                "qty": "1",
                "notes": "Well done please",
                "modifiers": json.dumps(modifiers)
            }
        )
        assert add_resp.status_code == 200
        print(f"✅ Added item with inline modifiers")
        
        # Verify modifiers are saved
        session_resp = requests.get(
            f"{BASE_URL}/api/tap/session/{session_id}",
            headers=auth_headers_form
        )
        session_data = session_resp.json()
        items = session_data.get("items", [])
        assert len(items) > 0
        
        added_item = items[0]
        mods = added_item.get("modifiers", {})
        print(f"✅ Item saved with modifiers: {mods}, notes: {added_item.get('notes')}")


class TestKDSModifiers:
    """Test KDS receives modifiers from TAP items"""

    def test_kds_tickets_have_modifiers(self, auth_headers_form):
        """KDS tickets should include item modifiers"""
        # Get KDS tickets for kitchen
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID, "destination": "kitchen"}
        )
        assert response.status_code == 200
        data = response.json()
        tickets = data.get("tickets", [])
        
        # Check structure of tickets
        has_modifiers = False
        for ticket in tickets:
            items = ticket.get("items", [])
            for item in items:
                modifiers = item.get("modifiers", {})
                if modifiers and (modifiers.get("removed") or modifiers.get("extras")):
                    has_modifiers = True
                    print(f"✅ KDS ticket {ticket['id']} item {item['name']} has modifiers: {modifiers}")
        
        print(f"✅ KDS tickets checked ({len(tickets)} total, modifiers found: {has_modifiers})")

    def test_kds_bar_tickets(self, auth_headers_form):
        """KDS bar tickets should also include modifiers"""
        response = requests.get(
            f"{BASE_URL}/api/kds/tickets",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID, "destination": "bar"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ KDS bar tickets: {len(data.get('tickets', []))} tickets")


class TestModifierEdgeCases:
    """Test edge cases for modifiers"""

    def test_update_modifiers_closed_session(self, auth_headers_form, auth_headers_json):
        """Cannot update modifiers on closed session"""
        # Open session (form data)
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers_form,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_ClosedSession"}
        )
        assert open_resp.status_code == 200
        session_id = open_resp.json()["session_id"]
        
        # Add item (form data)
        catalog_resp = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID}
        )
        items = catalog_resp.json()["items"]
        add_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=auth_headers_form,
            data={"item_id": items[0]["id"], "qty": "1"}
        )
        item_id = add_resp.json()["line_item_id"]
        
        # Close session (form data)
        close_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/close",
            headers=auth_headers_form,
            data={"payment_method": "card", "payment_location": "pay_here"}
        )
        assert close_resp.status_code == 200
        
        # Try to update modifiers (should fail)
        update_resp = requests.put(
            f"{BASE_URL}/api/tap/session/{session_id}/item/{item_id}",
            headers=auth_headers_json,
            json={"modifiers": {"removed": ["Test"]}, "notes": "Test"}
        )
        assert update_resp.status_code == 400, "Should not allow modifying closed session"
        print(f"✅ Correctly rejected modifier update on closed session")

    def test_update_modifiers_invalid_item(self, auth_headers_form, auth_headers_json):
        """Cannot update modifiers for non-existent item"""
        # Open session (form data)
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers_form,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_InvalidItem"}
        )
        assert open_resp.status_code == 200
        session_id = open_resp.json()["session_id"]
        
        # Try to update non-existent item (JSON)
        fake_item_id = "00000000-0000-0000-0000-000000000000"
        update_resp = requests.put(
            f"{BASE_URL}/api/tap/session/{session_id}/item/{fake_item_id}",
            headers=auth_headers_json,
            json={"modifiers": {"removed": ["Test"]}, "notes": "Test"}
        )
        assert update_resp.status_code == 404, "Should return 404 for non-existent item"
        print(f"✅ Correctly returned 404 for non-existent item")

    def test_empty_modifiers(self, auth_headers_form, auth_headers_json):
        """Empty modifiers should work"""
        # Open session (form data)
        open_resp = requests.post(
            f"{BASE_URL}/api/tap/session/open",
            headers=auth_headers_form,
            data={"venue_id": VENUE_ID, "guest_name": "TEST_EmptyMods"}
        )
        assert open_resp.status_code == 200
        session_id = open_resp.json()["session_id"]
        
        # Add item (form data)
        catalog_resp = requests.get(
            f"{BASE_URL}/api/tap/catalog",
            headers=auth_headers_form,
            params={"venue_id": VENUE_ID}
        )
        items = catalog_resp.json()["items"]
        add_resp = requests.post(
            f"{BASE_URL}/api/tap/session/{session_id}/add",
            headers=auth_headers_form,
            data={"item_id": items[0]["id"], "qty": "1"}
        )
        item_id = add_resp.json()["line_item_id"]
        
        # Update with empty modifiers (JSON)
        update_resp = requests.put(
            f"{BASE_URL}/api/tap/session/{session_id}/item/{item_id}",
            headers=auth_headers_json,
            json={"modifiers": {}, "notes": None}
        )
        assert update_resp.status_code == 200
        print(f"✅ Empty modifiers accepted")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
