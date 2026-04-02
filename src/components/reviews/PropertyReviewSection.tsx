"use client";

import { useEffect, useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import ReviewSummaryStrip from "./ReviewSummaryStrip";
import CategoryAveragesGrid from "./CategoryAveragesGrid";
import TripReviewCard from "./TripReviewCard";

// ─── Types ──────────────────────────────────────────────────────────

interface ReviewFromAPI {
  id: string;
  overall_rating: number;
  review_text: string;
  would_fish_again: boolean;
  submitted_at: string | null;
  published_at: string | null;
  trip_completed: boolean;
  host_response_text: string | null;
  host_response_published_at: string | null;
  booking_id: string;
  profiles: { display_name: string | null } | null;
  review_category_ratings:
    | { category_key: string; rating_value: number }[]
    | null;
  bookings: {
    booking_date: string;
    booking_end_date: string | null;
    club_memberships: {
      clubs: { name: string } | null;
    } | null;
  } | null;
}

interface ReviewStats {
  property_id: string;
  review_count: number;
  avg_rating: number;
  would_fish_again_count: number;
  latest_review_at: string | null;
}

interface PropertyReviewSectionProps {
  propertyId: string;
}

// ─── Component ──────────────────────────────────────────────────────

export default function PropertyReviewSection({
  propertyId,
}: PropertyReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewFromAPI[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [categoryAverages, setCategoryAverages] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(
          `/api/trip-reviews?property_id=${propertyId}`
        );
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews ?? []);
          setStats(data.stats ?? null);
          setCategoryAverages(data.category_averages ?? {});
        }
      } catch {
        // Silent fail — reviews section is supplementary
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [propertyId]);

  // ─── Loading ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin text-text-light" />
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────────────

  if (!stats || stats.review_count === 0) {
    return (
      <div>
        <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
          <ScrollText className="size-4 text-bronze" />
          Angler Reviews
        </h2>
        <div className="mt-4 rounded-xl border border-stone-light/15 bg-offwhite/40 px-5 py-10 text-center">
          <p className="text-sm text-text-secondary">
            No verified reviews yet. Be the first to fish this property and
            leave a field report.
          </p>
        </div>
      </div>
    );
  }

  // ─── Normalize reviews for cards ────────────────────────────────

  const reviewCards = reviews.map((r) => ({
    id: r.id,
    overall_rating: r.overall_rating,
    review_text: r.review_text,
    would_fish_again: r.would_fish_again,
    published_at: r.published_at,
    trip_completed: r.trip_completed,
    host_response_text: r.host_response_text,
    host_response_published_at: r.host_response_published_at,
    review_category_ratings: r.review_category_ratings ?? [],
    reviewer_name: r.profiles?.display_name ?? null,
    club_name: r.bookings?.club_memberships?.clubs?.name ?? null,
    trip_date: r.bookings?.booking_date ?? null,
  }));

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Section heading */}
      <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
        <ScrollText className="size-4 text-bronze" />
        Angler Reviews
      </h2>

      {/* Summary strip */}
      <ReviewSummaryStrip
        avgRating={stats.avg_rating}
        reviewCount={stats.review_count}
        wouldFishAgainCount={stats.would_fish_again_count}
        categoryAverages={categoryAverages}
      />

      {/* Category averages grid */}
      {Object.keys(categoryAverages).length > 0 && (
        <CategoryAveragesGrid categoryAverages={categoryAverages} />
      )}

      {/* Individual reviews */}
      <div className="space-y-5">
        {reviewCards.map((review) => (
          <TripReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
