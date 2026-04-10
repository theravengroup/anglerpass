import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateRefund,
  CANCELLATION_POLICY_TEXT,
} from "@/lib/cancellation";

// GET: Preview the refund amount for a potential cancellation
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, angler_id, booking_date, total_amount")
      .eq("id", id)
      .maybeSingle();

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (booking.angler_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    if (booking.status !== "confirmed") {
      return jsonError("This booking cannot be cancelled", 400);
    }

    const totalAmount =
      typeof booking.total_amount === "number"
        ? booking.total_amount
        : parseFloat(String(booking.total_amount ?? "0"));

    // All bookings are instant-confirmed, so refund tiers always apply
    const refund = calculateRefund(booking.booking_date, totalAmount);

    return jsonOk({
      refund,
      booking_status: booking.status,
      policy: CANCELLATION_POLICY_TEXT,
    });
  } catch (err) {
    console.error("[bookings/refund-preview] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
