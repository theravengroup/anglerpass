"use client";

import { cn } from "@/lib/utils";
import {
  RESTROOM_TYPE_LABELS,
  SITE_AMENITIES,
  NEARBY_SERVICES,
  BEST_FOR_LABELS,
  PRESSURE_LEVEL_LABELS,
  MONTH_LABELS,
} from "@/lib/constants/property-knowledge";
import {
  displayValue,
  displayMultiSelect,
  displaySelect,
  displayRating,
} from "./knowledge-display-helpers";
import { SectionCard, Field, FieldValue, get } from "./knowledge-display-primitives";

export function AmenitiesSection({ data }: { data: unknown }) {
  const siteAmenities = get(data, "site_amenities") as Record<string, boolean> | undefined;
  const nearbyServices = get(data, "nearby_services") as Record<string, boolean> | undefined;

  return (
    <SectionCard title="Amenities & Facilities">
      <Field label="Restroom Type">
        <FieldValue value={displaySelect(get(data, "restroom_type"), RESTROOM_TYPE_LABELS)} />
      </Field>
      <Field label="Fly Shop Distance">
        <FieldValue value={displayValue(get(data, "fly_shop_distance"))} />
      </Field>
      <Field label="Grocery Distance">
        <FieldValue value={displayValue(get(data, "grocery_distance"))} />
      </Field>
      <Field label="Camping Details" full>
        <FieldValue value={displayValue(get(data, "camping_details"))} />
      </Field>

      {/* Site amenities grid */}
      <div className="sm:col-span-2">
        <dt className="mb-2 text-xs font-medium text-text-secondary">Site Amenities</dt>
        <dd className="flex flex-wrap gap-2">
          {SITE_AMENITIES.map(({ key, label }) => {
            const available = siteAmenities?.[key];
            return (
              <span
                key={key}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  available
                    ? "bg-forest/10 text-forest"
                    : "bg-offwhite text-text-light"
                )}
              >
                {available ? "+" : "-"} {label}
              </span>
            );
          })}
        </dd>
      </div>

      {/* Nearby services grid */}
      <div className="sm:col-span-2">
        <dt className="mb-2 text-xs font-medium text-text-secondary">Nearby Services</dt>
        <dd className="flex flex-wrap gap-2">
          {NEARBY_SERVICES.map(({ key, label }) => {
            const available = nearbyServices?.[key];
            return (
              <span
                key={key}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  available
                    ? "bg-river/10 text-river"
                    : "bg-offwhite text-text-light"
                )}
              >
                {available ? "+" : "-"} {label}
              </span>
            );
          })}
        </dd>
      </div>

      <Field label="Notes" full>
        <FieldValue value={displayValue(get(data, "notes"))} />
      </Field>
    </SectionCard>
  );
}

export function ExperienceProfileSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Experience Profile">
      <Field label="Solitude">
        <FieldValue value={displayRating(get(data, "solitude_rating"), "solitude")} />
      </Field>
      <Field label="Scenery">
        <FieldValue value={displayRating(get(data, "scenery_rating"), "scenery")} />
      </Field>
      <Field label="Photography">
        <FieldValue value={displayRating(get(data, "photography_rating"), "photography")} />
      </Field>
      <Field label="Beginner-Friendly">
        <FieldValue value={displayRating(get(data, "beginner_rating"), "beginner_friendly")} />
      </Field>
      <Field label="Best For">
        <FieldValue value={displayMultiSelect(get(data, "best_for"), BEST_FOR_LABELS)} />
      </Field>
      <Field label="Property Story" full>
        <FieldValue value={displayValue(get(data, "property_story"))} />
      </Field>
      <Field label="Unique Features" full>
        <FieldValue value={displayValue(get(data, "unique_features"))} />
      </Field>
      <Field label="Scenic Highlights" full>
        <FieldValue value={displayValue(get(data, "scenic_highlights"))} />
      </Field>
      <Field label="Photography Spots" full>
        <FieldValue value={displayValue(get(data, "photography_spots"))} />
      </Field>
      <Field label="Notes" full>
        <FieldValue value={displayValue(get(data, "notes"))} />
      </Field>
    </SectionCard>
  );
}

export function PressureCrowdingSection({ data }: { data: unknown }) {
  return (
    <SectionCard title="Pressure & Crowding">
      <Field label="Overall Pressure">
        <FieldValue value={displaySelect(get(data, "overall_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Weekday Pressure">
        <FieldValue value={displaySelect(get(data, "weekday_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Weekend Pressure">
        <FieldValue value={displaySelect(get(data, "weekend_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Peak Season Pressure">
        <FieldValue value={displaySelect(get(data, "peak_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Off-Season Pressure">
        <FieldValue value={displaySelect(get(data, "off_season_pressure"), PRESSURE_LEVEL_LABELS)} />
      </Field>
      <Field label="Busiest Months">
        <FieldValue value={displayMultiSelect(get(data, "busiest_months"), MONTH_LABELS)} />
      </Field>
      <Field label="Quietest Months">
        <FieldValue value={displayMultiSelect(get(data, "quietest_months"), MONTH_LABELS)} />
      </Field>
      <Field label="Crowd Type">
        <FieldValue value={displayValue(get(data, "crowd_type"))} />
      </Field>
      <Field label="Notes" full>
        <FieldValue value={displayValue(get(data, "notes"))} />
      </Field>
    </SectionCard>
  );
}
