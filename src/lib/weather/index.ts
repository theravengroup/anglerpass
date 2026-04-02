/**
 * AnglerPass Weather Service
 *
 * Public interface for fetching property weather forecasts.
 * Handles caching (in-memory, ~45 minute TTL) and provider abstraction.
 *
 * Currently backed by the NWS/NOAA API. To swap providers, only the
 * import and call inside `fetchFresh()` needs to change — the returned
 * PropertyForecast shape stays identical.
 */

import type { PropertyForecast } from "./types";
import { fetchNwsForecast } from "./nws";

export type {
  PropertyForecast,
  ForecastDay,
  ForecastHour,
  WeatherCondition,
  FishingCondition,
} from "./types";

/* ═══════════════════════════════════════════════════════════════════════
   CACHE
   ═══════════════════════════════════════════════════════════════════════ */

const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes

interface CacheEntry {
  forecast: PropertyForecast;
  expiresAt: number;
}

/** In-memory forecast cache keyed by "lat,lng" (rounded to 2 decimals). */
const cache = new Map<string, CacheEntry>();

/** Round coordinates to 2 decimal places (~1.1 km precision). */
function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

/* ═══════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Get the 7-day forecast for a property's coordinates.
 *
 * Returns cached data if fresh, otherwise fetches from NWS.
 * Returns null if the forecast is unavailable (API down, unsupported location, etc.)
 */
export async function getPropertyForecast(
  latitude: number,
  longitude: number
): Promise<PropertyForecast | null> {
  const key = cacheKey(latitude, longitude);

  // Check cache
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.forecast;
  }

  // Fetch fresh
  const forecast = await fetchFresh(latitude, longitude);

  if (forecast) {
    cache.set(key, {
      forecast,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    // Prune old entries periodically (keep cache bounded)
    if (cache.size > 500) {
      pruneCache();
    }
  }

  return forecast;
}

/* ═══════════════════════════════════════════════════════════════════════
   INTERNALS
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Fetch a fresh forecast from the weather provider.
 * This is the only place the provider is called — swap here to change providers.
 */
async function fetchFresh(
  latitude: number,
  longitude: number
): Promise<PropertyForecast | null> {
  return fetchNwsForecast(latitude, longitude);
}

/** Remove expired entries from the cache. */
function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}
