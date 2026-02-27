from motor.motor_asyncio import AsyncIOMotorClient
import asyncpg
from typing import Optional
from config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# MongoDB connection (configs, read models, logs)
mongo_client: Optional[AsyncIOMotorClient] = None
mongo_db = None

# Postgres connection pool (billing, subscriptions, ledger, entitlements)
postgres_pool: Optional[asyncpg.Pool] = None

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

async def connect_postgres():
    global postgres_pool
    try:
        postgres_pool = await asyncpg.create_pool(
            settings.postgres_url,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        logger.info("Postgres connected successfully")
    except Exception as e:
        logger.error(f"Postgres connection failed: {e}")
        raise

async def disconnect_mongodb():
    global mongo_client
    if mongo_client:
        mongo_client.close()
        logger.info("MongoDB disconnected")

async def disconnect_postgres():
    global postgres_pool
    if postgres_pool:
        await postgres_pool.close()
        logger.info("Postgres disconnected")

def get_mongo_db():
    if mongo_db is None:
        raise Exception("MongoDB not connected")
    return mongo_db

def get_postgres_pool() -> asyncpg.Pool:
    if postgres_pool is None:
        raise Exception("Postgres pool not initialized")
    return postgres_pool
