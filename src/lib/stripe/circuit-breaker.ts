import "server-only";
import { captureApiEvent } from "@/lib/observability";

/**
 * Circuit breaker for Stripe API calls.
 *
 * Why: default Stripe SDK timeout is 80 seconds. If Stripe is degraded,
 * every user request hangs for a full minute before failing — we'd exhaust
 * our Vercel concurrency budget in seconds and the whole app goes down.
 *
 * How: track consecutive infra-level failures across the Lambda instance.
 * After 5 failures in quick succession, trip the breaker for 30s — all
 * subsequent calls immediately throw `CircuitOpenError` (→ 503 to the
 * client) instead of hanging. After the cooldown, the next call is let
 * through; if it succeeds, we fully reset; if it fails, we re-trip.
 *
 * Scope: this is per-Lambda-instance state, not global. That's intentional
 * — it's a bulkhead, not a source of truth. Each instance gets its own
 * read on Stripe's health and recovers independently.
 *
 * What counts as a failure:
 *   - Network errors (fetch rejected)
 *   - Stripe 5xx responses
 *   - Timeouts
 * What does NOT count:
 *   - 4xx responses (invalid card, idempotency conflict, etc) — those
 *     are user/data problems, not Stripe being down. Counting them would
 *     trip the breaker during normal traffic patterns.
 */

const FAILURE_THRESHOLD = 5;
const OPEN_DURATION_MS = 30_000;
const FAILURE_WINDOW_MS = 60_000;

interface BreakerState {
  consecutiveFailures: number;
  firstFailureAt: number;
  openUntil: number;
}

const state: BreakerState = {
  consecutiveFailures: 0,
  firstFailureAt: 0,
  openUntil: 0,
};

export class CircuitOpenError extends Error {
  readonly retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(
      `Stripe circuit open. Retry in ${Math.ceil(retryAfterMs / 1000)}s.`
    );
    this.name = "CircuitOpenError";
    this.retryAfterMs = retryAfterMs;
  }
}

/** True if the error should count toward tripping the breaker. */
function isInfraFailure(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  // Stripe SDK surfaces these as instances with a `type` field. Treat
  // network/timeout/API errors as infra; treat card/validation errors
  // as user errors.
  const e = err as { type?: string; statusCode?: number; code?: string };

  if (e.type === "StripeConnectionError") return true;
  if (e.type === "StripeAPIError") return true;

  // Any 5xx from Stripe is an infra failure.
  if (typeof e.statusCode === "number" && e.statusCode >= 500) return true;

  // Raw fetch/timeout shapes
  if (e.code === "ETIMEDOUT" || e.code === "ECONNRESET") return true;

  if (err instanceof Error) {
    if (
      err.name === "AbortError" ||
      err.message.includes("timeout") ||
      err.message.includes("network")
    ) {
      return true;
    }
  }

  return false;
}

function recordSuccess(): void {
  if (state.consecutiveFailures > 0 || state.openUntil > 0) {
    captureApiEvent("Stripe circuit reset after success", {
      route: "stripe/circuit-breaker",
      level: "info",
      extra: { prior_failures: state.consecutiveFailures },
    });
  }
  state.consecutiveFailures = 0;
  state.firstFailureAt = 0;
  state.openUntil = 0;
}

function recordFailure(err: unknown): void {
  const now = Date.now();

  // Reset the window if failures are stale — a slow trickle of unrelated
  // failures shouldn't trip the breaker.
  if (
    state.firstFailureAt === 0 ||
    now - state.firstFailureAt > FAILURE_WINDOW_MS
  ) {
    state.firstFailureAt = now;
    state.consecutiveFailures = 0;
  }

  state.consecutiveFailures++;

  if (state.consecutiveFailures >= FAILURE_THRESHOLD) {
    state.openUntil = now + OPEN_DURATION_MS;
    captureApiEvent("Stripe circuit tripped OPEN", {
      route: "stripe/circuit-breaker",
      level: "warning",
      extra: {
        failures: state.consecutiveFailures,
        open_for_ms: OPEN_DURATION_MS,
        last_error:
          err instanceof Error ? err.message : String(err),
      },
    });
  }
}

/**
 * Wraps a Stripe operation with circuit-breaker semantics.
 * Throws `CircuitOpenError` immediately if the breaker is open.
 */
export async function withStripeBreaker<T>(
  fn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  if (now < state.openUntil) {
    throw new CircuitOpenError(state.openUntil - now);
  }

  try {
    const result = await fn();
    recordSuccess();
    return result;
  } catch (err) {
    if (isInfraFailure(err)) {
      recordFailure(err);
    }
    throw err;
  }
}

/** Test-only / diagnostic accessor. */
export function getCircuitState(): Readonly<BreakerState> {
  return { ...state };
}
