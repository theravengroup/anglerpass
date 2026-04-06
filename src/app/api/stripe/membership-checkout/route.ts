import Stripe from "stripe";
import { z } from "zod";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateCustomer,
  createPaymentIntent,
  stripe,
} from "@/lib/stripe/server";
import { MEMBERSHIP_PROCESSING_FEE_RATE } from "@/lib/constants/fees";

const MembershipCheckoutSchema = z.object({
  clubId: z.string().uuid(),
  /** Stripe Price ID for the recurring dues (created by club admin) */
  duesPriceId: z.string().optional(),
});

/**
 * POST /api/stripe/membership-checkout
 *
 * Handles membership payment:
 * 1. One-time initiation fee via PaymentIntent
 * 2. Recurring annual dues via Subscription (if duesPriceId provided)
 *
 * Processing fee (3.5%) is added to both.
 */
export async function POST(request: Request) {
  const limited = rateLimit("stripe-membership", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = MembershipCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
    }

    const { clubId, duesPriceId } = parsed.data;
    const admin = createAdminClient();

    // Get the club's fee structure
    const { data: club } = await admin
      .from("clubs")
      .select("id, name, initiation_fee, annual_dues")
      .eq("id", clubId)
      .single();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    // Check if user already has a membership with this club
    const { data: existingMembership } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", clubId)
      .eq("user_id", auth.user.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    if (existingMembership?.status === "active") {
      return jsonError("You already have an active membership with this club", 409);
    }

    // Get or create Stripe Customer
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, stripe_customer_id")
      .eq("id", auth.user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      customerId = await getOrCreateCustomer(
        auth.user.id,
        auth.user.email ?? "",
        profile?.display_name ?? undefined
      );

      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", auth.user.id);
    }

    // Use existing pending membership (from join/approve flow) or create new one
    let membershipId: string;

    if (existingMembership?.status === "pending") {
      membershipId = existingMembership.id;
      // Update dues_status to pending for the checkout
      await admin
        .from("club_memberships")
        .update({ dues_status: "pending", updated_at: new Date().toISOString() })
        .eq("id", existingMembership.id);
    } else {
      const { data: membership, error: membershipError } = await admin
        .from("club_memberships")
        .insert({
          club_id: clubId,
          user_id: auth.user.id,
          role: "member",
          status: "pending",
          dues_status: "pending",
        })
        .select("id")
        .single();

      if (membershipError || !membership) {
        console.error("[membership-checkout] Failed to create membership:", membershipError);
        return jsonError("Failed to create membership", 500);
      }
      membershipId = membership.id;
    }

    const result: {
      membershipId: string;
      initiationClientSecret?: string | null;
      subscriptionClientSecret?: string | null;
      initiationAmount?: number;
      duesAmount?: number;
      processingFee?: number;
    } = { membershipId };

    // 1. Initiation fee PaymentIntent
    const initiationFee = club.initiation_fee ?? 0;
    if (initiationFee > 0) {
      const processingFee = Math.round(initiationFee * MEMBERSHIP_PROCESSING_FEE_RATE * 100) / 100;
      const totalCents = Math.round((initiationFee + processingFee) * 100);

      const pi = await createPaymentIntent({
        amountCents: totalCents,
        customerId,
        captureMethod: "automatic",
        metadata: {
          type: "membership_initiation",
          club_id: clubId,
          membership_id: membershipId,
          user_id: auth.user.id,
          initiation_fee: String(initiationFee),
          processing_fee: String(processingFee),
        },
      });

      result.initiationClientSecret = pi.client_secret;
      result.initiationAmount = initiationFee;
      result.processingFee = processingFee;
    }

    // 2. Recurring dues Subscription
    if (duesPriceId) {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: duesPriceId }],
        metadata: {
          type: "membership_dues",
          club_id: clubId,
          membership_id: membershipId,
        },
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
      });

      // Extract the client secret from the subscription's first invoice
      const invoice = subscription.latest_invoice as
        | (Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null })
        | null;
      if (invoice) {
        const pi = invoice.payment_intent;
        if (pi && typeof pi !== "string") {
          result.subscriptionClientSecret = pi.client_secret;
        }
      }

      // Store subscription ID on membership
      await admin
        .from("club_memberships")
        .update({ stripe_subscription_id: subscription.id })
        .eq("id", membershipId);

      result.duesAmount = club.annual_dues ?? 0;
    }

    return jsonOk(result);
  } catch (err) {
    console.error("[stripe/membership-checkout] Error:", err);
    return jsonError("Failed to process membership checkout", 500);
  }
}
