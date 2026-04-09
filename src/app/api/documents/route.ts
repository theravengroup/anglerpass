import { jsonCreated, jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { documentTemplateSchema } from "@/lib/validations/documents";

// GET: List document templates for a property (query param: property_id)
export async function GET(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");

    if (!propertyId) {
      return jsonError("property_id is required", 400);
    }

    const admin = createAdminClient();

    // Check if user is the property owner (show all) or angler (show active only)
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", propertyId)
      .single();

    const isOwner = property?.owner_id === user.id;

    let query = admin
      .from("document_templates")
      .select("*")
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true });

    if (!isOwner) {
      query = query.eq("active", true);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("[documents] Fetch error:", error);
      return jsonError("Failed to fetch templates", 500);
    }

    return jsonOk({ templates: templates ?? [] });
  } catch (err) {
    console.error("[documents] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// POST: Create a document template
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const { property_id, ...templateData } = body;

    if (!property_id) {
      return jsonError("property_id is required", 400);
    }

    const result = documentTemplateSchema.safeParse(templateData);
    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();

    // Verify ownership
    const { data: property } = await admin
      .from("properties")
      .select("owner_id")
      .eq("id", property_id)
      .single();

    if (!property || property.owner_id !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const { data: template, error } = await admin
      .from("document_templates")
      .insert({
        property_id,
        owner_id: user.id,
        ...result.data,
      })
      .select()
      .single();

    if (error) {
      console.error("[documents] Insert error:", error);
      return jsonError("Failed to create template", 500);
    }

    return jsonCreated({ template });
  } catch (err) {
    console.error("[documents] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
