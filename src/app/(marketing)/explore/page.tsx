"use client";

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
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

export default function ExplorePage() {
  const [properties, setProperties] = useState<SearchProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"map" | "list">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFiltersState>({
    q: "",
    water_type: "",
    species: "",
    min_price: "",
    max_price: "",
    lodging: false,
  });

  const fetchProperties = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.water_type) params.set("water_type", filters.water_type);
      if (filters.species) params.set("species", filters.species);
      if (filters.min_price) params.set("min_price", filters.min_price);
      if (filters.max_price) params.set("max_price", filters.max_price);

      const res = await fetch(`/api/properties/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties ?? []);
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
              {properties.length === 0
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
                href="/signup"
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
            <PropertyCard key={p.id} property={p} href="/signup" />
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
            Join AnglerPass to book access through a member club. Landowners set
            the rules, clubs vet the anglers, and you get on the water.
          </p>
          <Button asChild className="mt-6 bg-forest text-white hover:bg-forest/90">
            <Link href="/signup">Join the Waitlist</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
