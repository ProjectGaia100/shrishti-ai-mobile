// ─── Simple Weather Data Cache ──────────────────────────────────────────────
// Caches weather data in memory to avoid unnecessary API calls

import { CACHE_TTL_MS } from '../constants/AppConstants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL = CACHE_TTL_MS;

export function getCached<T>(key: string, ttl: number = DEFAULT_TTL): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > ttl) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

export function getCacheKey(lat: number, lon: number): string {
  return `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
}
