import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  release:
    process.env.NEXT_PUBLIC_SENTRY_RELEASE ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    undefined,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask sensitive text by default — we never want PII in replays.
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
  ignoreErrors: [
    // Browser noise
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // Expected Next.js router behavior
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    // Extension / adblock noise
    /chrome-extension:/,
    /moz-extension:/,
  ],
  beforeSend(event) {
    // Drop events from bots/crawlers — they inflate error counts without
    // representing real users.
    const ua =
      typeof navigator !== "undefined" ? navigator.userAgent ?? "" : "";
    if (/bot|crawler|spider|Googlebot|bingbot/i.test(ua)) return null;
    return event;
  },
});
