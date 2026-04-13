/**
 * Filters out properties whose affiliated clubs are ALL inactive.
 *
 * Every property on AnglerPass must be affiliated with a club. A property
 * is affiliated via club_property_access (approved) and/or created_by_club_id.
 * If every affiliated club is inactive, the property is hidden from
 * public pages (explore, search, discover).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Given a list of property IDs, returns the subset whose affiliated clubs
 * are ALL inactive (i.e., they should be hidden).
 */
export async function getHiddenPropertyIds(
  admin: SupabaseClient<Database>,
  propertyIds: string[]
): Promise<Set<string>> {
  if (propertyIds.length === 0) return new Set();

  // 1. Get club affiliations via club_property_access (approved)
  const { data: accessRecords } = await admin
    .from("club_property_access")
    .select("property_id, club_id")
    .in("property_id", propertyIds)
    .eq("status", "approved");

  // 2. Get club affiliations via created_by_club_id
  const { data: createdProps } = await admin
    .from("properties")
    .select("id, created_by_club_id")
    .in("id", propertyIds)
    .not("created_by_club_id", "is", null);

  // Build property → club IDs map
  const propertyClubMap = new Map<string, Set<string>>();

  for (const r of accessRecords ?? []) {
    if (!propertyClubMap.has(r.property_id)) {
      propertyClubMap.set(r.property_id, new Set());
    }
    propertyClubMap.get(r.property_id)!.add(r.club_id);
  }

  for (const p of createdProps ?? []) {
    if (p.created_by_club_id) {
      if (!propertyClubMap.has(p.id)) {
        propertyClubMap.set(p.id, new Set());
      }
      propertyClubMap.get(p.id)!.add(p.created_by_club_id);
    }
  }

  // Collect all unique club IDs
  const allClubIds = [
    ...new Set(
      [...propertyClubMap.values()].flatMap((s) => [...s])
    ),
  ];

  if (allClubIds.length === 0) {
    // Properties with no club affiliation — shouldn't happen per business rules,
    // but don't hide them if the data is inconsistent
    return new Set();
  }

  // 3. Find which clubs are active
  const { data: activeClubs } = await admin
    .from("clubs")
    .select("id")
    .in("id", allClubIds)
    .eq("is_active", true);

  const activeClubIds = new Set((activeClubs ?? []).map((c) => c.id));

  // 4. A property is hidden if it has club affiliations and NONE are active
  const hidden = new Set<string>();
  for (const [propertyId, clubIds] of propertyClubMap) {
    const hasActiveClub = [...clubIds].some((cid) => activeClubIds.has(cid));
    if (!hasActiveClub) {
      hidden.add(propertyId);
    }
  }

  return hidden;
}
