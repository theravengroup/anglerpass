"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  MapPin,
  Droplets,
  Users,
  DollarSign,
  Compass,
  Fish,
} from "lucide-react";

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
  accessible_through: {
    membership_id: string;
    club_id: string;
    club_name: string;
  }[];
}

const WATER_TYPE_LABELS: Record<string, string> = {
  river: "River",
  stream: "Stream",
  lake: "Lake",
  pond: "Pond",
  spring_creek: "Spring Creek",
  tailwater: "Tailwater",
  reservoir: "Reservoir",
};

export default function DiscoverPage() {
  const [properties, setProperties] = useState<DiscoverProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [waterTypeFilter, setWaterTypeFilter] = useState<string>("all");
  const [noClubs, setNoClubs] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams();
        if (waterTypeFilter && waterTypeFilter !== "all") {
          params.set("water_type", waterTypeFilter);
        }

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
    }
    load();
  }, [waterTypeFilter]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Discover Private Waters
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Browse properties available through your club memberships.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select
            value={waterTypeFilter}
            onValueChange={setWaterTypeFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Water type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Water Types</SelectItem>
              {Object.entries(WATER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* No clubs state */}
      {noClubs && (
        <Card className="border-bronze/20 bg-bronze/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
              <Users className="size-6 text-bronze" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              Join a Club First
            </h3>
            <p className="mt-1 max-w-md text-center text-sm text-text-secondary">
              To discover and book private waters on AnglerPass, you need to be
              a member of at least one fishing club. Ask your club admin to
              invite you.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty state (has clubs but no properties) */}
      {!noClubs && properties.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-bronze/10">
              <Compass className="size-6 text-bronze" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No properties available yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              Your clubs don&apos;t have access to any published properties yet.
              Check back soon — new waters are added regularly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Property grid */}
      {properties.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/angler/properties/${property.id}`}
            >
              <Card className="group overflow-hidden border-stone-light/20 transition-all hover:border-stone-light/40 hover:shadow-md">
                {/* Photo */}
                <div className="relative aspect-[16/10] overflow-hidden bg-offwhite">
                  {property.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={property.photos[0]}
                      alt={property.name}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <MapPin className="size-8 text-text-light" />
                    </div>
                  )}
                  {/* Club badge */}
                  <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-river backdrop-blur-sm">
                    {property.accessible_through[0]?.club_name}
                    {property.accessible_through.length > 1 &&
                      ` +${property.accessible_through.length - 1}`}
                  </div>
                </div>

                <CardContent className="space-y-3 p-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      {property.name}
                    </h3>
                    {property.location_description && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-text-light">
                        <MapPin className="size-3" />
                        {property.location_description}
                      </p>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
                    {property.water_type && (
                      <span className="flex items-center gap-1">
                        <Droplets className="size-3" />
                        {WATER_TYPE_LABELS[property.water_type] ??
                          property.water_type}
                      </span>
                    )}
                    {property.species?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Fish className="size-3" />
                        {property.species.slice(0, 2).join(", ")}
                        {property.species.length > 2 &&
                          ` +${property.species.length - 2}`}
                      </span>
                    )}
                    {property.water_miles && (
                      <span>
                        {property.water_miles} mi
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  {property.rate_adult_full_day != null && (
                    <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
                      <DollarSign className="size-3.5" />
                      {property.rate_adult_full_day}/day
                      {property.half_day_allowed &&
                        property.rate_adult_half_day != null && (
                          <span className="text-xs font-normal text-text-light">
                            · ${property.rate_adult_half_day}/half
                          </span>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
