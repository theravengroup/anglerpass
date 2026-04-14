import { jsonError, jsonOk, requireAuth, handleStripeError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServer, getOrCreateCustomer } from "@/lib/stripe/server";
import { GUIDE_VERIFICATION_FEE_CENTS } from "@/lib/constants/fees";
import { requireEnabled } from "@/lib/feature-flags";
import { captureApiError } from "@/lib/observability";

// ─── GET: Verification status for the authenticated guide ──────────

export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("guide_profiles")
      .select(
        "id, status, verification_fee_paid, checkr_status, checkr_candidate_id, license_url, insurance_url, first_aid_cert_url, guide_license_url, license_expiry, insurance_expiry, first_aid_expiry, guide_license_expiry, verified_at, live_at, rejection_reason, suspended_reason, suspension_type"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return jsonError("Guide profile not found", 404);
    }

    // Determine verification steps
    const steps = {
      profile_complete: !!(profile.license_url && profile.insurance_url),
      fee_paid: !!profile.verification_fee_paid,
      background_check_submitted: !!profile.checkr_candidate_id,
      background_check_clear: profile.checkr_status === "clear",
      verified: ["verified", "live"].includes(profile.status),
      live: profile.status === "live",
    };

    return jsonOk({
      status: profile.status,
      steps,
      checkr_status: profile.checkr_status,
      verified_at: profile.verified_at,
      live_at: profile.live_at,
      rejection_reason: profile.rejection_reason,
      suspended_reason: profile.suspended_reason,
      suspension_type: profile.suspension_type,
    });
  } catch (err) {
    captureApiError(err, { route: "guides/verification" });
    return jsonError("Internal server error", 500);
  }
}

// ─── POST: Initiate verification — creates PaymentIntent for inline payment ─

export async function POST() {
  const killed = await requireEnabled("guide.verification_submit");
  if (killed) return killed;
  const stripeKilled = await requireEnabled("stripe.guide_verification");
  if (stripeKilled) return stripeKilled;

  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("guide_profiles")
      .select(
        "id, status, verification_fee_paid, license_url, insurance_url, display_name"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return jsonError(
        "Guide profile not found. Create your profile first.",
        404
      );
    }

    // Already paid
    if (profile.verification_fee_paid) {
      return jsonError("Verification fee already paid", 409);
    }

    // Must be in draft or rejected status to initiate
    if (!["draft", "rejected"].includes(profile.status)) {
      return jsonError(
        `Cannot initiate verification from ${profile.status} status`,
        400
      );
    }

    // Validate required credentials are uploaded
    if (!profile.license_url || !profile.insurance_url) {
      return jsonError(
        "Please upload your guide license and insurance documents before starting verification",
        400
      );
    }

    const stripe = getStripeServer();

    // Get user email
    const { data: userData } = await admin.auth.admin.getUserById(user.id);
    const email = userData?.user?.email ?? "";

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      user.id,
      email,
      profile.display_name ?? undefined
    );

    // Create PaymentIntent for inline payment via Elements
    const paymentIntent = await stripe.paymentIntents.create({
      amount: GUIDE_VERIFICATION_FEE_CENTS,
      currency: "usd",
      customer: customerId,
      capture_method: "automatic",
      metadata: {
        type: "guide_verification",
        guide_id: profile.id,
        user_id: user.id,
      },
    });

    // Store the session reference on the profile for webhook reconciliation
    await admin
      .from("guide_profiles")
      .update({ verification_fee_session_id: paymentIntent.id })
      .eq("id", profile.id);

    return jsonOk({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const breakerResponse = handleStripeError(err);
    if (breakerResponse) return breakerResponse;
    captureApiError(err, { route: "guides/verification" });
    return jsonError("Failed to create payment", 500);
  }
}
