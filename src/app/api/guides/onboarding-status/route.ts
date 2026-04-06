import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/api/helpers";

/**
 * GET /api/guides/onboarding-status
 *
 * Returns the guide's current onboarding state so the dashboard
 * knows what to render:
 *
 *   "no_profile"          → Show "Create your guide profile" card
 *   "profile_incomplete"  → Show checklist (profile saved but docs missing)
 *   "ready_to_verify"     → Profile + docs done, prompt to pay verification fee
 *   "pending"             → Background check in progress
 *   "verified"            → Awaiting admin review
 *   "payout_needed"       → Live but no payout account connected
 *   "active"              → Fully operational
 *   "rejected"            → Show rejection reason + resubmit CTA
 *   "suspended"           → Show suspension info
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();

    // Fetch guide profile
    const { data: profile } = await admin
      .from("guide_profiles")
      .select(
        "id, status, display_name, bio, license_url, insurance_url, rate_full_day, rate_half_day, techniques, verification_fee_paid, rejection_reason, suspended_reason, suspension_type, stripe_connect_account_id, stripe_connect_onboarded"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return jsonOk({ state: "no_profile" });
    }

    // Check completeness
    const hasProfile = !!(profile.display_name && (profile.rate_full_day || profile.rate_half_day));
    const hasDocs = !!(profile.license_url && profile.insurance_url);
    const hasPayoutSetup = !!(profile.stripe_connect_account_id && profile.stripe_connect_onboarded);

    if (profile.status === "suspended") {
      return jsonOk({
        state: "suspended",
        profile: {
          display_name: profile.display_name,
          suspended_reason: profile.suspended_reason,
          suspension_type: profile.suspension_type,
        },
      });
    }

    if (profile.status === "rejected") {
      return jsonOk({
        state: "rejected",
        profile: {
          display_name: profile.display_name,
          rejection_reason: profile.rejection_reason,
        },
      });
    }

    if (profile.status === "live") {
      if (!hasPayoutSetup) {
        return jsonOk({
          state: "payout_needed",
          profile: { display_name: profile.display_name },
        });
      }
      return jsonOk({ state: "active" });
    }

    if (profile.status === "verified") {
      return jsonOk({
        state: "verified",
        profile: { display_name: profile.display_name },
      });
    }

    if (profile.status === "pending") {
      return jsonOk({
        state: "pending",
        profile: { display_name: profile.display_name },
      });
    }

    // Draft status — determine which sub-state
    if (!hasProfile) {
      return jsonOk({
        state: "profile_incomplete",
        profile: { display_name: profile.display_name },
        checklist: {
          has_profile: false,
          has_docs: hasDocs,
          fee_paid: !!profile.verification_fee_paid,
        },
      });
    }

    if (!hasDocs) {
      return jsonOk({
        state: "profile_incomplete",
        profile: { display_name: profile.display_name },
        checklist: {
          has_profile: true,
          has_docs: false,
          fee_paid: !!profile.verification_fee_paid,
        },
      });
    }

    // Profile + docs done → ready to pay and verify
    return jsonOk({
      state: "ready_to_verify",
      profile: { display_name: profile.display_name },
      checklist: {
        has_profile: true,
        has_docs: true,
        fee_paid: !!profile.verification_fee_paid,
      },
    });
  } catch (err) {
    console.error("[guides/onboarding-status] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
