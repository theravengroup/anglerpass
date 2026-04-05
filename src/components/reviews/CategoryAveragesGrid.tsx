import { Star } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  accuracy_of_listing: "Accuracy of Listing",
  ease_of_access: "Ease of Access",
  property_condition: "Property Condition",
  quality_of_fishing_experience: "Quality of Fishing",
  privacy_crowding: "Privacy & Crowding",
  host_communication: "Host Communication",
  value_for_price: "Value for Price",
};

// Display order
const CATEGORY_ORDER = [
  "quality_of_fishing_experience",
  "accuracy_of_listing",
  "ease_of_access",
  "property_condition",
  "privacy_crowding",
  "host_communication",
  "value_for_price",
];

interface CategoryAveragesGridProps {
  categoryAverages: Record<string, number>;
}

export default function CategoryAveragesGrid({
  categoryAverages,
}: CategoryAveragesGridProps) {
  const categories = CATEGORY_ORDER.filter(
    (key) => categoryAverages[key] !== undefined
  );

  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((key) => {
        const avg = categoryAverages[key];
        // Bar fill: rating / 5 as percentage
        const fillPct = (avg / 5) * 100;

        return (
          <div
            key={key}
            className="rounded-lg border border-stone-light/15 bg-white px-3.5 py-3"
          >
            <p className="text-xs font-medium text-text-primary">
              {CATEGORY_LABELS[key] ?? key}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {avg.toFixed(1)}
              </span>
              <Star className="size-3.5 fill-bronze text-bronze" />
            </div>
            {/* Visual bar — dynamic width from runtime data, Tailwind cannot generate arbitrary values */}
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-light/20">
              <div
                className="h-full rounded-full bg-bronze/70 transition-all duration-500"
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
