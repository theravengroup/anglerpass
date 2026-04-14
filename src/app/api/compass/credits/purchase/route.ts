import { requireAuth, jsonError, jsonOk, handleStripeError } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServer, getOrCreateCustomer } from "@/lib/stripe/server";
import { getCreditPack } from "@/lib/constants/compass-usage";
import { compassCreditPurchaseSchema } from "@/lib/validations/compass-usage";
import { requireEnabled } from "@/lib/feature-flags";

/**
 * POST /api/compass/credits/purchase
 * Creates a Stripe PaymentIntent for a credit pack purchase.
 * Returns { clientSecret } for client-side confirmation.
 */
export async function POST(request: Request) {
  const killed = await requireEnabled("stripe.compass_credits");
  if (killed) return killed;

  const auth = await requireAuth();
  if (!auth) {
    return jsonError("Unauthorized", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = compassCreditPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request: packKey is required", 400);
  }

  const pack = getCreditPack(parsed.data.packKey);
  if (!pack) {
    return jsonError("Invalid pack key", 400);
  }

  try {
    const stripe = getStripeServer();
    const typedAdmin = createAdminClient();
    const admin = createAdminClient();

    // Get user email for Stripe customer
    const { data: userData } = await typedAdmin.auth.admin.getUserById(auth.user.id);
    const email = userData?.user?.email ?? "";

    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      auth.user.id,
      email,
      userData?.user?.user_metadata?.display_name
    );

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pack.priceCents,
      currency: "usd",
      customer: customerId,
      capture_method: "automatic",
      metadata: {
        type: "compass_credit_purchase",
        user_id: auth.user.id,
        pack_key: pack.key,
        messages: String(pack.messages),
      },
    });

    // Record pending purchase
    await admin.from("compass_credit_purchases").insert({
      user_id: auth.user.id,
      stripe_payment_intent_id: paymentIntent.id,
      pack_key: pack.key,
      messages_purchased: pack.messages,
      amount_cents: pack.priceCents,
      status: "pending",
    });

    return jsonOk({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const breakerResponse = handleStripeError(err);
    if (breakerResponse) return breakerResponse;
    return jsonError("Failed to create payment", 500);
  }
}
