import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateRefund } from "@/lib/cancellation";
import { notifyBookingCancelled } from "@/lib/notifications";

// GET: Fetch a single booking
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: booking, error } = await admin
      .from("bookings")
      .select(
        "*, properties(id, name, location_description, photos, water_type, regulations, access_notes, gate_code_required, gate_code, owner_id), profiles!bookings_angler_id_fkey(display_name)"
      )
      .eq("id", id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
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
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[bookings/[id]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update booking status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch the booking
    const { data: booking } = await admin
      .from("bookings")
      .select(
        "id, status, angler_id, property_id, booking_date, total_amount, properties(owner_id, name), profiles!bookings_angler_id_fkey(display_name)"
      )
      .eq("id", id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: "Only cancellation is supported. Bookings are confirmed instantly." },
        { status: 400 }
      );
    }

    if (booking.angler_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "confirmed") {
      return NextResponse.json(
        { error: "This booking cannot be cancelled" },
        { status: 400 }
      );
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
        ...(cancellationReason ? { cancellation_reason: cancellationReason } : {}),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[bookings/[id]] Cancel error:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel booking" },
        { status: 500 }
      );
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

    return NextResponse.json({ booking: updated, refund });
  } catch (err) {
    console.error("[bookings/[id]] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
