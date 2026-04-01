"use client";

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Compass } from "lucide-react";
import SearchFilters, {
  type SearchFiltersState,
} from "@/components/map/SearchFilters";
import PropertyCard from "@/components/map/PropertyCard";
import ClubBrowser from "@/components/angler/ClubBrowser";

// Lazy-load map to keep bundle small
const PropertyMap = lazy(() => import("@/components/map/PropertyMap"));

interface DiscoverProperty {
  id: string;
  name: string;
  description: string | null;
  location_description: string | null;
  water_type: string | null;
  species: string[];
  photos: string[];
  capacity: number | null;
  rate_adult_full_day: number | null;
  rate_adult_half_day: number | null;
  half_day_allowed: boolean;
  water_miles: number | null;
  latitude: number | null;
  longitude: number | null;
  is_cross_club?: boolean;
  accessible_through: {
    membership_id: string;
    club_id: string;
    club_name: string;
  }[];
}

export default function DiscoverPage() {
  const [properties, setProperties] = useState<DiscoverProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [noClubs, setNoClubs] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFiltersState>({
    q: "",
    water_type: "",
    species: "",
    min_price: "",
    max_price: "",
  });

  const fetchProperties = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.water_type) params.set("water_type", filters.water_type);
      if (filters.species) params.set("species", filters.species);
      if (filters.min_price) params.set("min_price", filters.min_price);
      if (filters.max_price) params.set("max_price", filters.max_price);

      const res = await fetch(`/api/properties/discover?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties ?? []);
        setNoClubs(!data.memberships?.length);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [filters.water_type, filters.species, filters.min_price, filters.max_price]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // Client-side text search filter (q filter)
  const filteredProperties = useMemo(() => {
    if (!filters.q) return properties;
    const q = filters.q.toLowerCase();
    return properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location_description?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.species?.some((s) => s.toLowerCase().includes(q))
    );
  }, [properties, filters.q]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Discover Private Waters
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Browse properties available through your home club and the Cross-Club
          Network.
        </p>
      </div>

      {/* No clubs state -> show club browser */}
      {noClubs ? (
        <ClubBrowser />
      ) : (
        <>
          {/* Filters + view toggle */}
          <SearchFilters
            filters={filters}
            onChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resultCount={filteredProperties.length}
          />

          {/* Empty state */}
          {filteredProperties.length === 0 && (
            <Card className="border-stone-light/20">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
                  <Compass className="size-6 text-bronze" />
                </div>
                <h3 className="mt-4 text-base font-medium text-text-primary">
                  No properties found
                </h3>
                <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
                  {properties.length === 0
                    ? "Your clubs don't have access to any published properties yet. Check back soon."
                    : "Try adjusting your filters to see more results."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Map view */}
          {viewMode === "map" && filteredProperties.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
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

              {/* Side panel with scrollable list */}
              <div className="max-h-[600px] space-y-3 overflow-y-auto pr-1">
                {filteredProperties.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    href={`/angler/properties/${p.id}`}
                    selected={p.id === selectedId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* List view */}
          {viewMode === "list" && filteredProperties.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProperties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  href={`/angler/properties/${p.id}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
