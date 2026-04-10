import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLUB_STAFF_ROLES } from "@/lib/permissions/constants";
import { createStaffNoteSchema, VALID_NOTE_ENTITY_TYPES } from "@/lib/validations/clubs";

/** Verify user is club owner or active staff */
async function verifyClubStaff(clubId: string, userId: string) {
  const admin = createAdminClient();

  const { data: club } = await admin
    .from("clubs")
    .select("owner_id")
    .eq("id", clubId)
    .maybeSingle();

  if (!club) return null;
  if (club.owner_id === userId) return admin;

  const { data: membership } = await admin
    .from("club_memberships")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membership && CLUB_STAFF_ROLES.includes(membership.role as typeof CLUB_STAFF_ROLES[number])) {
    return admin;
  }

  return null;
}

/**
 * GET /api/clubs/[id]/notes?entity_type=member&entity_id=xxx
 *
 * List staff notes for a specific entity within a club.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { id: clubId } = await params;
    const admin = await verifyClubStaff(clubId, auth.user.id);
    if (!admin) return jsonError("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");

    if (!entityType || !entityId) {
      return jsonError("entity_type and entity_id are required", 400);
    }

    if (!VALID_NOTE_ENTITY_TYPES.includes(entityType as typeof VALID_NOTE_ENTITY_TYPES[number])) {
      return jsonError("Invalid entity_type", 400);
    }

    const { data: notes, error } = await admin
      .from("staff_notes")
      .select("id, body, created_by, created_at")
      .eq("club_id", clubId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[clubs/notes] Fetch error:", error);
      return jsonError("Failed to fetch notes", 500);
    }

    // Enrich with author display name
    const authorIds = [...new Set((notes ?? []).map((n) => n.created_by))];
    const { data: profiles } = authorIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name])
    );

    const enriched = (notes ?? []).map((note) => ({
      ...note,
      author_name: profileMap.get(note.created_by) ?? "Unknown",
    }));

    return jsonOk({ notes: enriched });
  } catch (err) {
    console.error("[clubs/notes] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * POST /api/clubs/[id]/notes
 *
 * Create a new staff note for an entity within a club.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { id: clubId } = await params;
    const admin = await verifyClubStaff(clubId, auth.user.id);
    if (!admin) return jsonError("Forbidden", 403);

    const body = await _request.json();
    const parsed = createStaffNoteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { entity_type, entity_id, body: noteBody } = parsed.data;

    const { data: note, error } = await admin
      .from("staff_notes")
      .insert({
        club_id: clubId,
        entity_type,
        entity_id,
        body: noteBody,
        created_by: auth.user.id,
      })
      .select("id, body, created_by, created_at")
      .single();

    if (error) {
      console.error("[clubs/notes] Insert error:", error);
      return jsonError("Failed to create note", 500);
    }

    // Get author name
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", auth.user.id)
      .maybeSingle();

    return jsonCreated({
      note: {
        ...note,
        author_name: profile?.display_name ?? "Unknown",
      },
    });
  } catch (err) {
    console.error("[clubs/notes] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
