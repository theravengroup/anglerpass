"use client";

import { MapPin, Fish, Ruler, DollarSign, BedDouble } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PropertyResult {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  species: string[] | null;
  water_type: string | null;
  water_miles: number | null;
  rate_full_day: number | null;
  rate_half_day: number | null;
  half_day_allowed: boolean | null;
  max_rods: number | null;
  lodging_available: boolean | null;
  club_name: string | null;
}

interface CompassPropertyCardProps {
  property: PropertyResult;
}

export default function CompassPropertyCard({
  property,
}: CompassPropertyCardProps) {
  return (
    <Card className="border-parchment bg-parchment-light/50 py-3 gap-2">
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-heading text-base font-semibold text-forest-deep truncate">
              {property.name}
            </h4>
            {property.club_name && (
              <p className="text-xs text-text-secondary">
                {property.club_name}
              </p>
            )}
          </div>
          {property.rate_full_day && (
            <span className="shrink-0 rounded-md bg-forest/10 px-2 py-1 text-xs font-semibold text-forest">
              ${property.rate_full_day}/day
            </span>
          )}
        </div>

        {property.location && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin className="size-3 shrink-0 text-stone" />
            <span className="truncate">{property.location}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
          {property.species && property.species.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Fish className="size-3 shrink-0 text-river" />
              <span>{property.species.join(", ")}</span>
            </div>
          )}

          {property.water_type && (
            <div className="flex items-center gap-1.5">
              <Ruler className="size-3 shrink-0 text-river" />
              <span className="capitalize">
                {property.water_type}
                {property.water_miles
                  ? ` (${property.water_miles} mi)`
                  : ""}
              </span>
            </div>
          )}

          {property.half_day_allowed && property.rate_half_day && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="size-3 shrink-0 text-bronze" />
              <span>${property.rate_half_day} half-day</span>
            </div>
          )}

          {property.lodging_available && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="size-3 shrink-0 text-stone" />
              <span>Lodging available</span>
            </div>
          )}
        </div>

        {property.description && (
          <p className="text-xs text-text-secondary line-clamp-2">
            {property.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
