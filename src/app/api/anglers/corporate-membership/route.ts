import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: Return the authenticated user's active corporate membership (if any).
 * Used by the angler dashboard to conditionally show the employee invite section.
 */
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Find active corporate membership for this user
    const { data: membership } = await admin
      .from("club_memberships")
      .select("id, club_id, company_name, clubs(name)")
      .eq("user_id", user.id)
      .eq("membership_type", "corporate")
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      return jsonOk({ membership: null });
    }

    return jsonOk({
      membership: {
        membership_id: membership.id,
        club_id: membership.club_id,
        club_name: membership.clubs?.name ?? "Unknown Club",
        company_name: membership.company_name ?? "",
      },
    });
  } catch (err) {
    console.error("[anglers/corporate-membership] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
