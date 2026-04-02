import {
  Star,
  CheckCircle2,
  AlertTriangle,
  Check,
  X,
  MessageSquare,
} from "lucide-react";

interface CategoryRating {
  category_key: string;
  rating_value: number;
}

interface TripReviewCardProps {
  review: {
    id: string;
    overall_rating: number;
    review_text: string;
    would_fish_again: boolean;
    published_at: string | null;
    trip_completed: boolean;
    host_response_text: string | null;
    host_response_published_at: string | null;
    review_category_ratings: CategoryRating[];
    reviewer_name: string | null;
    club_name: string | null;
    trip_date: string | null;
  };
}

const CATEGORY_SHORT: Record<string, string> = {
  accuracy_of_listing: "Accuracy",
  ease_of_access: "Access",
  property_condition: "Condition",
  quality_of_fishing_experience: "Fishing",
  privacy_crowding: "Privacy",
  host_communication: "Communication",
  value_for_price: "Value",
};

function formatTripDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatReviewerName(displayName: string | null): string {
  if (!displayName) return "Anonymous";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return "Anonymous";
  const firstName = parts[0];
  const lastInitial = parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : "";
  return `${firstName}${lastInitial}`;
}

export default function TripReviewCard({ review }: TripReviewCardProps) {
  const reviewerLabel = formatReviewerName(review.reviewer_name);
  const tripDate = formatTripDate(review.trip_date);

  return (
    <div className="border-b border-stone-light/15 pb-5 last:border-0 last:pb-0">
      {/* Header: reviewer + badge + date */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-text-primary">
            {reviewerLabel}
            {review.club_name && (
              <span className="font-normal text-text-light">
                {" "}
                — Verified member, {review.club_name}
              </span>
            )}
          </p>

          {/* Badges row */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {/* Verified badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-forest/8 px-2 py-0.5 text-[10px] font-medium text-forest">
              <CheckCircle2 className="size-2.5" />
              Verified Angler Review
            </span>

            {/* Trip status badge */}
            {review.trip_completed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-offwhite px-2 py-0.5 text-[10px] font-medium text-text-light">
                From a completed trip
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-bronze/10 px-2 py-0.5 text-[10px] font-medium text-bronze">
                <AlertTriangle className="size-2.5" />
                Access issue — trip did not complete
              </span>
            )}
          </div>
        </div>

        {/* Date */}
        {tripDate && (
          <span className="shrink-0 text-xs text-text-light">{tripDate}</span>
        )}
      </div>

      {/* Star rating */}
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`size-4 ${
              star <= review.overall_rating
                ? "fill-bronze text-bronze"
                : "fill-transparent text-stone-light/40"
            }`}
          />
        ))}
      </div>

      {/* Review text */}
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {review.review_text}
      </p>

      {/* Would fish again */}
      <div className="mt-2">
        {review.would_fish_again ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
            <Check className="size-3" />
            Would fish again
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
            <X className="size-3" />
            Would not fish again
          </span>
        )}
      </div>

      {/* Category ratings — compact row */}
      {review.review_category_ratings?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
          {review.review_category_ratings.map((cr) => (
            <span
              key={cr.category_key}
              className="text-[11px] text-text-light"
            >
              {CATEGORY_SHORT[cr.category_key] ?? cr.category_key}{" "}
              <span className="font-semibold text-text-secondary">
                {cr.rating_value}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Host response */}
      {review.host_response_text && (
        <div className="mt-3 rounded-lg border border-stone-light/15 bg-offwhite/50 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-light">
            <MessageSquare className="size-3" />
            Response from the property manager
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            {review.host_response_text}
          </p>
        </div>
      )}
    </div>
  );
}
