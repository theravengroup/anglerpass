import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateCustomer, createSetupIntent } from "@/lib/stripe/server";

/**
 * POST /api/stripe/setup-intent
 *
 * Creates a SetupIntent so the user can save a payment method
 * (card or bank account) without being charged.
 */
export async function POST(request: Request) {
  const limited = rateLimit("stripe-setup-intent", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, stripe_customer_id")
      .eq("id", auth.user.id)
      .single();

    // Get or create a Stripe Customer
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      customerId = await getOrCreateCustomer(
        auth.user.id,
        auth.user.email ?? "",
        profile?.display_name ?? undefined
      );

      // Persist the customer ID
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", auth.user.id);
    }

    const setupIntent = await createSetupIntent(customerId);

    return jsonOk({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    console.error("[stripe/setup-intent] Error:", err);
    return jsonError("Failed to create setup intent", 500);
  }
}
