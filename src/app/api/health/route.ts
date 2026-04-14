import { createAdminClient } from "@/lib/supabase/admin";
import { getCircuitState } from "@/lib/stripe/circuit-breaker";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

/**
 * GET /api/health — lightweight health probe for synthetic monitoring.
 *
 * Returns 200 only if:
 *   - Database is reachable (single SELECT 1 equivalent via a cheap read)
 *   - Stripe circuit breaker is not tripped open
 *
 * Returns 503 if any dependency is unhealthy, with a JSON body identifying
 * which check failed. Safe to poll every 5s from external monitors — the
 * DB check hits a single indexed row.
 *
 * This endpoint is intentionally public. It returns zero PII and zero
 * business data.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface HealthReport {
  ok: boolean;
  checks: {
    database: "ok" | "fail";
    stripe: "ok" | "circuit_open";
  };
  release?: string;
  env?: string;
}

export async function GET(request: Request) {
  const limited = rateLimit("health", getClientIp(request), 60, 60_000);
  if (limited) return limited;

  const report: HealthReport = {
    ok: true,
    checks: {
      database: "ok",
      stripe: "ok",
    },
    release:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.SENTRY_RELEASE ??
      undefined,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  };

  // ── DB probe ────────────────────────────────────────────────────
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("feature_flags")
      .select("key")
      .limit(1);
    if (error) throw error;
  } catch {
    report.ok = false;
    report.checks.database = "fail";
  }

  // ── Stripe circuit ──────────────────────────────────────────────
  const breaker = getCircuitState();
  if (breaker.openUntil > Date.now()) {
    report.ok = false;
    report.checks.stripe = "circuit_open";
  }

  return Response.json(report, {
    status: report.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
