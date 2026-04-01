import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: booking } = await admin
      .from("bookings")
      .select("id, status, angler_id, booking_date, total_amount")
      .eq("id", id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
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

    const totalAmount =
      typeof booking.total_amount === "number"
        ? booking.total_amount
        : parseFloat(String(booking.total_amount ?? "0"));

    // All bookings are instant-confirmed, so refund tiers always apply
    const refund = calculateRefund(booking.booking_date, totalAmount);

    return NextResponse.json({
      refund,
      booking_status: booking.status,
      policy: CANCELLATION_POLICY_TEXT,
    });
  } catch (err) {
    console.error("[bookings/refund-preview] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
