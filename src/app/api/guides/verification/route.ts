import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { GUIDE_VERIFICATION_FEE_CENTS } from "@/lib/constants/fees";
import { SITE_URL } from "@/lib/constants";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_SECRET = () => process.env.STRIPE_SECRET_KEY!;

async function stripePost(path: string, body: Record<string, string>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Stripe API error");
  }
  return res.json();
}

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
      .single();

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
    console.error("[guides/verification] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ─── POST: Initiate verification — creates Stripe Checkout Session ─

export async function POST() {
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
      .single();

    if (!profile) {
      return jsonError("Guide profile not found. Create your profile first.", 404);
    }

    // Already paid
    if (profile.verification_fee_paid) {
      return jsonError("Verification fee already paid", 409);
    }

    // Must be in draft or rejected status to initiate
    if (!["draft", "rejected"].includes(profile.status)) {
      return jsonError(`Cannot initiate verification from ${profile.status} status`, 400);
    }

    // Validate required credentials are uploaded
    if (!profile.license_url || !profile.insurance_url) {
      return jsonError("Please upload your guide license and insurance documents before starting verification", 400);
    }

    // Create Stripe Checkout Session for one-time verification fee
    const session = await stripePost("/checkout/sessions", {
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]":
        "AnglerPass Guide Verification",
      "line_items[0][price_data][product_data][description]":
        "One-time background check and verification fee",
      "line_items[0][price_data][unit_amount]": String(
        GUIDE_VERIFICATION_FEE_CENTS
      ),
      "line_items[0][quantity]": "1",
      customer_email: user.email ?? "",
      success_url: `${SITE_URL}/guide/verification?payment=success`,
      cancel_url: `${SITE_URL}/guide/verification?payment=cancelled`,
      "metadata[guide_id]": profile.id,
      "metadata[user_id]": user.id,
      "metadata[type]": "guide_verification",
    });

    return jsonOk({ url: session.url });
  } catch (err) {
    console.error("[guides/verification] POST error:", err);
    return jsonError("Failed to create checkout session", 500);
  }
}
