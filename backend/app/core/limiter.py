import redis
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import settings

def create_limiter() -> Limiter:
    """Create Limiter instance with Redis storage or in-memory fallback."""
    storage_uri = settings.REDIS_URL
    if storage_uri.startswith("redis://") or storage_uri.startswith("rediss://"):
        try:
            r = redis.from_url(storage_uri, socket_connect_timeout=1)
            r.ping()
        except Exception:
            # Fallback to in-memory limiting if Redis is unreachable (e.g. local unit tests)
            storage_uri = "memory://"

    return Limiter(
        key_func=get_remote_address,
        default_limits=[settings.DEFAULT_RATE_LIMIT],
        storage_uri=storage_uri,
        strategy="fixed-window"
    )

limiter = create_limiter()

