import * as Sentry from "@sentry/nextjs";

/**
 * Observability helper — single call site for server-side error capture.
 *
 * Every API route catch block should call `captureApiError(err, { route, ... })`
 * instead of raw `console.error`. This guarantees:
 *   - Sentry gets the exception with route + tag context for grouping
 *   - Structured console log is emitted (searchable in Vercel logs)
 *   - Sensitive extras are never forwarded (caller controls shape)
 */

export interface ApiErrorContext {
  /** Logical route identifier, e.g. "stripe/payout" or "webhooks/checkr". */
  route: string;
  /** Authenticated user id if available. */
  userId?: string;
  /** Extra structured metadata — never include secrets. */
  extra?: Record<string, unknown>;
}

export function captureApiError(err: unknown, ctx: ApiErrorContext): void {
  // Structured console line so Vercel log search can find it by route.
  // Keep the payload small — Sentry has the full exception.
  const message = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      level: "error",
      route: ctx.route,
      userId: ctx.userId,
      message,
      ...(ctx.extra ?? {}),
    })
  );

  Sentry.withScope((scope) => {
    scope.setTag("route", ctx.route);
    if (ctx.userId) scope.setUser({ id: ctx.userId });
    if (ctx.extra) scope.setContext("extra", ctx.extra);
    Sentry.captureException(err);
  });
}

/**
 * Record a non-fatal event (e.g. "Checkr returned consider status") that we
 * want visibility on in Sentry without crashing the request.
 */
export function captureApiEvent(
  message: string,
  ctx: ApiErrorContext & { level?: "warning" | "info" }
): void {
  const level = ctx.level ?? "warning";
  console.log(
    JSON.stringify({
      level,
      route: ctx.route,
      userId: ctx.userId,
      message,
      ...(ctx.extra ?? {}),
    })
  );

  Sentry.withScope((scope) => {
    scope.setLevel(level);
    scope.setTag("route", ctx.route);
    if (ctx.userId) scope.setUser({ id: ctx.userId });
    if (ctx.extra) scope.setContext("extra", ctx.extra);
    Sentry.captureMessage(message);
  });
}
