import Stripe from "stripe";
import { z } from "zod";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateCustomer, stripe } from "@/lib/stripe/server";

const ClubSubscriptionSchema = z.object({
  clubId: z.string().uuid(),
  /** Stripe Price ID for the selected tier */
  priceId: z.string(),
  /** Platform tier name for tracking */
  tier: z.enum(["starter", "standard", "pro"]),
});

/**
 * POST /api/stripe/club-subscription
 *
 * Creates a platform subscription for a club.
 * Tiers: Starter $79/mo, Standard $199/mo, Pro $499/mo.
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = ClubSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
    }

    const { clubId, priceId, tier } = parsed.data;
    const admin = createAdminClient();

    // Verify the user owns this club
    const { data: club } = await admin
      .from("clubs")
      .select("id, owner_id, stripe_subscription_id, name")
      .eq("id", clubId)
      .single();

    if (!club || club.owner_id !== auth.user.id) {
      return jsonError("Forbidden", 403);
    }

    // Check for existing active subscription
    if (club.stripe_subscription_id) {
      // Update existing subscription instead of creating new
      const sub = await stripe.subscriptions.retrieve(club.stripe_subscription_id);

      if (sub.status === "active" || sub.status === "trialing") {
        // Update the price on the existing subscription
        const updatedSub = await stripe.subscriptions.update(
          club.stripe_subscription_id,
          {
            items: [
              {
                id: sub.items.data[0].id,
                price: priceId,
              },
            ],
            metadata: { tier, club_id: clubId },
            proration_behavior: "create_prorations",
          }
        );

        await admin
          .from("clubs")
          .update({
            platform_tier: tier,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clubId);

        return jsonOk({
          subscriptionId: updatedSub.id,
          status: updatedSub.status,
          upgraded: true,
        });
      }
    }

    // Get or create Stripe Customer for the club owner
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

    // Create a new subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        type: "club_platform_subscription",
        club_id: clubId,
        tier,
      },
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
    });

    // Extract client secret for payment
    // The expand parameter returns the full invoice object with nested payment_intent
    let clientSecret: string | null = null;
    const invoice = subscription.latest_invoice as
      | (Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null })
      | null;
    if (invoice) {
      const pi = invoice.payment_intent;
      if (pi && typeof pi !== "string") {
        clientSecret = pi.client_secret;
      }
    }

    // Store subscription on the club
    await admin
      .from("clubs")
      .update({
        stripe_subscription_id: subscription.id,
        platform_tier: tier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clubId);

    // Audit log
    await admin.from("audit_log").insert({
      action: "club.platform_subscription_created",
      entity_type: "club",
      entity_id: clubId,
      actor_id: auth.user.id,
      new_data: {
        subscription_id: subscription.id,
        tier,
        price_id: priceId,
      },
    });

    return jsonOk({
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
    });
  } catch (err) {
    console.error("[stripe/club-subscription] Error:", err);
    return jsonError("Failed to create club subscription", 500);
  }
}
