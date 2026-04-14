import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release:
    process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA ?? undefined,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Don't report expected 4xx or auth-layer rejects as errors.
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
  beforeSend(event, hint) {
    // Scrub any stray Stripe/Supabase raw secrets that might leak into
    // breadcrumbs or request bodies — belt-and-braces on top of server-side
    // redaction.
    const request = event.request;
    if (request?.headers) {
      for (const header of [
        "authorization",
        "cookie",
        "stripe-signature",
        "x-checkr-signature",
        "svix-signature",
      ]) {
        if (header in request.headers) {
          (request.headers as Record<string, string>)[header] = "[redacted]";
        }
      }
    }

    // Drop known-benign upstream disconnects so the on-call isn't paged for
    // client aborts.
    const err = hint.originalException;
    if (err instanceof Error) {
      if (
        err.message.includes("aborted") ||
        err.message.includes("ECONNRESET") ||
        err.name === "AbortError"
      ) {
        return null;
      }
    }

    return event;
  },
});
