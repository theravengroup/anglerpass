import { z } from "zod";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { capturePaymentIntent } from "@/lib/stripe/server";

const CaptureSchema = z.object({
  bookingId: z.string().uuid(),
});

/**
 * POST /api/stripe/capture
 *
 * Captures a previously authorized (held) payment after trip completion.
 * Only landowners or admins should call this.
 */
export async function POST(request: Request) {
  const limited = rateLimit("stripe-capture", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = CaptureSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
    }

    const { bookingId } = parsed.data;
    const admin = createAdminClient();

    // Fetch the booking with its payment intent
    const { data: booking } = await admin
      .from("bookings")
      .select("id, stripe_payment_intent_id, payment_status, property_id")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (booking.payment_status !== "hold") {
      return jsonError("Payment is not in hold state", 409);
    }

    if (!booking.stripe_payment_intent_id) {
      return jsonError("No payment intent found for this booking", 400);
    }

    // Verify the caller owns the property (landowner) or is an admin
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", booking.property_id)
      .single();

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .single();

    const isOwner = property?.owner_id === auth.user.id;
    const isAdmin = profile?.role === "admin";

    if (!isOwner && !isAdmin) {
      return jsonError("Forbidden", 403);
    }

    // Capture the payment
    const captured = await capturePaymentIntent(
      booking.stripe_payment_intent_id
    );

    // Update booking status
    await admin
      .from("bookings")
      .update({
        payment_status: "succeeded",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    // Audit log
    await admin.from("audit_log").insert({
      action: "booking.payment_captured",
      entity_type: "booking",
      entity_id: bookingId,
      actor_id: auth.user.id,
      new_data: {
        payment_intent_id: captured.id,
        amount_captured: captured.amount,
      },
    });

    return jsonOk({ captured: true, paymentIntentId: captured.id });
  } catch (err) {
    console.error("[stripe/capture] Error:", err);
    return jsonError("Failed to capture payment", 500);
  }
}
