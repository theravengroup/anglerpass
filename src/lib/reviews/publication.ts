import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLICATION_DELAY_HOURS } from "@/lib/validations/reviews";

// ─── Rule 8: Publication Timing ──────────────────────────────────────

/**
 * Publishes reviews that are eligible for publication.
 *
 * A submitted review becomes published when EITHER condition is met:
 * 1. review_window_expires_at has passed, OR
 * 2. 48 hours have passed since submitted_at
 *
 * This function is designed to be called by a cron job or scheduled task.
 * It processes all eligible reviews in a single batch.
 *
 * Returns the count of reviews published.
 */
export async function publishEligibleReviews(
  admin: SupabaseClient
): Promise<{ published: number; error?: string }> {
  const now = new Date();

  // Calculate the 48-hour cutoff
  const publicationCutoff = new Date(now);
  publicationCutoff.setHours(
    publicationCutoff.getHours() - PUBLICATION_DELAY_HOURS
  );

  // Find submitted reviews that meet either publication condition:
  // 1. submitted_at <= now - 48 hours (48h delay has passed)
  // 2. review_window_expires_at <= now (window has closed)
  const { data: eligible, error: fetchError } = await admin
    .from("trip_reviews")
    .select("id")
    .eq("status", "submitted")
    .or(
      `submitted_at.lte.${publicationCutoff.toISOString()},review_window_expires_at.lte.${now.toISOString()}`
    );

  if (fetchError) {
    return { published: 0, error: `Failed to fetch eligible reviews: ${fetchError.message}` };
  }

  if (!eligible?.length) {
    return { published: 0 };
  }

  const reviewIds = eligible.map((r) => r.id);

  // Batch-publish all eligible reviews
  const { error: updateError } = await admin
    .from("trip_reviews")
    .update({
      status: "published",
      published_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .in("id", reviewIds);

  if (updateError) {
    return { published: 0, error: `Failed to publish reviews: ${updateError.message}` };
  }

  return { published: reviewIds.length };
}

/**
 * Checks if a single review is eligible for immediate publication.
 * Used when checking a specific review's status.
 */
export function isEligibleForPublication(review: {
  status: string;
  submitted_at: string | null;
  review_window_expires_at: string;
}): boolean {
  if (review.status !== "submitted" || !review.submitted_at) {
    return false;
  }

  const now = new Date();
  const submittedAt = new Date(review.submitted_at);
  const windowExpires = new Date(review.review_window_expires_at);

  // Condition 1: 48 hours since submission
  const hoursSinceSubmission =
    (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceSubmission >= PUBLICATION_DELAY_HOURS) {
    return true;
  }

  // Condition 2: Review window has closed
  if (now >= windowExpires) {
    return true;
  }

  return false;
}
