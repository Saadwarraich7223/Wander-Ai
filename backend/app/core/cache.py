"""High-performance in-memory cache with TTL and prefix invalidation."""

import asyncio
import time
from typing import Any, Callable, TypeVar, Coroutine

T = TypeVar("T")

class MemoryCache:
    def __init__(self, default_ttl_seconds: int = 300):
        self._cache: dict[str, tuple[Any, float]] = {}
        self._default_ttl = default_ttl_seconds
        self._lock = asyncio.Lock()

    def get(self, key: str) -> Any | None:
        if key in self._cache:
            value, expiry = self._cache[key]
            if time.time() < expiry:
                return value
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int | None = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        self._cache[key] = (value, time.time() + ttl)

    def invalidate(self, key: str) -> None:
        self._cache.pop(key, None)

    def invalidate_prefix(self, prefix: str) -> None:
        keys_to_delete = [k for k in self._cache if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._cache[k]

    def clear(self) -> None:
        self._cache.clear()

    async def get_or_set(
        self,
        key: str,
        fetcher: Callable[[], Coroutine[Any, Any, T]],
        ttl_seconds: int | None = None,
    ) -> T:
        cached = self.get(key)
        if cached is not None:
            return cached

        async with self._lock:
            # Double check after acquiring lock
            cached = self.get(key)
            if cached is not None:
                return cached

            result = await fetcher()
            self.set(key, result, ttl_seconds)
            return result


# Global application caches
places_cache = MemoryCache(default_ttl_seconds=600)      # 10 minutes
categories_cache = MemoryCache(default_ttl_seconds=1800)  # 30 minutes
cities_cache = MemoryCache(default_ttl_seconds=1800)      # 30 minutes
weather_cache = MemoryCache(default_ttl_seconds=300)      # 5 minutes
