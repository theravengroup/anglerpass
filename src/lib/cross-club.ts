/**
 * Cross-Club Network Routing
 *
 * Determines whether a booking is a home-club or cross-club booking.
 *
 * Home-club:  angler's club has direct club_property_access to the property
 * Cross-club: angler's club does NOT have direct access, but has an active
 *             cross_club_agreement with a club that does.
 *
 * All tiers are eligible for cross-club access with graduated limits:
 *   Starter: up to 2 partner agreements
 *   Standard: up to 10 partner agreements
 *   Pro: unlimited partner agreements
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CrossClubResult {
  /** Whether this is a cross-club booking */
  isCrossClub: boolean;
  /** The club that actually holds access to the property (same as angler's club if home-club) */
  accessClubId: string;
  /** The cross-club agreement ID, if applicable */
  agreementId?: string;
}

/**
 * Determine if a booking is home-club or cross-club.
 *
 * @param admin     - Supabase admin client (bypasses RLS)
 * @param clubId    - The angler's club ID (from their membership)
 * @param propertyId - The property being booked
 * @returns CrossClubResult with routing info, or null if no access at all
 */
export async function detectCrossClubRouting(
  admin: SupabaseClient,
  clubId: string,
  propertyId: string
): Promise<CrossClubResult | null> {
  // 1. Check direct access first (home-club booking)
  const { data: directAccess } = await admin
    .from("club_property_access")
    .select("id")
    .eq("club_id", clubId)
    .eq("property_id", propertyId)
    .eq("status", "approved")
    .maybeSingle();

  if (directAccess) {
    return {
      isCrossClub: false,
      accessClubId: clubId,
    };
  }

  // 2. No direct access — check for cross-club route.
  //    Find clubs that DO have access to this property...
  const { data: propertyAccessClubs } = await admin
    .from("club_property_access")
    .select("club_id")
    .eq("property_id", propertyId)
    .eq("status", "approved");

  if (!propertyAccessClubs?.length) {
    return null; // Property has no club access at all
  }

  const accessClubIds = propertyAccessClubs.map((a) => a.club_id);

  // 3. ...then check if any of those clubs have an active agreement
  //    with the angler's club. Agreements are bidirectional, so check
  //    both directions (club_a/club_b).
  const { data: agreements } = await admin
    .from("cross_club_agreements")
    .select("id, club_a_id, club_b_id")
    .eq("status", "active")
    .or(
      `and(club_a_id.eq.${clubId},club_b_id.in.(${accessClubIds.join(",")})),` +
      `and(club_b_id.eq.${clubId},club_a_id.in.(${accessClubIds.join(",")}))`
    );

  if (!agreements?.length) {
    return null; // No cross-club route available
  }

  // Pick the first valid agreement
  const agreement = agreements[0];
  const partnerClubId =
    agreement.club_a_id === clubId
      ? agreement.club_b_id
      : agreement.club_a_id;

  return {
    isCrossClub: true,
    accessClubId: partnerClubId,
    agreementId: agreement.id,
  };
}

/**
 * Get all properties accessible to an angler through cross-club agreements.
 *
 * Returns property IDs and the partner club that provides access, excluding
 * any properties the angler already has direct access to.
 *
 * @param admin            - Supabase admin client
 * @param clubIds          - The angler's club IDs (from their active memberships)
 * @param directPropertyIds - Property IDs already accessible via direct club access
 * @returns Array of { propertyId, accessClubId, anglerClubId, agreementId }
 */
export async function discoverCrossClubProperties(
  admin: SupabaseClient,
  clubIds: string[],
  directPropertyIds: string[]
): Promise<
  {
    propertyId: string;
    accessClubId: string;
    anglerClubId: string;
    agreementId: string;
  }[]
> {
  if (!clubIds.length) return [];

  // 1. Find all active agreements involving any of the angler's clubs
  const { data: agreements } = await admin
    .from("cross_club_agreements")
    .select("id, club_a_id, club_b_id")
    .eq("status", "active")
    .or(
      `club_a_id.in.(${clubIds.join(",")}),club_b_id.in.(${clubIds.join(",")})`
    );

  if (!agreements?.length) return [];

  // 2. Collect partner club IDs and map back to the angler's club + agreement
  const partnerMap: Map<
    string,
    { anglerClubId: string; agreementId: string }
  > = new Map();

  for (const agreement of agreements) {
    const isClubA = clubIds.includes(agreement.club_a_id);
    const anglerClubId = isClubA ? agreement.club_a_id : agreement.club_b_id;
    const partnerClubId = isClubA ? agreement.club_b_id : agreement.club_a_id;

    // If the angler is in both clubs of an agreement, skip it (they have direct access)
    if (clubIds.includes(partnerClubId)) continue;

    partnerMap.set(partnerClubId, {
      anglerClubId,
      agreementId: agreement.id,
    });
  }

  if (!partnerMap.size) return [];

  const partnerClubIds = [...partnerMap.keys()];

  // 3. Get properties accessible through partner clubs
  const { data: partnerAccess } = await admin
    .from("club_property_access")
    .select("property_id, club_id")
    .in("club_id", partnerClubIds)
    .eq("status", "approved");

  if (!partnerAccess?.length) return [];

  // 4. Filter out properties the angler already has direct access to
  const directSet = new Set(directPropertyIds);
  const results: {
    propertyId: string;
    accessClubId: string;
    anglerClubId: string;
    agreementId: string;
  }[] = [];

  // Deduplicate by property ID (a property might be reachable through multiple agreements)
  const seen = new Set<string>();

  for (const record of partnerAccess) {
    if (directSet.has(record.property_id)) continue;
    if (seen.has(record.property_id)) continue;
    seen.add(record.property_id);

    const partner = partnerMap.get(record.club_id);
    if (!partner) continue;

    results.push({
      propertyId: record.property_id,
      accessClubId: record.club_id,
      anglerClubId: partner.anglerClubId,
      agreementId: partner.agreementId,
    });
  }

  return results;
}
