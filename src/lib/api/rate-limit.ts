import "server-only";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Simple in-memory rate limiter for public API endpoints.
 *
 * @param key - A namespace to separate rate limits (e.g. "leads", "search")
 * @param identifier - The client identifier (usually IP address)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns null if allowed, or a Response (429) if rate limited
 */
export function rateLimit(
  key: string,
  identifier: string,
  limit: number,
  windowMs: number
): Response | null {
  if (!stores.has(key)) {
    stores.set(key, new Map());
  }

  const store = stores.get(key)!;
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  return null;
}

/**
 * Extract client IP from request headers.
 * Works with Vercel (x-forwarded-for) and direct connections.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
