"use client";

import { useEffect, useState } from "react";
import SmsConsentForm from "@/components/shared/SmsConsentForm";

/**
 * Self-contained SMS consent card for dashboards.
 * Fetches the user's consent status on mount:
 * - If already consented, renders nothing.
 * - If not consented, shows the SmsConsentForm.
 * - Supports dismissal (hidden for the rest of the session).
 */
export default function SmsConsentCard() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/profile/sms-consent");
        if (res.ok) {
          const json = await res.json();
          // Only show if the user has NOT consented
          if (!json.profile?.sms_consent) {
            setShow(true);
          }
        }
      } catch {
        // Silent — don't block the dashboard
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  if (loading || !show) return null;

  return (
    <SmsConsentForm
      onConsented={() => setShow(false)}
      onDismiss={() => setShow(false)}
    />
  );
}
