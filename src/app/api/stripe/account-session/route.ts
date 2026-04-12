import { NextRequest } from "next/server";
import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeServer } from "@/lib/stripe/server";

type EntityType = "guide" | "landowner" | "club";

/**
 * POST /api/stripe/account-session
 *
 * Creates a Stripe Account Session for Connect Embedded Components.
 * Returns { clientSecret } used by the front-end ConnectComponentsProvider.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const body = await request.json();
    const type = body.type as EntityType;

    if (!type || !["guide", "landowner", "club"].includes(type)) {
      return jsonError(
        "Invalid type. Must be guide, landowner, or club.",
        400
      );
    }

    const admin = createAdminClient();
    let stripeAccountId: string | null = null;

    if (type === "guide") {
      const { data } = await admin
        .from("guide_profiles")
        .select("stripe_connect_account_id")
        .eq("user_id", user.id)
        .maybeSingle();
      stripeAccountId = data?.stripe_connect_account_id ?? null;
    } else if (type === "landowner") {
      const { data } = await admin
        .from("profiles")
        .select("stripe_connect_account_id")
        .eq("id", user.id)
        .maybeSingle();
      stripeAccountId = data?.stripe_connect_account_id ?? null;
    } else if (type === "club") {
      const { data } = await admin
        .from("clubs")
        .select("stripe_connect_account_id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      stripeAccountId = data?.stripe_connect_account_id ?? null;
    }

    if (!stripeAccountId) {
      return jsonError("No Stripe Connect account found for this entity.", 404);
    }

    const stripe = getStripeServer();

    const accountSession = await stripe.accountSessions.create({
      account: stripeAccountId,
      components: {
        account_onboarding: { enabled: true },
        // Enable additional embedded components for future use
        balances: { enabled: true },
        payouts: { enabled: true },
        notification_banner: { enabled: true },
        account_management: { enabled: true },
      },
    });

    return jsonOk({ clientSecret: accountSession.client_secret });
  } catch (err) {
    console.error("[stripe/account-session] POST error:", err);
    return jsonError("Failed to create account session", 500);
  }
}
