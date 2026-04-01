"use client";

import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Users,
  Compass,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
} from "lucide-react";
import SearchFilters, {
  type SearchFiltersState,
} from "@/components/map/SearchFilters";
import PropertyCard from "@/components/map/PropertyCard";

// Lazy-load map to keep bundle small
const PropertyMap = lazy(() => import("@/components/map/PropertyMap"));

// ─── Club browse types ──────────────────────────────────────────────

interface BrowseClub {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  logo_url: string | null;
  member_count: number;
  membership_status: string | null;
  is_member: boolean;
}

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

      {/* No clubs state → show club browser */}
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

// ─── Club Browser Component ─────────────────────────────────────────

function ClubBrowser() {
  const [clubs, setClubs] = useState<BrowseClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [joining, setJoining] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchClubs = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/clubs/browse?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleSearch = () => {
    fetchClubs(searchQ);
  };

  // Check if user already has a home club (active) or pending request
  const hasHomeClub = clubs.some((c) => c.membership_status === "active");
  const hasPending = clubs.some((c) => c.membership_status === "pending");

  const handleJoin = async (clubId: string) => {
    setJoining(clubId);
    setMessage(null);
    try {
      const res = await fetch("/api/clubs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ club_id: clubId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        // Update the club's status locally
        setClubs((prev) =>
          prev.map((c) =>
            c.id === clubId
              ? { ...c, membership_status: "pending", is_member: true }
              : c
          )
        );
      } else {
        setMessage(data.error ?? "Failed to send request");
      }
    } catch {
      setMessage("An error occurred. Please try again.");
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-bronze/20 bg-bronze/5">
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bronze/10">
              <Users className="size-5 text-bronze" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                Find Your Home Club
              </h3>
              <p className="mt-0.5 text-sm text-text-secondary">
                Choose a home club to get started. Through the Cross-Club
                Network, your membership gives you access to fish at partner
                clubs too — no need to join multiple clubs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search clubs by name or location..."
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleSearch}
          disabled={loading}
        >
          Search
        </Button>
      </div>

      {/* Status message */}
      {message && (
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">
          {message}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-bronze" />
        </div>
      )}

      {/* Club list */}
      {!loading && clubs.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Compass className="size-8 text-text-light" />
            <p className="mt-3 text-sm text-text-secondary">
              {searchQ
                ? "No clubs found matching your search."
                : "No clubs are available yet. Check back soon!"}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && clubs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {clubs.map((club) => {
            const isHome = club.membership_status === "active";
            const isPending = club.membership_status === "pending";
            // Disable join if user already has a home club or a pending request
            const canJoin = !hasHomeClub && !hasPending && !isHome && !isPending;

            return (
              <Card
                key={club.id}
                className={`border-stone-light/20 ${isHome ? "ring-2 ring-river/30" : ""}`}
              >
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-river/10 text-lg font-semibold text-river">
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-text-primary">
                        {club.name}
                      </h3>
                      {club.location && (
                        <p className="flex items-center gap-1 text-xs text-text-light">
                          <MapPin className="size-3" />
                          {club.location}
                        </p>
                      )}
                      {club.description && (
                        <p className="mt-1.5 line-clamp-2 text-xs text-text-secondary">
                          {club.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-text-light">
                          {club.member_count} member
                          {club.member_count !== 1 ? "s" : ""}
                        </span>

                        {isHome ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-forest">
                            <CheckCircle2 className="size-3.5" />
                            Home Club
                          </span>
                        ) : isPending ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-bronze">
                            <Clock className="size-3.5" />
                            Pending
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-river/30 text-xs text-river hover:bg-river/5"
                            onClick={() => handleJoin(club.id)}
                            disabled={!canJoin || joining === club.id}
                            title={
                              !canJoin
                                ? "You already have a home club or pending request"
                                : undefined
                            }
                          >
                            {joining === club.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : null}
                            Request to Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
