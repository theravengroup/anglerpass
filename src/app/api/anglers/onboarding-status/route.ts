import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";

/**
 * GET /api/anglers/onboarding-status
 *
 * Returns the angler's current onboarding state so the dashboard
 * knows what to render:
 *
 *   "no_club"         → Show onboarding card with 3 paths
 *   "pending"          → Show "application pending" status card
 *   "payment_pending"  → Show membership checkout form
 *   "active"           → Show normal dashboard
 */
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Check for active memberships first (happy path)
    const { data: activeMembership } = await admin
      .from("club_memberships")
      .select("id, club_id, status, joined_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (activeMembership) {
      return jsonOk({ state: "active" });
    }

    // Check for pending membership + application status
    const { data: pendingMembership } = await admin
      .from("club_memberships")
      .select("id, club_id, status")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingMembership) {
      // Check if there's an application and what its status is
      const { data: application } = await admin
        .from("membership_applications")
        .select("id, status, club_id")
        .eq("user_id", user.id)
        .eq("club_id", pendingMembership.club_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get club details for the status card
      const { data: club } = await admin
        .from("clubs")
        .select("id, name, location, logo_url, initiation_fee, annual_dues")
        .eq("id", pendingMembership.club_id)
        .single();

      if (application?.status === "payment_pending") {
        return jsonOk({
          state: "payment_pending",
          club,
          membershipId: pendingMembership.id,
        });
      }

      // Application still pending review (or no application = direct join)
      return jsonOk({
        state: "pending",
        club,
        applicationStatus: application?.status ?? "pending",
      });
    }

    // No memberships at all
    return jsonOk({ state: "no_club" });
  } catch (err) {
    console.error("[anglers/onboarding-status] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
