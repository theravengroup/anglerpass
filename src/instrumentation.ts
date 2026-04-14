import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Next.js 15+ hook: fires for any unhandled error thrown during a server
 * request (route handlers, RSC, Server Actions). Attaches the route,
 * HTTP method, and request path so Sentry issues group by endpoint.
 */
export const onRequestError: typeof Sentry.captureRequestError =
  Sentry.captureRequestError;
