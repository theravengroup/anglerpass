import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  smsConsentSchema,
  SMS_CONSENT_DISCLOSURE,
  normalizePhone,
} from "@/lib/validations/sms-consent";

/**
 * POST — Record SMS consent (TCPA-compliant).
 * Stores the exact disclosure text, timestamp, and IP for legal proof.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await request.json();
  const parsed = smsConsentSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0].message, 400);
  }

  if (!parsed.data.consented) {
    return jsonError("Consent must be true to opt in", 400);
  }

  const phone = normalizePhone(parsed.data.phone);

  // Resolve IP for TCPA record
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .update({
      phone,
      sms_consent: true,
      sms_consent_at: new Date().toISOString(),
      sms_consent_ip: ip,
      sms_consent_text: SMS_CONSENT_DISCLOSURE,
      sms_consent_revoked_at: null,
    })
    .eq("id", auth.user.id)
    .select("id, phone, sms_consent, sms_consent_at")
    .single();

  if (error) {
    console.error("[sms-consent] Update error:", error);
    return jsonError("Failed to save SMS consent", 500);
  }

  return jsonOk({ profile });
}

/**
 * DELETE — Revoke SMS consent.
 * Keeps the original consent record (sms_consent_at, sms_consent_ip, sms_consent_text)
 * intact for legal audit trail. Only flips the flag and stamps the revocation time.
 */
export async function DELETE() {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .update({
      sms_consent: false,
      sms_consent_revoked_at: new Date().toISOString(),
    })
    .eq("id", auth.user.id)
    .select("id, phone, sms_consent, sms_consent_revoked_at")
    .single();

  if (error) {
    console.error("[sms-consent] Revoke error:", error);
    return jsonError("Failed to revoke SMS consent", 500);
  }

  return jsonOk({ profile });
}

/**
 * GET — Check current SMS consent status.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, phone, sms_consent, sms_consent_at, sms_consent_revoked_at")
    .eq("id", auth.user.id)
    .single();

  if (error) {
    console.error("[sms-consent] Fetch error:", error);
    return jsonError("Failed to load SMS consent status", 500);
  }

  return jsonOk({ profile });
}
