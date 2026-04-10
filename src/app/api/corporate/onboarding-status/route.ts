import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";

/**
 * GET /api/corporate/onboarding-status
 *
 * Returns the corporate user's current onboarding state:
 *
 *   "active"           - Has an active corporate membership
 *   "payment_pending"  - Application approved, awaiting payment
 *   "pending"          - Membership or application pending review
 *   "no_club"          - No corporate membership found
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;
    const admin = createAdminClient();

    // 1. Check for active corporate membership
    const { data: activeMembership } = await admin
      .from("club_memberships")
      .select("id, club_id, status, joined_at, company_name")
      .eq("user_id", user.id)
      .eq("membership_type", "corporate")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (activeMembership) {
      return jsonOk({ state: "active" });
    }

    // 2. Check for pending corporate membership
    const { data: pendingMembership } = await admin
      .from("club_memberships")
      .select("id, club_id, status")
      .eq("user_id", user.id)
      .eq("membership_type", "corporate")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingMembership) {
      // Get club details
      const { data: club } = await admin
        .from("clubs")
        .select(
          "id, name, location, logo_url, corporate_initiation_fee, annual_dues"
        )
        .eq("id", pendingMembership.club_id)
        .maybeSingle();

      // Check application status
      const { data: application } = await admin
        .from("membership_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("club_id", pendingMembership.club_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (application?.status === "payment_pending") {
        return jsonOk({
          state: "payment_pending",
          club,
          membershipId: pendingMembership.id,
        });
      }

      return jsonOk({
        state: "pending",
        club,
        applicationStatus: application?.status ?? "pending",
      });
    }

    // 3. No corporate membership
    return jsonOk({ state: "no_club" });
  } catch (err) {
    console.error("[corporate/onboarding-status] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
