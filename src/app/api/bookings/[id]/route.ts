import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateRefund } from "@/lib/cancellation";
import { notifyBookingCancelled, notifyLateCancelFee } from "@/lib/notifications";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { updateStanding } from "@/lib/bookings/limits";
import { auditBookingAction, AuditAction } from "@/lib/permissions";

// GET: Fetch a single booking
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

    const { data: booking, error } = await admin
      .from("bookings")
      .select(
        "*, properties(id, name, location_description, photos, water_type, regulations, access_notes, gate_code_required, gate_code, owner_id), profiles!bookings_angler_id_fkey(display_name)"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !booking) {
      return jsonError("Booking not found", 404);
    }

    // Verify access: angler, property owner, or admin
    const property = booking.properties as { owner_id: string } | null;
    const isAngler = booking.angler_id === user.id;
    const isLandowner = property?.owner_id === user.id;

    if (!isAngler && !isLandowner) {
      const { data: profile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return jsonError("Forbidden", 403);
      }
    }

    // Only show access details (gate code, etc.) for confirmed bookings to the angler
    if (isAngler && booking.status !== "confirmed") {
      const props = booking.properties as Record<string, unknown> | null;
      if (props) {
        delete props.gate_code;
        delete props.access_notes;
      }
    }

    return jsonOk({ booking });
  } catch (err) {
    console.error("[bookings/[id]] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// PATCH: Update booking status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = rateLimit("bookings-update", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const { id } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Fetch the booking
    const { data: booking } = await admin
      .from("bookings")
      .select(
        "id, status, angler_id, property_id, booking_date, total_amount, properties(owner_id, name), profiles!bookings_angler_id_fkey(display_name)"
      )
      .eq("id", id)
      .maybeSingle();

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    const body = await request.json();
    const property = booking.properties as {
      owner_id: string;
      name: string;
    } | null;
    const anglerProfile = booking.profiles as {
      display_name: string | null;
    } | null;

    // Only angler cancellation is supported (instant-book — no landowner approval)
    if (body.status !== "cancelled") {
      return jsonError("Only cancellation is supported. Bookings are confirmed instantly.", 400);
    }

    if (booking.angler_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    if (booking.status !== "confirmed") {
      return jsonError("This booking cannot be cancelled", 400);
    }

    // Calculate refund based on cancellation policy
    const totalAmount =
      typeof booking.total_amount === "number"
        ? booking.total_amount
        : parseFloat(String(booking.total_amount ?? "0"));

    const refund = calculateRefund(booking.booking_date, totalAmount);

    const cancellationReason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : null;

    const { data: updated, error: updateError } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        refund_percentage: refund.percentage,
        refund_amount: refund.amount,
        late_cancel_fee: refund.lateCancelFee,
        ...(cancellationReason ? { cancellation_reason: cancellationReason } : {}),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("[bookings/[id]] Cancel error:", updateError);
      return jsonError("Failed to cancel booking", 500);
    }

    // Notify landowner of cancellation
    if (property) {
      notifyBookingCancelled(admin, {
        landownerId: property.owner_id,
        anglerName:
          anglerProfile?.display_name ?? "An angler",
        propertyName: property.name,
        bookingDate: booking.booking_date,
        bookingId: booking.id,
      }).catch((err) =>
        console.error("[bookings/[id]] Notification error:", err)
      );
    }

    // Notify angler of late cancellation fee if applicable
    if (refund.lateCancelFee > 0 && property) {
      notifyLateCancelFee(admin, {
        userId: user.id,
        fee: refund.lateCancelFee,
        propertyName: property.name,
        bookingDate: booking.booking_date,
      }).catch((err) =>
        console.error("[bookings/[id]] Late cancel fee notification error:", err)
      );

      auditBookingAction({
        actorId: user.id,
        action: AuditAction.BOOKING_LATE_CANCEL_FEE,
        bookingId: booking.id,
        newData: { late_cancel_fee: refund.lateCancelFee },
      }).catch((err) => console.error("[bookings/[id]] Audit error:", err));
    }

    // Recalculate booking standing (fire-and-forget)
    updateStanding(user.id).catch((err) =>
      console.error("[bookings/[id]] Standing update error:", err)
    );

    // Audit the cancellation
    auditBookingAction({
      actorId: user.id,
      action: AuditAction.BOOKING_CANCELLED,
      bookingId: booking.id,
      oldData: { status: "confirmed" },
      newData: {
        status: "cancelled",
        refund_percentage: refund.percentage,
        refund_amount: refund.amount,
        late_cancel_fee: refund.lateCancelFee,
      },
      reason: cancellationReason ?? undefined,
    }).catch((err) => console.error("[bookings/[id]] Audit error:", err));

    return jsonOk({ booking: updated, refund });
  } catch (err) {
    console.error("[bookings/[id]] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
