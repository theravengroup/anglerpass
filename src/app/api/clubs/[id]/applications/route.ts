import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

async function verifyClubManager(
  admin: SupabaseClient,
  clubId: string,
  userId: string
): Promise<{ club: { owner_id: string; name: string }; isOwner: boolean } | null> {
  const { data: club } = await admin
    .from("clubs")
    .select("owner_id, name")
    .eq("id", clubId)
    .maybeSingle();

  if (!club) return null;

  if (club.owner_id === userId) return { club, isOwner: true };

  const { data: staffMembership } = await admin
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("role", "staff")
    .eq("status", "active")
    .maybeSingle();

  if (staffMembership) return { club, isOwner: false };

  return null;
}

/**
 * GET /api/clubs/[id]/applications
 *
 * List membership applications for a club. Club owners and staff only.
 * Supports ?status=pending|approved|declined|withdrawn filter.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await requireAuth();

    if (!authResult) return jsonError("Unauthorized", 401);

    const { user } = authResult;

    const admin = createAdminClient();
    const clubAuth = await verifyClubManager(admin, id, user.id);
    if (!clubAuth) {
      return jsonError("Forbidden", 403);
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = admin
      .from("membership_applications")
      .select(
        "id, club_id, user_id, status, application_note, reviewed_by, reviewed_at, declined_reason, created_at, updated_at"
      )
      .eq("club_id", id)
      .order("created_at", { ascending: false });

    if (statusFilter && ["pending", "approved", "declined", "withdrawn", "payment_pending", "completed"].includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error("[clubs/applications] Fetch error:", error);
      return jsonError("Failed to fetch applications", 500);
    }

    // Enrich with user profile and email from auth
    const enriched = await Promise.all(
      (applications ?? []).map(async (app) => {
        let email: string | null = null;
        let displayName: string | null = null;
        let avatarUrl: string | null = null;

        if (app.user_id) {
          const [{ data: authUser }, { data: profile }] = await Promise.all([
            admin.auth.admin.getUserById(app.user_id),
            admin
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", app.user_id)
              .maybeSingle(),
          ]);
          email = authUser?.user?.email ?? null;
          displayName = profile?.display_name ?? null;
          avatarUrl = profile?.avatar_url ?? null;
        }

        return {
          id: app.id,
          club_id: app.club_id,
          user_id: app.user_id,
          status: app.status,
          application_note: app.application_note,
          reviewed_by: app.reviewed_by,
          reviewed_at: app.reviewed_at,
          declined_reason: app.declined_reason,
          created_at: app.created_at,
          updated_at: app.updated_at,
          display_name: displayName,
          avatar_url: avatarUrl,
          email,
        };
      })
    );

    return jsonOk({ applications: enriched });
  } catch (err) {
    console.error("[clubs/applications] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
