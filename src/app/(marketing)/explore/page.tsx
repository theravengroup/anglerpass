import type { Metadata } from "next";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import ExploreClient from "@/components/map/ExploreClient";

export const metadata: Metadata = {
  title: "Explore Private Waters — AnglerPass",
  description:
    "Browse exclusive fly fishing properties available through AnglerPass. Find your next adventure on private waters.",
};

// Revalidate every 5 minutes — properties don't change often
export const revalidate = 300;

interface SearchProperty {
  id: string;
  name: string;
  description: string | null;
  location_description: string | null;
  water_type: string | null;
  species: string[];
  photos: string[];
  max_rods: number | null;
  max_guests: number | null;
  rate_adult_full_day: number | null;
  rate_adult_half_day: number | null;
  half_day_allowed: boolean;
  water_miles: number | null;
  latitude: number | null;
  longitude: number | null;
}

export default async function ExplorePage() {
  const admin = createAdminClient();

  // Fetch published properties, then filter out those belonging to inactive clubs
  const { data: allProperties } = await admin
    .from("properties")
    .select(
      "id, name, description, location_description, water_type, species, photos, max_rods, max_guests, rate_adult_full_day, rate_adult_half_day, half_day_allowed, water_miles, latitude, longitude, created_by_club_id"
    )
    .eq("status", "published")
    .order("name")
    .limit(200);

  // Find inactive club IDs among club-created properties
  const clubIds = [
    ...new Set(
      (allProperties ?? [])
        .map((p) => p.created_by_club_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  let inactiveClubIds = new Set<string>();
  if (clubIds.length > 0) {
    const { data: inactiveClubs } = await admin
      .from("clubs")
      .select("id")
      .in("id", clubIds)
      .eq("is_active", false);

    inactiveClubIds = new Set(
      (inactiveClubs ?? []).map((c) => c.id)
    );
  }

  // Filter out properties from inactive clubs
  const properties = (allProperties ?? [])
    .filter(
      (p) =>
        !p.created_by_club_id ||
        !inactiveClubIds.has(p.created_by_club_id)
    )
    .slice(0, 100);

  return (
    <Suspense>
      <ExploreClient
        initialProperties={(properties ?? []) as SearchProperty[]}
      />
    </Suspense>
  );
}
