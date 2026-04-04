"use client";

import { ExternalLink, Home, BedDouble, Bath, Users, Clock, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LODGING_TYPE_LABELS,
  PET_POLICY_LABELS,
  LODGING_AMENITIES,
  ANGLING_AMENITY_KEYS,
  type LodgingType,
  type PetPolicy,
  type PropertyLodging,
} from "@/lib/constants/lodging";

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${minutes} ${suffix}`;
}

function formatRate(lodging: PropertyLodging): string | null {
  const { nightly_rate_min, nightly_rate_max } = lodging;
  if (nightly_rate_min == null && nightly_rate_max == null) return null;

  if (nightly_rate_min != null && nightly_rate_max != null) {
    if (nightly_rate_min === nightly_rate_max) {
      return `$${nightly_rate_min}/night`;
    }
    return `$${nightly_rate_min}–$${nightly_rate_max}/night`;
  }

  if (nightly_rate_min != null) {
    return `From $${nightly_rate_min}/night`;
  }

  return `Up to $${nightly_rate_max}/night`;
}

interface LodgingDisplayProps {
  lodging: PropertyLodging;
}

export default function LodgingDisplay({ lodging }: LodgingDisplayProps) {
  const amenityKeys = Object.entries(lodging.amenities ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k);

  const anglingAmenities = amenityKeys.filter((k) =>
    (ANGLING_AMENITY_KEYS as readonly string[]).includes(k)
  );
  const generalAmenities = amenityKeys.filter(
    (k) => !(ANGLING_AMENITY_KEYS as readonly string[]).includes(k)
  );

  const amenityLabel = (key: string) =>
    LODGING_AMENITIES.find((a) => a.key === key)?.label ?? key;

  const rate = formatRate(lodging);
  const typeLabel = lodging.lodging_type
    ? lodging.lodging_type === "other"
      ? lodging.lodging_type_other ?? "Other"
      : LODGING_TYPE_LABELS[lodging.lodging_type as LodgingType]
    : null;

  return (
    <div className="rounded-xl border border-bronze/20 bg-bronze/5 p-5">
      <div className="flex items-center gap-2.5">
        <Home className="size-5 text-bronze" />
        <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
          Stay On-Property
        </h3>
      </div>

      {/* Name & type */}
      {(lodging.lodging_name || typeLabel) && (
        <p className="mt-2 text-sm font-medium text-text-primary">
          {lodging.lodging_name}
          {lodging.lodging_name && typeLabel && " · "}
          {typeLabel}
        </p>
      )}

      {/* Description */}
      {lodging.lodging_description && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
          {lodging.lodging_description}
        </p>
      )}

      {/* Quick stats */}
      <div className="mt-3 flex flex-wrap gap-3">
        {lodging.sleeps != null && (
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Users className="size-3.5" />
            Sleeps {lodging.sleeps}
          </div>
        )}
        {lodging.bedrooms != null && (
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <BedDouble className="size-3.5" />
            {lodging.bedrooms} {lodging.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
          </div>
        )}
        {lodging.bathrooms != null && (
          <div className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Bath className="size-3.5" />
            {Number(lodging.bathrooms)} {Number(lodging.bathrooms) === 1 ? "Bath" : "Baths"}
          </div>
        )}
      </div>

      {/* Rate & policies */}
      <div className="mt-3 flex flex-wrap gap-3">
        {rate && (
          <span className="rounded-full bg-bronze/10 px-3 py-1 text-xs font-medium text-bronze">
            {rate}
          </span>
        )}
        {lodging.min_nights > 1 && (
          <span className="rounded-full bg-stone/10 px-3 py-1 text-xs font-medium text-text-secondary">
            {lodging.min_nights}-night minimum
          </span>
        )}
        <span className="flex items-center gap-1 rounded-full bg-stone/10 px-3 py-1 text-xs font-medium text-text-secondary">
          <PawPrint className="size-3" />
          {PET_POLICY_LABELS[lodging.pet_policy as PetPolicy] ?? "No Pets"}
        </span>
      </div>

      {/* Check-in / Check-out */}
      {(lodging.checkin_time || lodging.checkout_time) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
          {lodging.checkin_time && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Check-in: {formatTime(lodging.checkin_time)}
            </span>
          )}
          {lodging.checkout_time && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              Check-out: {formatTime(lodging.checkout_time)}
            </span>
          )}
        </div>
      )}

      {/* Angling amenities (highlighted) */}
      {anglingAmenities.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-bronze">Angler Amenities</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {anglingAmenities.map((key) => (
              <span
                key={key}
                className="rounded-full bg-bronze/10 px-2.5 py-1 text-xs text-bronze"
              >
                {amenityLabel(key)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* General amenities */}
      {generalAmenities.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-text-secondary">Amenities</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {generalAmenities.map((key) => (
              <span
                key={key}
                className="rounded-full bg-offwhite px-2.5 py-1 text-xs text-text-secondary"
              >
                {amenityLabel(key)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-4">
        {lodging.external_listing_url ? (
          <>
            {/* V2: Replace external link with integrated booking when Hospitable connection is active */}
            <a
              href={lodging.external_listing_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="size-4" />
                View Lodging Listing
              </Button>
            </a>
            <p className="mt-3 text-xs leading-relaxed text-text-light">
              Lodging is managed independently through a third-party platform.
              Confirm availability for your dates before completing your fishing
              access booking.
            </p>
          </>
        ) : (
          <p className="text-sm text-text-secondary">
            Contact the property owner about lodging availability.
          </p>
        )}
      </div>
    </div>
  );
}
