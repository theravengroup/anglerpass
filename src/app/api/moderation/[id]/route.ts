import { requireAdmin, jsonError, jsonSuccess } from "@/lib/api/helpers";
import { moderationActionSchema } from "@/lib/validations/moderation";
import type { Json } from "@/types/supabase";

const ACTION_TO_STATUS: Record<string, string> = {
  approved: "published",
  changes_requested: "changes_requested",
  rejected: "archived",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { user, admin } = auth;

    // Validate request body
    const body = await request.json();
    const result = moderationActionSchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { action, notes } = result.data;

    // Get current property
    const { data: property } = await admin
      .from("properties")
      .select("id, status, name, owner_id")
      .eq("id", id)
      .single();

    if (!property) {
      return jsonError("Property not found", 404);
    }

    if (property.status !== "pending_review") {
      return jsonError(
        "Only properties with pending_review status can be moderated",
        400
      );
    }

    const newStatus = ACTION_TO_STATUS[action];
    const oldStatus = property.status;

    // Update property status
    const { error: updateError } = await admin
      .from("properties")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      console.error("[moderation] Status update error:", updateError);
      return jsonError("Failed to update property status", 500);
    }

    // Insert moderation note
    const { error: noteError } = await admin
      .from("moderation_notes")
      .insert({
        property_id: id,
        admin_id: user.id,
        action,
        notes,
      });

    if (noteError) {
      console.error("[moderation] Note insert error:", noteError);
      // Status was already updated — log but don't fail
    }

    // Write to audit log
    const { error: auditError } = await admin
      .from("audit_log")
      .insert({
        actor_id: user.id,
        action: `moderation.${action}`,
        entity_type: "property",
        entity_id: id,
        old_data: { status: oldStatus } as Json,
        new_data: { status: newStatus, notes } as Json,
      });

    if (auditError) {
      console.error("[moderation] Audit log error:", auditError);
    }

    return jsonSuccess({ property: { id, status: newStatus } });
  } catch (err) {
    console.error("[moderation] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

// GET moderation history for a property
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { data, error } = await auth.admin
      .from("moderation_notes")
      .select("id, action, notes, created_at, admin_id")
      .eq("property_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[moderation] Fetch notes error:", error);
      return jsonError("Failed to fetch moderation history", 500);
    }

    return jsonSuccess({ notes: data ?? [] });
  } catch (err) {
    console.error("[moderation] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
