import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "crypto";

const STRIPE_API = "https://api.stripe.com/v1";

/**
 * Stripe Connect webhook — handles account.updated events to keep
 * stripe_connect_onboarded in sync without relying on polling.
 */

function verifySignature(
  payload: string,
  sigHeader: string,
  secret: string
): boolean {
  const parts = sigHeader.split(",");
  const timestamp = parts
    .find((p) => p.startsWith("t="))
    ?.split("=")[1];
  const signature = parts
    .find((p) => p.startsWith("v1="))
    ?.split("=")[1];

  if (!timestamp || !signature) return false;

  // Reject events older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SIGNING_SECRET_CONNECT;
  if (!secret) {
    console.error("[stripe-connect-webhook] Missing STRIPE_WEBHOOK_SIGNING_SECRET_CONNECT");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const sigHeader = request.headers.get("stripe-signature");
  if (!sigHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();

  if (!verifySignature(body, sigHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.type !== "account.updated") {
    // Acknowledge but ignore other event types
    return NextResponse.json({ received: true });
  }

  const account = event.data.object;
  const accountId = account.id as string;
  const chargesEnabled = account.charges_enabled === true;

  const admin = createAdminClient();

  // Update whichever table has this Stripe account ID
  // We check all three tables since the webhook doesn't tell us the role
  const updates = await Promise.allSettled([
    admin
      .from("guide_profiles")
      .update({ stripe_connect_onboarded: chargesEnabled })
      .eq("stripe_connect_account_id", accountId),
    admin
      .from("profiles")
      .update({ stripe_connect_onboarded: chargesEnabled })
      .eq("stripe_connect_account_id", accountId),
    admin
      .from("clubs")
      .update({ stripe_connect_onboarded: chargesEnabled })
      .eq("stripe_connect_account_id", accountId),
  ]);

  const errors = updates.filter((r) => r.status === "rejected");
  if (errors.length > 0) {
    console.error("[stripe-connect-webhook] Update errors:", errors);
  }

  console.info(
    `[stripe-connect-webhook] account.updated: ${accountId} charges_enabled=${chargesEnabled}`
  );

  return NextResponse.json({ received: true });
}
