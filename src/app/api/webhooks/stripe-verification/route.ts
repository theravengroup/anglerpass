import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCandidate, createInvitation } from "@/lib/checkr";

const STRIPE_API = "https://api.stripe.com/v1";
const STRIPE_SECRET = () => process.env.STRIPE_SECRET_KEY!;

/**
 * Verify Stripe webhook signature using raw crypto (no SDK).
 * Stripe signs with `whsec_...` and uses HMAC-SHA256 on the
 * `timestamp.payload` string.
 */
async function verifyStripeSignature(
  payload: string,
  sigHeader: string
): Promise<boolean> {
  const secret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET_VERIFICATION;
  if (!secret) {
    console.warn("[stripe-verification] No webhook signing secret configured");
    return false;
  }

  const parts = sigHeader.split(",");
  const timestamp = parts
    .find((p) => p.startsWith("t="))
    ?.substring(2);
  const signatures = parts
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.substring(3));

  if (!timestamp || signatures.length === 0) return false;

  // Check timestamp is within 5 minutes
  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

  const { createHmac } = await import("crypto");
  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return signatures.some((sig) => {
    if (sig.length !== expected.length) return false;
    let result = 0;
    for (let i = 0; i < expected.length; i++) {
      result |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return result === 0;
  });
}

/**
 * POST: Stripe webhook for guide verification payments.
 *
 * Handles `checkout.session.completed` events:
 * 1. Marks verification fee as paid
 * 2. Transitions guide to "pending" status
 * 3. Creates a Checkr candidate and invitation
 * 4. Stores Checkr candidate ID on guide profile
 */
export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const sigHeader = request.headers.get("stripe-signature") ?? "";

    // Verify signature in production
    if (process.env.NODE_ENV === "production") {
      const valid = await verifyStripeSignature(payload, sigHeader);
      if (!valid) {
        console.error("[stripe-verification] Invalid signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(payload);

    if (event.type !== "checkout.session.completed") {
      // Acknowledge but ignore other event types
      return NextResponse.json({ received: true });
    }

    const session = event.data.object;
    const metadata = session.metadata ?? {};

    // Only process guide verification payments
    if (metadata.type !== "guide_verification") {
      return NextResponse.json({ received: true });
    }

    const guideId = metadata.guide_id;
    const userId = metadata.user_id;

    if (!guideId || !userId) {
      console.error("[stripe-verification] Missing metadata:", metadata);
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();

    // Mark fee as paid and transition to pending
    const { error: updateError } = await admin
      .from("guide_profiles")
      .update({
        verification_fee_paid: true,
        verification_fee_session_id: session.id,
        verification_fee_paid_at: new Date().toISOString(),
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", guideId);

    if (updateError) {
      console.error("[stripe-verification] Update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update guide profile" },
        { status: 500 }
      );
    }

    // Log event
    await admin.from("guide_verification_events").insert({
      guide_id: guideId,
      event_type: "fee_paid",
      old_status: "draft",
      new_status: "pending",
      metadata: {
        session_id: session.id,
        amount: session.amount_total,
      },
      actor_id: userId,
    });

    // Initiate Checkr background check
    try {
      // Get user email for Checkr candidate
      const { data: authData } =
        await admin.auth.admin.getUserById(userId);
      const email = authData?.user?.email;

      if (!email) {
        console.error("[stripe-verification] No email for user:", userId);
        return NextResponse.json({ received: true });
      }

      // Get guide's display name for the candidate
      const { data: profile } = await admin
        .from("guide_profiles")
        .select("display_name")
        .eq("id", guideId)
        .maybeSingle();

      const nameParts = (profile?.display_name ?? "").split(" ");
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.slice(1).join(" ") || undefined;

      // Create Checkr candidate
      const candidate = await createCandidate({
        email,
        first_name: firstName,
        last_name: lastName,
      });

      // Create invitation for hosted flow
      const invitation = await createInvitation(candidate.id);

      // Store Checkr IDs on guide profile
      await admin
        .from("guide_profiles")
        .update({
          checkr_candidate_id: candidate.id,
          checkr_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", guideId);

      // Log the Checkr initiation
      await admin.from("guide_verification_events").insert({
        guide_id: guideId,
        event_type: "checkr_initiated",
        old_status: "pending",
        new_status: "pending",
        metadata: {
          candidate_id: candidate.id,
          invitation_url: invitation.invitation_url,
        },
      });

      // Send notification with Checkr invitation link
      const { notify } = await import("@/lib/notifications");
      await notify(admin, {
        userId,
        type: "guide_profile_approved", // reuse type for now
        title: "Complete your background check",
        body: `Your verification fee has been received. Please complete your background check by following the secure link sent to ${email}. This is handled by our partner Checkr and typically takes 2-5 business days.`,
        link: "/guide/verification",
      });
    } catch (checkrErr) {
      // Log but don't fail the webhook — fee is already recorded
      console.error("[stripe-verification] Checkr initiation error:", checkrErr);

      await admin.from("guide_verification_events").insert({
        guide_id: guideId,
        event_type: "checkr_error",
        old_status: "pending",
        new_status: "pending",
        metadata: {
          error: checkrErr instanceof Error ? checkrErr.message : "Unknown error",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-verification] Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
