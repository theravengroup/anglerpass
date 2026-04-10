"use client";

import { LODGING_AMENITIES } from "@/lib/constants/lodging";

interface LodgingAmenitiesProps {
  amenities: Record<string, boolean>;
  onToggle: (key: string) => void;
  disabled: boolean;
}

export default function LodgingAmenities({
  amenities,
  onToggle,
  disabled,
}: LodgingAmenitiesProps) {
  return (
    <div className="space-y-4 border-t border-stone-light/20 pt-4">
      <p className="text-sm font-medium text-text-primary">Amenities</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
        {LODGING_AMENITIES.map((amenity) => (
          <label
            key={amenity.key}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <input
              type="checkbox"
              className="size-4 rounded border-stone-light/30 accent-forest"
              checked={amenities[amenity.key] ?? false}
              onChange={() => onToggle(amenity.key)}
              disabled={disabled}
            />
            <span className="text-sm text-text-secondary">
              {amenity.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
