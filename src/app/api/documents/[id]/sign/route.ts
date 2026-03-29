import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { signDocumentSchema, substituteVariables } from "@/lib/validations/documents";

// POST: Sign a document template for a booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = signDocumentSchema.safeParse({
      ...body,
      template_id: templateId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Fetch the template
    const { data: template } = await admin
      .from("document_templates")
      .select("*, properties(name)")
      .eq("id", templateId)
      .eq("active", true)
      .single();

    if (!template) {
      return NextResponse.json(
        { error: "Template not found or inactive" },
        { status: 404 }
      );
    }

    // Fetch the booking and verify the signer is the angler
    const { data: booking } = await admin
      .from("bookings")
      .select("id, angler_id, booking_date, party_size, property_id")
      .eq("id", result.data.booking_id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.angler_id !== user.id) {
      return NextResponse.json(
        { error: "You can only sign documents for your own bookings" },
        { status: 403 }
      );
    }

    // Verify the template belongs to the same property as the booking
    if (template.property_id !== booking.property_id) {
      return NextResponse.json(
        { error: "Template does not belong to the booking's property" },
        { status: 400 }
      );
    }

    // Check if already signed
    const { data: existingSig } = await admin
      .from("signed_documents")
      .select("id")
      .eq("template_id", templateId)
      .eq("booking_id", booking.id)
      .eq("signer_id", user.id)
      .maybeSingle();

    if (existingSig) {
      return NextResponse.json(
        { error: "You have already signed this document for this booking" },
        { status: 409 }
      );
    }

    // Get signer's profile and email
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const propertyName =
      (template.properties as { name: string } | null)?.name ?? "the property";

    // Create the snapshot with variable substitution
    const snapshot = substituteVariables(template.body, {
      angler_name: result.data.signer_name,
      property_name: propertyName,
      trip_date: booking.booking_date,
      party_size: String(booking.party_size),
    });

    // Extract IP and user agent
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent") ?? null;

    const { data: signed, error } = await admin
      .from("signed_documents")
      .insert({
        template_id: templateId,
        booking_id: booking.id,
        signer_id: user.id,
        signer_name: result.data.signer_name,
        signer_email: user.email ?? profile?.display_name ?? "",
        template_snapshot: snapshot,
        template_title: template.title,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      console.error("[documents/sign] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to record signature" },
        { status: 500 }
      );
    }

    return NextResponse.json({ signed_document: signed }, { status: 201 });
  } catch (err) {
    console.error("[documents/sign] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check signing status for a booking + template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");

    if (!bookingId) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: signed } = await admin
      .from("signed_documents")
      .select("id, signer_name, signed_at")
      .eq("template_id", templateId)
      .eq("booking_id", bookingId)
      .eq("signer_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      signed: !!signed,
      signed_document: signed ?? null,
    });
  } catch (err) {
    console.error("[documents/sign] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
