import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";

/**
 * GET /api/landowners/onboarding-status
 *
 * Returns the landowner's current onboarding state:
 *
 *   "no_property"          → Show "Add Your First Property" onboarding card
 *   "property_draft"       → Show property setup checklist
 *   "pending_review"       → Property submitted, awaiting admin review
 *   "changes_requested"    → Admin requested changes, show notes
 *   "payout_needed"        → Property published but no payout account
 *   "active"               → Fully operational, show full dashboard
 *
 * Returns the most advanced property to determine state.
 */
export async function GET() {
  try {
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const admin = createAdminClient();

    // Fetch all properties for this owner
    const { data: properties } = await admin
      .from("properties")
      .select("id, name, status, photos")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (!properties || properties.length === 0) {
      return jsonOk({ state: "no_property" });
    }

    // Check for published properties (most advanced state)
    const publishedProperty = properties.find((p) => p.status === "published");
    if (publishedProperty) {
      // Check payout setup
      const { data: profile } = await admin
        .from("profiles")
        .select("stripe_connect_account_id, stripe_connect_onboarded")
        .eq("id", user.id)
        .maybeSingle();

      const hasPayoutSetup = !!(
        profile?.stripe_connect_account_id &&
        profile?.stripe_connect_onboarded
      );

      if (!hasPayoutSetup) {
        return jsonOk({
          state: "payout_needed",
          property: { id: publishedProperty.id, name: publishedProperty.name },
          propertiesTotal: properties.length,
          propertiesPublished: properties.filter((p) => p.status === "published").length,
        });
      }

      return jsonOk({
        state: "active",
        propertiesTotal: properties.length,
        propertiesPublished: properties.filter((p) => p.status === "published").length,
      });
    }

    // Check for pending_review
    const pendingProperty = properties.find((p) => p.status === "pending_review");
    if (pendingProperty) {
      return jsonOk({
        state: "pending_review",
        property: { id: pendingProperty.id, name: pendingProperty.name },
      });
    }

    // Check for changes_requested
    const changesProperty = properties.find((p) => p.status === "changes_requested");
    if (changesProperty) {
      // Fetch moderation notes
      const { data: notes } = await admin
        .from("moderation_notes")
        .select("notes, created_at")
        .eq("property_id", changesProperty.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return jsonOk({
        state: "changes_requested",
        property: { id: changesProperty.id, name: changesProperty.name },
        moderationNote: notes?.notes ?? null,
      });
    }

    // All properties are draft — show checklist for the most recently updated one
    const draftProperty = properties[0];

    // Check completeness for the draft property
    const photoCount = Array.isArray(draftProperty.photos) ? draftProperty.photos.length : 0;

    // Check pricing
    const { data: propertyDetail } = await admin
      .from("properties")
      .select("rate_adult_full_day, max_rods, max_guests")
      .eq("id", draftProperty.id)
      .maybeSingle();

    const hasPricing = !!(propertyDetail?.rate_adult_full_day && propertyDetail.rate_adult_full_day > 0);
    const hasCapacity = !!(propertyDetail?.max_rods && propertyDetail.max_rods > 0);

    // Check club association
    const { count: clubCount } = await admin
      .from("club_property_access")
      .select("id", { count: "exact", head: true })
      .eq("property_id", draftProperty.id);

    const { count: invitationCount } = await admin
      .from("club_invitations")
      .select("id", { count: "exact", head: true })
      .eq("property_id", draftProperty.id)
      .in("status", ["sent", "accepted"]);

    const hasClubLink = (clubCount ?? 0) > 0 || (invitationCount ?? 0) > 0;

    return jsonOk({
      state: "property_draft",
      property: { id: draftProperty.id, name: draftProperty.name },
      checklist: {
        has_photos: photoCount >= 3,
        photo_count: photoCount,
        has_pricing: hasPricing,
        has_capacity: hasCapacity,
        has_club: hasClubLink,
      },
    });
  } catch (err) {
    console.error("[landowners/onboarding-status] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
