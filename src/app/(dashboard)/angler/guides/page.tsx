"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import GuideCard from "@/components/angler/GuideCard";

interface BrowseGuide {
  id: string;
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  techniques: string[];
  species: string[];
  skill_levels: string[];
  base_location: string | null;
  service_region: string | null;
  rate_full_day: number | null;
  rate_half_day: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  trips_completed: number | null;
  languages: string[] | null;
}

const COMMON_SPECIES = [
  "Brown Trout",
  "Rainbow Trout",
  "Brook Trout",
  "Cutthroat Trout",
  "Steelhead",
  "Largemouth Bass",
  "Smallmouth Bass",
  "Musky",
  "Pike",
  "Salmon",
];

export default function GuideBrowsePage() {
  const [guides, setGuides] = useState<BrowseGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [searchText, setSearchText] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [locationText, setLocationText] = useState("");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLocation(locationText), 400);
    return () => clearTimeout(timer);
  }, [locationText]);

  async function fetchGuides() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (selectedSpecies.length > 0) params.set("species", selectedSpecies.join(","));
      if (debouncedLocation) params.set("location", debouncedLocation);
      params.set("page", String(page));

      const res = await fetch(`/api/guides/browse?${params}`);
      if (!res.ok) {
        setError("Failed to load guides. Please try again.");
        return;
      }
      const data = await res.json();
      setGuides(data.guides ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch {
      setError("Failed to load guides. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGuides();
  }, [debouncedSearch, selectedSpecies, debouncedLocation, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedSpecies, debouncedLocation]);

  function toggleSpecies(s: string) {
    setSelectedSpecies((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function clearFilters() {
    setSearchText("");
    setLocationText("");
    setSelectedSpecies([]);
    setPage(1);
  }

  const hasFilters =
    searchText !== "" || locationText !== "" || selectedSpecies.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Find a Guide
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Browse experienced fly fishing guides available for your next trip.
        </p>
      </div>

      {/* Search and filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
            <Input
              placeholder="Search guides by name, bio, or location..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="border-stone-light/30 pl-9"
            />
          </div>
          <div className="relative sm:w-56">
            <Input
              placeholder="Filter by location..."
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="border-stone-light/30"
            />
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="shrink-0 self-center text-xs"
            >
              <X className="mr-1 size-3" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Species chips */}
        <div className="flex flex-wrap gap-1.5">
          {COMMON_SPECIES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSpecies(s)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedSpecies.includes(s)
                  ? "bg-bronze text-white"
                  : "bg-stone-light/10 text-text-secondary hover:bg-stone-light/20"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" aria-live="polite" className="text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      )}

      {/* Results */}
      {!loading && !error && guides.length === 0 && (
        <EmptyState
          icon={Users}
          title="No guides found"
          description={
            hasFilters
              ? "Try adjusting your search or filters to find more guides."
              : "No approved guides are available yet. Check back soon."
          }
          iconColor="text-charcoal"
        />
      )}

      {!loading && guides.length > 0 && (
        <>
          <p className="text-xs text-text-light">
            {total} guide{total !== 1 ? "s" : ""} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
