#!/usr/bin/env python3
"""
Initialize SPETAP database with collections and test data
Run this once to set up the database
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from utils.auth import hash_password
from datetime import datetime, timezone
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'spetap_db')

async def init_database():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Initializing SPETAP database...")
    
    # Create collections with indexes
    collections = [
        'users', 'companies', 'user_access', 'subscriptions', 'entitlements',
        'invoice_events', 'payment_transactions', 'global_persons',
        'venues', 'spaces', 'events', 'venue_guests', 'nfc_cards',
        'catalog_items', 'catalog_categories', 'kds_stations', 
        'kds_tickets', 'tables', 'entry_events', 'tap_sessions',
        'tap_items', 'tap_payments', 'wallet_transactions', 'event_wallets',
        'audit_events'
    ]
    
    for collection_name in collections:
        if collection_name not in await db.list_collection_names():
            await db.create_collection(collection_name)
            print(f"Created collection: {collection_name}")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.companies.create_index("stripe_customer_id", unique=True, sparse=True)
    await db.user_access.create_index([("user_id", 1), ("company_id", 1)])
    await db.subscriptions.create_index("company_id")
    await db.entitlements.create_index([("company_id", 1), ("module", 1)])
    await db.invoice_events.create_index("stripe_event_id", unique=True)
    await db.venue_guests.create_index([("venue_id", 1), ("email", 1)])
    await db.tap_sessions.create_index([("venue_id", 1), ("status", 1)])
    
    print("Indexes created successfully")
    
    # Create test user: Teste@teste / 1234
    test_email = "teste@teste"
    existing_user = await db.users.find_one({"email": test_email})
    
    if not existing_user:
        user_id = str(uuid.uuid4())
        company_id = str(uuid.uuid4())
        venue_id = str(uuid.uuid4())
        space_id = str(uuid.uuid4())
        event_id = str(uuid.uuid4())
        
        # Create user
        await db.users.insert_one({
            "id": user_id,
            "email": test_email,
            "password_hash": hash_password("1234"),
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "last_login_at": None
        })
        print(f"Created test user: {test_email} / 1234")
        
        # Create company
        await db.companies.insert_one({
            "id": company_id,
            "name": "Test Company",
            "stripe_customer_id": None,
            "status": "active",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        print(f"Created test company")
        
        # Give user owner access
        await db.user_access.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "company_id": company_id,
            "venue_id": None,
            "role": "owner",
            "permissions": {"HOST_COLLECT_DOB": True},
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create test venue
        await db.venues.insert_one({
            "id": venue_id,
            "company_id": company_id,
            "name": "Test Venue",
            "type": "nightclub",
            "timezone": "America/New_York",
            "currency": "usd",
            "settings": {
                "host_mode": "club",
                "bar_mode": "nightclub",
                "require_age_check": True,
                "require_identity_gate": True
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        })
        print(f"Created test venue")
        
        # Create test space
        await db.spaces.insert_one({
            "id": space_id,
            "venue_id": venue_id,
            "name": "Main Room",
            "created_at": datetime.now(timezone.utc)
        })
        
        # Create test event
        await db.events.insert_one({
            "id": event_id,
            "venue_id": venue_id,
            "space_id": space_id,
            "name": "Saturday Night",
            "start_at": datetime.now(timezone.utc),
            "end_at": None,
            "cover_price": 20.00,
            "cover_consumption_price": 40.00,
            "card_mode": "temporary",
            "is_active": True,
            "created_at": datetime.now(timezone.utc)
        })
        print(f"Created test event")
        
        # Create sample catalog items
        items = [
            {"name": "Beer", "category": "Drinks", "price": 8.00, "is_alcohol": True},
            {"name": "Vodka Soda", "category": "Drinks", "price": 12.00, "is_alcohol": True},
            {"name": "Burger", "category": "Food", "price": 15.00, "is_alcohol": False},
            {"name": "Fries", "category": "Food", "price": 7.00, "is_alcohol": False}
        ]
        
        for item in items:
            await db.catalog_items.insert_one({
                "id": str(uuid.uuid4()),
                "venue_id": venue_id,
                "name": item["name"],
                "category": item["category"],
                "price": item["price"],
                "is_alcohol": item["is_alcohol"],
                "send_to_kds": item["category"] == "Food",
                "kds_station_id": None,
                "prep_time_min": 10 if item["category"] == "Food" else None,
                "photo_url": None,
                "description": None,
                "active": True,
                "created_at": datetime.now(timezone.utc)
            })
        
        print(f"Created sample catalog items")
        
        # Create entitlements (give all modules for testing)
        modules = ['pulse', 'tap', 'restaurant', 'loyalty', 'event_wallet']
        for module in modules:
            await db.entitlements.insert_one({
                "id": str(uuid.uuid4()),
                "company_id": company_id,
                "venue_id": venue_id,
                "scope": "venue",
                "module": module,
                "status": "active",
                "active_from": datetime.now(timezone.utc),
                "active_until": None,
                "subscription_id": None,
                "config": {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            })
        
        print(f"Created test entitlements")
    else:
        print(f"Test user already exists: {test_email}")
    
    print("\n✅ Database initialization complete!")
    print(f"\nLogin credentials:")
    print(f"Email: teste@teste")
    print(f"Password: 1234")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
