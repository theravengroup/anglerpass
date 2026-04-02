"use client";

import StarRating from "./StarRating";
import {
  CATEGORY_KEYS,
  INCOMPLETE_TRIP_CATEGORIES,
} from "@/lib/validations/reviews";

type CategoryKey = (typeof CATEGORY_KEYS)[number];

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  description: string;
}

const FULL_CATEGORIES: CategoryConfig[] = [
  {
    key: "accuracy_of_listing",
    label: "Accuracy of Listing",
    description: "Did the property match what was described?",
  },
  {
    key: "ease_of_access",
    label: "Ease of Access",
    description: "How easy was it to reach and enter the property?",
  },
  {
    key: "property_condition",
    label: "Property Condition",
    description: "Was the property well-maintained?",
  },
  {
    key: "quality_of_fishing_experience",
    label: "Quality of Fishing Experience",
    description: "How was the fishing itself?",
  },
  {
    key: "privacy_crowding",
    label: "Privacy / Crowding",
    description: "Did you have the water to yourself?",
  },
  {
    key: "host_communication",
    label: "Host Communication",
    description: "Was the host responsive and helpful?",
  },
  {
    key: "value_for_price",
    label: "Value for Price",
    description: "Was the experience worth what you paid?",
  },
];

const INCOMPLETE_CATEGORIES: CategoryConfig[] = [
  {
    key: "accuracy_of_listing",
    label: "Accuracy of Listing",
    description: "Did the listing accurately describe access and property?",
  },
  {
    key: "ease_of_access",
    label: "Ease of Access",
    description: "How easy was it to reach and attempt entry?",
  },
  {
    key: "host_communication",
    label: "Host Communication",
    description: "Was the host responsive when issues arose?",
  },
];

interface StepCategoryRatingsProps {
  tripCompleted: boolean;
  ratings: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

export default function StepCategoryRatings({
  tripCompleted,
  ratings,
  onChange,
}: StepCategoryRatingsProps) {
  const categories = tripCompleted ? FULL_CATEGORIES : INCOMPLETE_CATEGORIES;

  return (
    <div className="space-y-2">
      <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
        Rate each category
      </h2>
      <p className="text-sm text-text-secondary">
        {tripCompleted
          ? "Rate all 7 categories based on your experience."
          : "Rate the 3 categories relevant to your experience."}
      </p>

      <div className="mt-4 space-y-0">
        {categories.map((category, i) => (
          <div
            key={category.key}
            className={`py-5 ${
              i < categories.length - 1
                ? "border-b border-stone-light/15"
                : ""
            }`}
          >
            <div className="mb-2">
              <h3 className="text-sm font-medium text-text-primary">
                {category.label}
              </h3>
              <p className="text-xs text-text-light">{category.description}</p>
            </div>
            <StarRating
              value={ratings[category.key] ?? 0}
              onChange={(val) => onChange(category.key, val)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
