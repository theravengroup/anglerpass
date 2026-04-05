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

  const { data: properties } = await admin
    .from("properties")
    .select(
      "id, name, description, location_description, water_type, species, photos, max_rods, max_guests, rate_adult_full_day, rate_adult_half_day, half_day_allowed, water_miles, latitude, longitude"
    )
    .eq("status", "published")
    .order("name")
    .limit(100);

  return (
    <Suspense>
      <ExploreClient
        initialProperties={(properties ?? []) as SearchProperty[]}
      />
    </Suspense>
  );
}
