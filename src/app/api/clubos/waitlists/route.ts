import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
  isDuplicateError,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { addToWaitlistSchema } from "@/lib/validations/clubos-operations";

/**
 * POST /api/clubos/waitlists — Add to a waitlist
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...waitlistData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    const parsed = addToWaitlistSchema.safeParse(waitlistData);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;
    const userId = data.user_id ?? auth.user.id;

    // If adding someone else, require staff access
    if (data.user_id && data.user_id !== auth.user.id) {
      const role = await requireClubRole(auth.user.id, club_id, P.OPS_MANAGE_WAITLISTS);
      if (!role?.isStaff) return jsonError("Forbidden", 403);
    }

    const admin = createUntypedAdminClient();

    // Get next position
    const { count } = await admin
      .from("club_waitlists")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club_id)
      .eq("type", data.type)
      .in("status", ["waiting", "offered"]);

    const position = (count ?? 0) + 1;

    const { data: entry, error } = await admin
      .from("club_waitlists")
      .insert({
        club_id,
        type: data.type,
        reference_id: data.reference_id ?? null,
        user_id: userId,
        position,
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (isDuplicateError(error)) {
      return jsonError("Already on this waitlist", 409);
    }

    if (error) {
      console.error("[clubos/waitlists] Create failed:", error);
      return jsonError("Failed to add to waitlist", 500);
    }

    return jsonCreated({ entry });
  } catch (err) {
    console.error("[clubos/waitlists] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/waitlists?club_id=...&type=...&status=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const clubId = searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, clubId, P.OPS_MANAGE_WAITLISTS);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const admin = createUntypedAdminClient();
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    let query = admin
      .from("club_waitlists")
      .select(`
        *,
        profile:profiles(full_name, email)
      `)
      .eq("club_id", clubId)
      .order("position", { ascending: true });

    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);

    const { data: entries, error } = await query;

    if (error) {
      console.error("[clubos/waitlists] List failed:", error);
      return jsonError("Failed to list waitlist", 500);
    }

    return jsonOk({ entries });
  } catch (err) {
    console.error("[clubos/waitlists] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
