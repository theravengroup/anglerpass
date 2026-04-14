import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError } from "@/lib/api/helpers";

/**
 * Feature-flag / kill-switch read path.
 *
 * Design goals:
 *  - **Fast**: every hot API route calls `isEnabled(...)` on entry; the
 *    read must not be a DB round-trip on every request.
 *  - **Short-lived cache**: when an admin flips a switch, the flip must
 *    propagate across the fleet within tens of seconds, not minutes.
 *  - **Fail-open on infra trouble**: if the DB itself is unreachable, we
 *    must not compound the outage by also disabling every gated surface.
 *    We serve the last-known value, and only if we've never seen one we
 *    default to `true` (enabled).
 *
 * The cache is per-instance (module-scoped). On Vercel each Lambda keeps
 * its own map; cold-start lambdas take one round-trip to prime.
 */

export type FeatureFlagKey =
  | "bookings.create"
  | "stripe.payout"
  | "stripe.membership_checkout"
  | "stripe.guide_verification"
  | "stripe.compass_credits"
  | "messaging.send"
  | "guide.verification_submit"
  | "cross_club.agreements"
  | "corporate.invitations"
  | "property.claim"
  | "webhooks.resend"
  | "webhooks.stripe"
  | "webhooks.stripe_verification"
  | "webhooks.checkr";

const CACHE_TTL_MS = 20_000; // 20 seconds — flips propagate quickly

type CacheEntry = { enabled: boolean; fetchedAt: number };
const cache = new Map<string, CacheEntry>();

/**
 * Returns whether a feature is currently enabled. Falls open on any
 * infrastructure error so a flaky DB can't take every route offline.
 */
export async function isEnabled(key: FeatureFlagKey): Promise<boolean> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.enabled;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("feature_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      // Serve stale value if we have one, otherwise fail open.
      return cached?.enabled ?? true;
    }

    // Missing row → treat as enabled (fail-open for new keys that
    // haven't been seeded yet).
    const enabled = data?.enabled ?? true;
    cache.set(key, { enabled, fetchedAt: now });
    return enabled;
  } catch {
    return cached?.enabled ?? true;
  }
}

/**
 * Helper for API routes: short-circuit with 503 when a kill switch is
 * off. Returns the 503 response or `null` if the flag is enabled.
 *
 * Usage:
 *   const blocked = await requireEnabled("bookings.create");
 *   if (blocked) return blocked;
 */
export async function requireEnabled(
  key: FeatureFlagKey,
  message?: string
): Promise<Response | null> {
  const enabled = await isEnabled(key);
  if (enabled) return null;

  return jsonError(
    message ??
      "This feature is temporarily paused for maintenance. Please try again shortly.",
    503
  );
}

/**
 * Bust the cache — called by the admin toggle endpoint so the flipper's
 * own request reflects the change immediately rather than after the TTL.
 */
export function invalidateFeatureFlagCache(key?: FeatureFlagKey) {
  if (key) cache.delete(key);
  else cache.clear();
}
