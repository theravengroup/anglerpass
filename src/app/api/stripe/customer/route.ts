import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateCustomer } from "@/lib/stripe/server";

/**
 * POST /api/stripe/customer
 *
 * Ensures a Stripe Customer exists for the authenticated user.
 * Returns the customer ID (creates one if needed).
 */
export async function POST() {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, stripe_customer_id")
      .eq("id", auth.user.id)
      .single();

    if (profile?.stripe_customer_id) {
      return jsonOk({ customerId: profile.stripe_customer_id });
    }

    const customerId = await getOrCreateCustomer(
      auth.user.id,
      auth.user.email ?? "",
      profile?.display_name ?? undefined
    );

    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", auth.user.id);

    return jsonOk({ customerId });
  } catch (err) {
    console.error("[stripe/customer] Error:", err);
    return jsonError("Failed to create Stripe customer", 500);
  }
}
