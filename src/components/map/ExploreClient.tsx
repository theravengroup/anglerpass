"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Compass, Fish } from "lucide-react";
import Link from "next/link";
import SearchFilters, {
  type SearchFiltersState,
} from "@/components/map/SearchFilters";
import PropertyCard from "@/components/map/PropertyCard";

const PropertyMap = lazy(() => import("@/components/map/PropertyMap"));

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

interface ExploreClientProps {
  initialProperties: SearchProperty[];
}

export default function ExploreClient({ initialProperties }: ExploreClientProps) {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFiltersState>(() => ({
    q: "",
    water_type: "",
    species: "",
    state: searchParams.get("state") ?? "",
    min_price: "",
    max_price: "",
    lodging: false,
  }));

  const filteredProperties = useMemo(() => {
    let results = initialProperties;

    // Apply client-side filters
    if (filters.water_type) {
      results = results.filter((p) => p.water_type === filters.water_type);
    }
    if (filters.species) {
      results = results.filter((p) =>
        p.species?.some((s) => s === filters.species)
      );
    }
    if (filters.min_price) {
      const min = parseFloat(filters.min_price);
      results = results.filter(
        (p) => p.rate_adult_full_day != null && p.rate_adult_full_day >= min
      );
    }
    if (filters.max_price) {
      const max = parseFloat(filters.max_price);
      results = results.filter(
        (p) => p.rate_adult_full_day != null && p.rate_adult_full_day <= max
      );
    }
    if (filters.state) {
      const st = filters.state.toLowerCase();
      results = results.filter((p) =>
        p.location_description?.toLowerCase().includes(st)
      );
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location_description?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.species?.some((s) => s.toLowerCase().includes(q))
      );
    }

    return results;
  }, [initialProperties, filters]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-32 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold text-forest-deep sm:text-4xl">
          Explore Private Waters
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-text-secondary">
          Browse exclusive fly fishing properties available through AnglerPass.
          Sign up to book access through a member club.
        </p>
      </div>

      <SearchFilters
        filters={filters}
        onChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        resultCount={filteredProperties.length}
      />

      {filteredProperties.length === 0 && (
        <Card className="mt-6 border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <Compass className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No properties found
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              {initialProperties.length === 0
                ? "Properties will appear here as landowners publish their waters."
                : "Try adjusting your filters to see more results."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Map view */}
      {viewMode === "map" && filteredProperties.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_350px]">
          <Suspense
            fallback={
              <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-stone-light/10">
                <Loader2 className="size-6 animate-spin text-forest" />
              </div>
            }
          >
            <PropertyMap
              properties={filteredProperties}
              onPropertyClick={setSelectedId}
              selectedId={selectedId}
              className="h-[500px] lg:h-[600px]"
            />
          </Suspense>

          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
            {filteredProperties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                selected={p.id === selectedId}
              />
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && filteredProperties.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* CTA */}
      {filteredProperties.length > 0 && (
        <div className="mt-12 rounded-xl border border-forest/15 bg-forest/5 p-8 text-center">
          <Fish className="mx-auto size-8 text-forest" />
          <h2 className="mt-4 font-heading text-xl font-semibold text-forest-deep">
            Ready to fish these waters?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
            Book access through a member club. Landowners set the rules, clubs
            vet the anglers, and you get on the water.
          </p>
          <Button asChild className="mt-6 bg-forest text-white hover:bg-forest/90">
            <Link href="/login">Log In to Book</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
