"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Attaches the authenticated user's id + role to Sentry scope so every
 * client-side error is grouped with the user that hit it. Rendered inside
 * authed layouts only — never in public pages.
 *
 * We intentionally only send `id` and `role` — no email, display name, or
 * other PII. That's enough to look up the user internally without leaking
 * identifiers to Sentry.
 */
export default function SentryUserContext({
  userId,
  role,
}: {
  userId: string;
  role: string | null;
}) {
  useEffect(() => {
    Sentry.setUser({ id: userId });
    Sentry.setTag("user_role", role ?? "unknown");
    return () => {
      Sentry.setUser(null);
    };
  }, [userId, role]);

  return null;
}
