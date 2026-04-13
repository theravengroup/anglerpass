import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";

/**
 * GET /api/clubs/onboarding-status
 *
 * Returns the club's current onboarding state:
 *
 *   "no_club"             → Show "Set Up Your Club" card
 *   "setup_incomplete"    → Club exists but missing key setup steps
 *   "active"              → Fully operational, show full dashboard
 *
 * Also returns a checklist of setup steps with completion status.
 */
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Check if user owns a club
    const { data: club } = await admin
      .from("clubs")
      .select(
        "id, name, description, location, subscription_tier, stripe_subscription_id, stripe_connect_account_id, stripe_connect_onboarded, is_active"
      )
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!club) {
      return jsonOk({ state: "no_club" });
    }

    // Check setup completeness
    const hasDescription = !!(club.description && club.description.length > 10);
    const hasSubscription = !!club.stripe_subscription_id;
    const hasPayoutSetup = !!(club.stripe_connect_account_id && club.stripe_connect_onboarded);

    // Check for members (beyond the owner)
    const { count: memberCount } = await admin
      .from("club_memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("status", "active")
      .neq("user_id", user.id);

    const hasMembers = (memberCount ?? 0) > 0;

    // Check for property associations
    const { count: propertyCount } = await admin
      .from("club_property_access")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id);

    const hasProperties = (propertyCount ?? 0) > 0;

    const checklist = {
      club_created: true,
      has_description: hasDescription,
      has_subscription: hasSubscription,
      has_payout: hasPayoutSetup,
      has_members: hasMembers,
      has_properties: hasProperties,
    };

    // Consider setup complete when subscription and payout are configured
    // (members and properties can come later but the club needs to be operational)
    const isSetupComplete = hasSubscription && hasPayoutSetup;

    if (!isSetupComplete) {
      return jsonOk({
        state: "setup_incomplete",
        club: {
          id: club.id,
          name: club.name,
          subscription_tier: club.subscription_tier,
        },
        checklist,
      });
    }

    return jsonOk({
      state: "active",
      club: { id: club.id, name: club.name, is_active: club.is_active },
      checklist,
    });
  } catch (err) {
    console.error("[clubs/onboarding-status] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
