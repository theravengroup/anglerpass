"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Droplets, Fish, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  property: {
    id: string;
    name: string;
    description: string | null;
    location_description: string | null;
    water_type: string | null;
    species: string[];
    photos: string[];
    rate_adult_full_day: number | null;
    rate_adult_half_day: number | null;
    half_day_allowed: boolean;
    water_miles: number | null;
    accessible_through?: {
      club_name: string;
      membership_id: string;
    }[];
  };
  href: string;
  selected?: boolean;
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

export default function PropertyCard({
  property,
  href,
  selected,
}: PropertyCardProps) {
  const photo = property.photos?.[0];

  return (
    <Link href={href}>
      <Card
        className={cn(
          "overflow-hidden transition-all hover:shadow-md",
          selected
            ? "ring-2 ring-forest border-forest"
            : "border-stone-light/20"
        )}
      >
        {/* Photo */}
        <div className="relative h-40 bg-stone-light/10">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={property.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Fish className="size-8 text-stone-light/40" />
            </div>
          )}

          {/* Water type badge */}
          {property.water_type && (
            <Badge className="absolute left-2 top-2 bg-river/90 text-white text-[10px]">
              <Droplets className="mr-1 size-2.5" />
              {WATER_TYPE_LABELS[property.water_type] ?? property.water_type}
            </Badge>
          )}
        </div>

        <CardContent className="p-3.5">
          <h3 className="font-[family-name:var(--font-heading)] text-base font-semibold text-text-primary truncate">
            {property.name}
          </h3>

          {property.location_description && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-text-light truncate">
              <MapPin className="size-3 shrink-0" />
              {property.location_description}
            </p>
          )}

          {/* Species */}
          {property.species?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {property.species.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-medium text-forest"
                >
                  {s}
                </span>
              ))}
              {property.species.length > 3 && (
                <span className="text-[10px] text-text-light">
                  +{property.species.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Price + clubs */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm font-semibold text-forest">
              <DollarSign className="size-3.5" />
              {property.rate_adult_full_day
                ? `${property.rate_adult_full_day}/day`
                : "Contact"}
            </div>

            {property.accessible_through &&
              property.accessible_through.length > 0 && (
                <span className="text-[10px] text-bronze truncate max-w-[120px]">
                  via {property.accessible_through[0].club_name}
                </span>
              )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
