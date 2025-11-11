# app/database/connection.py
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import logging
import asyncio

logger = logging.getLogger("uvicorn")

# ────────────────────────────────
# MongoDB Connection Setup
# ────────────────────────────────
client: AsyncIOMotorClient | None = None
db_client: AsyncIOMotorDatabase | None = None


async def connect_to_mongo(max_retries: int = 5, delay: int = 2) -> None:
    """
    Establish connection to MongoDB with retries.
    Called automatically on FastAPI startup.
    """
    global client, db_client

    uri = settings.mongo_uri
    db_name = settings.mongo_db_name

    for attempt in range(1, max_retries + 1):
        try:
            client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
            # Force ping to verify connection
            await client.admin.command("ping")
            db_client = client[db_name]
            logger.info(f"✅ Connected to MongoDB: {db_name}")
            return
        except Exception as e:
            logger.warning(f"⚠️ MongoDB connection failed (attempt {attempt}/{max_retries}): {e}")
            await asyncio.sleep(delay)

    logger.error("❌ Could not connect to MongoDB after several attempts.")
    raise ConnectionError("MongoDB connection failed.")


async def get_db() -> AsyncIOMotorDatabase:
    """
    Dependency function for FastAPI routes.
    Usage: `db = await get_db()`
    """
    global db_client
    if db_client is None:
        await connect_to_mongo()
    return db_client

from app.database.schemas import MONGO_INDEXES

async def ensure_indexes(db):
    for coll_name, idx_list in MONGO_INDEXES.items():
        coll = db[coll_name]
        for idx in idx_list:
            await coll.create_index(idx["keys"], unique=idx.get("unique", False))



async def close_mongo_connection() -> None:
    """
    Gracefully close MongoDB connection.
    Called automatically on FastAPI shutdown.
    """
    global client
    if client:
        client.close()
        logger.info("🛑 MongoDB connection closed.")
