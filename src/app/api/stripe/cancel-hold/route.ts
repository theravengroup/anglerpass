import { z } from "zod";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelPaymentIntent } from "@/lib/stripe/server";

const CancelHoldSchema = z.object({
  bookingId: z.string().uuid(),
});

/**
 * POST /api/stripe/cancel-hold
 *
 * Cancels a held (authorized but uncaptured) payment.
 * Releases the hold on the angler's card.
 */
export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = CancelHoldSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
    }

    const { bookingId } = parsed.data;
    const admin = createAdminClient();

    // Fetch the booking
    const { data: booking } = await admin
      .from("bookings")
      .select(
        "id, angler_id, stripe_payment_intent_id, payment_status, property_id"
      )
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

    // Allow the angler, landowner, or admin to cancel
    const isAngler = booking.angler_id === auth.user.id;

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

    if (!isAngler && !isOwner && !isAdmin) {
      return jsonError("Forbidden", 403);
    }

    // Cancel the PaymentIntent (releases the hold)
    await cancelPaymentIntent(booking.stripe_payment_intent_id);

    // Update booking
    await admin
      .from("bookings")
      .update({
        payment_status: "unpaid",
        stripe_payment_intent_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    // Audit log
    await admin.from("audit_log").insert({
      action: "booking.payment_hold_cancelled",
      entity_type: "booking",
      entity_id: bookingId,
      actor_id: auth.user.id,
      new_data: {
        payment_intent_id: booking.stripe_payment_intent_id,
      },
    });

    return jsonOk({ cancelled: true });
  } catch (err) {
    console.error("[stripe/cancel-hold] Error:", err);
    return jsonError("Failed to cancel payment hold", 500);
  }
}
