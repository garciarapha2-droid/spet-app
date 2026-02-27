from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# MongoDB connection
mongo_client: Optional[AsyncIOMotorClient] = None
mongo_db = None

async def connect_mongodb():
    global mongo_client, mongo_db
    try:
        mongo_client = AsyncIOMotorClient(settings.mongo_url)
        mongo_db = mongo_client[settings.db_name]
        # Test connection
        await mongo_client.admin.command('ping')
        logger.info("MongoDB connected successfully")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise

async def disconnect_mongodb():
    global mongo_client
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB disconnected")

def get_mongo_db():
    if mongo_db is None:
        raise Exception("MongoDB not connected")
    return mongo_db

