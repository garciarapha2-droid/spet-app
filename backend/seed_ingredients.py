import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def seed_ingredients():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL', 'mongodb://localhost:27017'))
    db = client['spetap_db']

    INGREDIENTS = {
        'Fish and Chips': ['Fish fillet', 'French fries', 'Tartar sauce', 'Lemon', 'Coleslaw'],
        'Nachos': ['Tortilla chips', 'Cheddar cheese', 'Jalapenos', 'Sour cream', 'Salsa', 'Guacamole'],
        'Burger': ['Beef patty', 'Brioche bun', 'Lettuce', 'Tomato', 'Onion', 'Pickles', 'Ketchup', 'Mustard'],
        'Caesar Salad': ['Romaine lettuce', 'Parmesan', 'Croutons', 'Caesar dressing', 'Anchovies'],
        'Wings': ['Chicken wings', 'Hot sauce', 'Celery sticks', 'Blue cheese dip'],
        'Sliders': ['Mini beef patties', 'Brioche buns', 'Pickles', 'Onion', 'Cheese', 'Ketchup'],
        'Steak': ['Ribeye steak', 'Butter', 'Garlic', 'Rosemary', 'Salt', 'Pepper'],
        'Pasta': ['Penne', 'Tomato sauce', 'Parmesan', 'Basil', 'Garlic', 'Olive oil'],
        'Pizza': ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Basil', 'Olive oil'],
        'Salmon': ['Salmon fillet', 'Lemon', 'Dill', 'Butter', 'Asparagus'],
        'Club Sandwich': ['Turkey', 'Bacon', 'Lettuce', 'Tomato', 'Mayo', 'Toast bread'],
        'Mozzarella Sticks': ['Mozzarella', 'Breadcrumbs', 'Marinara sauce', 'Basil'],
        'Onion Rings': ['Onion', 'Beer batter', 'Ranch dip'],
        'Tacos': ['Corn tortillas', 'Beef', 'Lettuce', 'Cheese', 'Salsa', 'Sour cream', 'Cilantro'],
        'Quesadilla': ['Flour tortilla', 'Cheese', 'Chicken', 'Peppers', 'Sour cream'],
    }

    updated = 0
    for name, ingredients in INGREDIENTS.items():
        result = await db.venue_catalog.update_many(
            {"name": {"$regex": name, "$options": "i"}},
            {"$set": {"default_ingredients": ingredients}}
        )
        if result.modified_count > 0:
            updated += result.modified_count
            print(f"  Updated {name}: {result.modified_count} items")

    # Drinks get simple defaults
    CATEGORY_DEFAULTS = {
        "Beers": ["Beer"],
        "Cocktails": ["Base spirit", "Mixer", "Ice", "Garnish"],
        "Spirits": ["Spirit", "Ice"],
        "Non-alcoholic": ["Beverage"],
    }
    for cat, ingr in CATEGORY_DEFAULTS.items():
        result = await db.venue_catalog.update_many(
            {"category": cat, "default_ingredients": {"$exists": False}},
            {"$set": {"default_ingredients": ingr}}
        )
        if result.modified_count > 0:
            updated += result.modified_count

    # Set empty for remaining
    result = await db.venue_catalog.update_many(
        {"default_ingredients": {"$exists": False}},
        {"$set": {"default_ingredients": []}}
    )
    updated += result.modified_count

    print(f"Total updated: {updated}")
    client.close()

asyncio.run(seed_ingredients())
