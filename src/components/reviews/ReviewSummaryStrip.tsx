import { Star } from "lucide-react";

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  accuracy_of_listing: "Accuracy",
  ease_of_access: "Access",
  property_condition: "Condition",
  quality_of_fishing_experience: "Fishing",
  privacy_crowding: "Privacy",
  host_communication: "Communication",
  value_for_price: "Value",
};

interface ReviewSummaryStripProps {
  avgRating: number;
  reviewCount: number;
  wouldFishAgainCount: number;
  categoryAverages: Record<string, number>;
}

export default function ReviewSummaryStrip({
  avgRating,
  reviewCount,
  wouldFishAgainCount,
  categoryAverages,
}: ReviewSummaryStripProps) {
  const wouldFishPct =
    reviewCount > 0 ? Math.round((wouldFishAgainCount / reviewCount) * 100) : 0;

  // Top 3 categories by score
  const topCategories = Object.entries(categoryAverages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const hasEnoughReviews = reviewCount >= 5;

  return (
    <div className="rounded-xl border border-stone-light/20 bg-offwhite/60 px-5 py-4">
      {/* Main stats row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Average rating */}
        <div className="flex items-center gap-1.5">
          <span className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            {avgRating.toFixed(1)}
          </span>
          <Star className="size-5 fill-bronze text-bronze" />
        </div>

        {/* Separator */}
        <div className="hidden h-8 w-px bg-stone-light/25 sm:block" />

        {/* Review count */}
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">{reviewCount}</span>{" "}
          verified angler review{reviewCount !== 1 ? "s" : ""}
        </p>

        {/* Separator */}
        <div className="hidden h-8 w-px bg-stone-light/25 sm:block" />

        {/* Would fish again OR new listing notice */}
        {hasEnoughReviews ? (
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-forest">{wouldFishPct}%</span>{" "}
            would fish this property again
          </p>
        ) : (
          <p className="text-sm italic text-text-light">
            New listing — reviews coming soon.
          </p>
        )}
      </div>

      {/* Top category scores */}
      {topCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-light/15 pt-3">
          {topCategories.map(([key, avg]) => (
            <span key={key} className="text-xs text-text-secondary">
              <span className="font-semibold text-text-primary">
                {avg.toFixed(1)}
              </span>{" "}
              {CATEGORY_SHORT_LABELS[key] ?? key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
