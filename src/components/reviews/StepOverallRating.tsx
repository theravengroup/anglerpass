"use client";

import { AlertCircle } from "lucide-react";
import StarRating from "./StarRating";

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Below average",
  3: "Average",
  4: "Good",
  5: "Exceptional",
};

interface StepOverallRatingProps {
  value: number;
  onChange: (value: number) => void;
  tripCompleted: boolean;
  propertyName: string;
  propertyPhoto: string | null;
}

export default function StepOverallRating({
  value,
  onChange,
  tripCompleted,
  propertyName,
  propertyPhoto,
}: StepOverallRatingProps) {
  return (
    <div className="space-y-6">
      {/* Property hero */}
      <div className="overflow-hidden rounded-xl border border-stone-light/20">
        {propertyPhoto && (
          <div className="aspect-[16/9] max-h-48 overflow-hidden bg-offwhite">
            <img
              src={propertyPhoto}
              alt={propertyName}
              className="size-full object-cover"
            />
          </div>
        )}
        <div className="px-4 py-3">
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
            {propertyName}
          </h3>
        </div>
      </div>

      {/* Incomplete trip notice */}
      {!tripCompleted && (
        <div
          className="flex items-start gap-2.5 rounded-lg border border-bronze/20 bg-bronze/5 px-4 py-3"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-bronze" />
          <p className="text-sm text-text-secondary">
            Because your trip did not complete due to an access issue, your
            review will reflect only the categories relevant to your experience.
          </p>
        </div>
      )}

      {/* Rating selector */}
      <div className="flex flex-col items-center py-4">
        <h2 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
          How was your experience?
        </h2>
        <p className="mb-6 text-sm text-text-secondary">
          Rate your overall experience at this property
        </p>

        <StarRating value={value} onChange={onChange} size="lg" />

        <div className="mt-3 h-6">
          {value > 0 && (
            <span className="text-sm font-medium text-bronze">
              {RATING_LABELS[value]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
