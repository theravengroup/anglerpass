import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { createClubTemplateSchema } from "@/lib/validations/clubos-communications";

/**
 * POST /api/clubos/templates — Create a new template
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...templateData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, club_id, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const parsed = createClubTemplateSchema.safeParse(templateData);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const admin = createUntypedAdminClient();
    const data = parsed.data;

    const { data: template, error } = await admin
      .from("club_templates")
      .insert({
        club_id,
        name: data.name,
        type: data.type,
        subject_template: data.subject_template,
        body_template: data.body_template,
      })
      .select()
      .single();

    if (error) {
      console.error("[clubos/templates] Create failed:", error);
      return jsonError("Failed to create template", 500);
    }

    return jsonCreated({ template });
  } catch (err) {
    console.error("[clubos/templates] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/templates?club_id=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const clubId = req.nextUrl.searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, clubId, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const admin = createUntypedAdminClient();

    // Get club-specific templates + system defaults
    const { data: templates, error } = await admin
      .from("club_templates")
      .select("*")
      .or(`club_id.eq.${clubId},and(club_id.is.null,is_system_default.eq.true)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubos/templates] List failed:", error);
      return jsonError("Failed to list templates", 500);
    }

    return jsonOk({ templates });
  } catch (err) {
    console.error("[clubos/templates] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
