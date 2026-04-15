/**
 * Guide verification evaluation logic.
 *
 * Checks all conditions (fee paid, background check clear, credentials valid)
 * and transitions the guide to "verified" status if all pass.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

interface EvaluationResult {
  ready: boolean;
  status: string;
  missing: string[];
}

/**
 * Evaluate whether a guide meets all verification requirements.
 * If all checks pass, transitions the guide to "verified" status.
 *
 * Requirements:
 * 1. Verification fee paid
 * 2. Checkr background check status = "clear"
 * 3. Required credentials uploaded (license, insurance)
 * 4. No expired credentials
 */
export async function evaluateVerification(
  admin: SupabaseClient,
  guideId: string
): Promise<EvaluationResult> {
  const { data: guide, error } = await admin
    .from("guide_profiles")
    .select(
      "id, user_id, status, verification_fee_paid, checkr_status, license_url, insurance_url, first_aid_cert_url, license_expiry, insurance_expiry, first_aid_expiry"
    )
    .eq("id", guideId)
    .maybeSingle();

  if (error || !guide) {
    return { ready: false, status: "not_found", missing: ["Independent guide profile not found"] };
  }

  // Only evaluate guides in pending status
  if (guide.status !== "pending") {
    return { ready: false, status: guide.status, missing: [`Independent guide is in ${guide.status} status, not pending`] };
  }

  const missing: string[] = [];
  const now = new Date();

  // 1. Verification fee
  if (!guide.verification_fee_paid) {
    missing.push("Verification fee not paid");
  }

  // 2. Background check
  if (guide.checkr_status !== "clear") {
    missing.push(`Background check: ${guide.checkr_status ?? "not started"}`);
  }

  // 3. Required credentials
  if (!guide.license_url) {
    missing.push("Independent guide/outfitter license not uploaded");
  }
  if (!guide.insurance_url) {
    missing.push("Liability insurance not uploaded");
  }

  // 4. Credential expiry checks
  if (guide.license_expiry && new Date(guide.license_expiry) <= now) {
    missing.push("Independent guide license has expired");
  }
  if (guide.insurance_expiry && new Date(guide.insurance_expiry) <= now) {
    missing.push("Insurance has expired");
  }
  if (guide.first_aid_expiry && new Date(guide.first_aid_expiry) <= now) {
    missing.push("First aid certification has expired");
  }

  if (missing.length > 0) {
    return { ready: false, status: guide.status, missing };
  }

  // All checks passed — transition to verified
  const { error: updateError } = await admin
    .from("guide_profiles")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", guideId);

  if (updateError) {
    console.error("[guide-verification] Failed to update status:", updateError);
    return { ready: false, status: "pending", missing: ["Database update failed"] };
  }

  // Log the event
  await admin.from("guide_verification_events").insert({
    guide_id: guideId,
    event_type: "auto_verified",
    old_status: "pending",
    new_status: "verified",
    metadata: { trigger: "all_checks_passed" },
  });

  return { ready: true, status: "verified", missing: [] };
}

/**
 * Check if a guide's credentials are all current (not expired).
 * Used by the expiration cron to determine if a live guide should be suspended.
 */
export async function checkCredentialExpiry(
  admin: SupabaseClient,
  guideId: string
): Promise<{ expired: string[]; expiringSoon: { credential: string; daysLeft: number }[] }> {
  const { data: guide } = await admin
    .from("guide_profiles")
    .select(
      "license_expiry, insurance_expiry, first_aid_expiry, uscg_license_expiry, guide_license_expiry"
    )
    .eq("id", guideId)
    .maybeSingle();

  if (!guide) return { expired: [], expiringSoon: [] };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expired: string[] = [];
  const expiringSoon: { credential: string; daysLeft: number }[] = [];

  const credentials: { key: string; label: string }[] = [
    { key: "license_expiry", label: "Independent guide/outfitter license" },
    { key: "insurance_expiry", label: "Liability insurance" },
    { key: "first_aid_expiry", label: "First aid certification" },
    { key: "uscg_license_expiry", label: "USCG license" },
    { key: "guide_license_expiry", label: "Independent guide license" },
  ];

  for (const cred of credentials) {
    const expiry = (guide as Record<string, unknown>)[cred.key] as string | null;
    if (!expiry) continue;

    const expiryDate = new Date(expiry);
    expiryDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft <= 0) {
      expired.push(cred.label);
    } else if (daysLeft <= 60) {
      expiringSoon.push({ credential: cred.label, daysLeft });
    }
  }

  return { expired, expiringSoon };
}
