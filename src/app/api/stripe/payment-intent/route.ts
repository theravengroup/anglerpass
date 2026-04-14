import { jsonOk, jsonError, requireAuth, handleStripeError } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateCustomer,
  createPaymentIntent,
} from "@/lib/stripe/server";
import { createPaymentIntentSchema } from "@/lib/validations/stripe";

/**
 * POST /api/stripe/payment-intent
 *
 * Creates a PaymentIntent with manual capture for a booking.
 * The hold is placed immediately; capture happens after trip completion.
 */
export async function POST(request: Request) {
  const limited = rateLimit("stripe-payment-intent", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = createPaymentIntentSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
    }

    const { bookingId, amountCents, platformFeeCents } = parsed.data;
    const admin = createAdminClient();

    // Verify the booking belongs to this user and is in the right state
    const { data: booking } = await admin
      .from("bookings")
      .select("id, angler_id, payment_status")
      .eq("id", bookingId)
      .eq("angler_id", auth.user.id)
      .maybeSingle();

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (booking.payment_status !== "unpaid") {
      return jsonError("Booking already has a payment", 409);
    }

    // Get or create the Stripe Customer
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, stripe_customer_id")
      .eq("id", auth.user.id)
      .maybeSingle();

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

    // Create the PaymentIntent with manual capture (authorize only)
    const paymentIntent = await createPaymentIntent({
      amountCents,
      customerId,
      captureMethod: "manual",
      transferGroup: `booking_${bookingId}`,
      metadata: {
        booking_id: bookingId,
        angler_id: auth.user.id,
        platform_fee_cents: String(platformFeeCents),
      },
    });

    // Store the PaymentIntent ID on the booking
    await admin
      .from("bookings")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: amountCents,
        platform_fee_cents: platformFeeCents,
        payment_status: "unpaid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    return jsonOk({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    const breakerResponse = handleStripeError(err);
    if (breakerResponse) return breakerResponse;
    console.error("[stripe/payment-intent] Error:", err);
    return jsonError("Failed to create payment intent", 500);
  }
}
