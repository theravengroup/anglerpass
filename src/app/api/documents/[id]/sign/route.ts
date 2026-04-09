import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { signDocumentSchema, substituteVariables } from "@/lib/validations/documents";

// POST: Sign a document template for a booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = signDocumentSchema.safeParse({
      ...body,
      template_id: templateId,
    });

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
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
      return jsonError("Template not found or inactive", 404);
    }

    // Fetch the booking and verify the signer is the angler
    const { data: booking } = await admin
      .from("bookings")
      .select("id, angler_id, booking_date, party_size, property_id")
      .eq("id", result.data.booking_id)
      .single();

    if (!booking) {
      return jsonError("Booking not found", 404);
    }

    if (booking.angler_id !== user.id) {
      return jsonError("You can only sign documents for your own bookings", 403);
    }

    // Verify the template belongs to the same property as the booking
    if (template.property_id !== booking.property_id) {
      return jsonError("Template does not belong to the booking's property", 400);
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
      return jsonError("You have already signed this document for this booking", 409);
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
      return jsonError("Failed to record signature", 500);
    }

    return jsonCreated({ signed_document: signed });
  } catch (err) {
    console.error("[documents/sign] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// GET: Check signing status for a booking + template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");

    if (!bookingId) {
      return jsonError("booking_id is required", 400);
    }

    const admin = createAdminClient();

    const { data: signed } = await admin
      .from("signed_documents")
      .select("id, signer_name, signed_at")
      .eq("template_id", templateId)
      .eq("booking_id", bookingId)
      .eq("signer_id", user.id)
      .maybeSingle();

    return jsonOk({
      signed: !!signed,
      signed_document: signed ?? null,
    });
  } catch (err) {
    console.error("[documents/sign] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
