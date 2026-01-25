import redis.asyncio as redis
import json
import os
from typing import Optional, Dict, Any

redis_client = None

async def init_redis():
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(redis_url, decode_responses=True)

async def get_rate_limit(key: str) -> Optional[int]:
    if not redis_client: return None
    value = await redis_client.get(key)
    return int(value) if value else None

async def increment_rate_limit(key: str, limit: int = 10, window: int = 60):
    if not redis_client: return True
    return await redis_client.incr(key) <= limit

async def set_rate_limit(key: str, value: int, expiry: int = 60):
    if redis_client:
        await redis_client.setex(key, expiry, value)

async def publish_market_update(market_id: str, data: Dict[str, Any]):
    if redis_client:
        await redis_client.publish(f"market:{market_id}", json.dumps(data))

async def get_live_cache(key: str) -> Optional[Dict[str, Any]]:
    if not redis_client: return None
    data = await redis_client.get(key)
    return json.loads(data) if data else None

async def set_live_cache(key: str, data: Dict[str, Any], expiry: int = 300):
    if redis_client:
        await redis_client.setex(key, expiry, json.dumps(data))
