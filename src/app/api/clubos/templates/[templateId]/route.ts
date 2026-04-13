import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth, requireClubRole } from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { updateClubTemplateSchema } from "@/lib/validations/clubos-communications";

/**
 * PATCH /api/clubos/templates/[templateId] — Update a template
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { templateId } = await params;
    const admin = createAdminClient();

    // Load template
    const { data: existing } = await admin
      .from("club_templates")
      .select("id, club_id, is_system_default")
      .eq("id", templateId)
      .single();

    if (!existing) return jsonError("Template not found", 404);
    if (!existing.club_id || existing.is_system_default) {
      return jsonError("Cannot modify system templates", 403);
    }

    const role = await requireClubRole(auth.user.id, existing.club_id, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const body = await req.json();
    const parsed = updateClubTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0].message, 400);
    }

    const { data: template, error } = await admin
      .from("club_templates")
      .update(parsed.data)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      console.error("[clubos/templates] Update failed:", error);
      return jsonError("Failed to update template", 500);
    }

    return jsonOk({ template });
  } catch (err) {
    console.error("[clubos/templates] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE /api/clubos/templates/[templateId]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { templateId } = await params;
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("club_templates")
      .select("id, club_id, is_system_default")
      .eq("id", templateId)
      .single();

    if (!existing) return jsonError("Template not found", 404);
    if (!existing.club_id || existing.is_system_default) {
      return jsonError("Cannot delete system templates", 403);
    }

    const role = await requireClubRole(auth.user.id, existing.club_id, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const { error } = await admin
      .from("club_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      console.error("[clubos/templates] Delete failed:", error);
      return jsonError("Failed to delete template", 500);
    }

    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[clubos/templates] DELETE error:", err);
    return jsonError("Internal server error", 500);
  }
}
