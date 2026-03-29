"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ChevronRight as ArrowRight,
  Building2,
  TreePine,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Club {
  id: string;
  name: string;
  location: string | null;
  owner_name: string | null;
  owner_email: string | null;
  member_count: number;
  property_count: number;
  subscription_tier: string | null;
  created_at: string;
}

interface ClubsResponse {
  clubs: Club[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const TIER_COLORS: Record<string, string> = {
  free: "bg-stone/10 text-text-secondary border-stone/20",
  basic: "bg-river/10 text-river border-river/20",
  premium: "bg-bronze/10 text-bronze border-bronze/20",
  enterprise: "bg-forest/10 text-forest border-forest/20",
};

function tierLabel(tier: string | null): string {
  if (!tier) return "Free";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function ClubsPage() {
  const [data, setData] = useState<ClubsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/clubs?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const debounce = setTimeout(load, 300);
    return () => clearTimeout(debounce);
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Clubs
          {data && (
            <span className="ml-2 text-lg font-normal text-text-light">
              ({data.total})
            </span>
          )}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage all clubs on the platform.
        </p>
      </div>

      {/* Search bar */}
      <Card className="border-stone-light/20">
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-light" />
            <input
              type="text"
              placeholder="Search by club name or location..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border border-stone-light/25 bg-white pl-9 pr-3 text-sm text-text-primary placeholder:text-text-light focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
            />
          </div>
        </CardContent>
      </Card>

      {/* Club list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-river" />
          </div>
        ) : !data?.clubs?.length ? (
          <Card className="border-stone-light/20">
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-river/10">
                  <Users className="size-6 text-river" />
                </div>
                <h3 className="mt-4 text-base font-medium text-text-primary">
                  No clubs found
                </h3>
                <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
                  {search
                    ? "Try adjusting your search terms."
                    : "Clubs will appear here once they are created."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          data.clubs.map((club) => (
            <Link key={club.id} href={`/admin/clubs/${club.id}`}>
              <Card className="border-stone-light/20 transition-colors hover:border-river/30 hover:bg-offwhite/50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Club initial */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-river/10 text-lg font-semibold text-river">
                      {club.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Club info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-text-primary">
                          {club.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-[10px] ${
                            TIER_COLORS[club.subscription_tier ?? "free"] ??
                            TIER_COLORS.free
                          }`}
                        >
                          {tierLabel(club.subscription_tier)}
                        </Badge>
                      </div>

                      {club.location && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-text-light">
                          <MapPin className="size-3" />
                          <span className="truncate">{club.location}</span>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                        <span className="text-text-light">
                          Owner:{" "}
                          <span className="text-text-secondary">
                            {club.owner_name ?? "Unknown"}
                          </span>
                          {club.owner_email && (
                            <span className="ml-1 text-text-light">
                              ({club.owner_email})
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-4 text-xs text-text-light">
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {club.member_count}{" "}
                          {club.member_count === 1 ? "member" : "members"}
                        </span>
                        <span className="flex items-center gap-1">
                          <TreePine className="size-3" />
                          {club.property_count}{" "}
                          {club.property_count === 1
                            ? "property"
                            : "properties"}
                        </span>
                        <span className="text-text-light">
                          Created{" "}
                          {new Date(club.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="size-4 shrink-0 text-text-light" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <Card className="border-stone-light/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-light">
                Showing {(data.page - 1) * data.page_size + 1}&ndash;
                {Math.min(data.page * data.page_size, data.total)} of{" "}
                {data.total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.total_pages}
                  className="size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
