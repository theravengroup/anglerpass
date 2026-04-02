import "server-only";

import {
  CATEGORY_KEYS,
  INCOMPLETE_TRIP_CATEGORIES,
  type CategoryRating,
} from "@/lib/validations/reviews";

// ─── Rule 7: Category Validation ─────────────────────────────────────

/**
 * Validates category ratings based on whether the trip was completed.
 *
 * Rules:
 * - trip_completed = true → all 7 categories required
 * - trip_completed = false → only 3 categories allowed:
 *   accuracy_of_listing, ease_of_access, host_communication
 * - No duplicate categories
 * - Each rating must be 1–5 (enforced by Zod, double-checked here)
 */
export function validateCategoryRatings(
  ratings: CategoryRating[],
  tripCompleted: boolean
): { valid: boolean; error?: string } {
  // Check for duplicates
  const keys = ratings.map((r) => r.category_key);
  const uniqueKeys = new Set(keys);
  if (uniqueKeys.size !== keys.length) {
    return { valid: false, error: "Duplicate category ratings are not allowed" };
  }

  if (tripCompleted) {
    // All 7 categories required
    if (ratings.length !== CATEGORY_KEYS.length) {
      return {
        valid: false,
        error: `Completed trips require all ${CATEGORY_KEYS.length} category ratings`,
      };
    }

    // Verify all required keys are present
    for (const key of CATEGORY_KEYS) {
      if (!uniqueKeys.has(key)) {
        return {
          valid: false,
          error: `Missing required category rating: ${key}`,
        };
      }
    }
  } else {
    // Only 3 specific categories allowed
    const allowedSet = new Set<string>(INCOMPLETE_TRIP_CATEGORIES);

    if (ratings.length !== INCOMPLETE_TRIP_CATEGORIES.length) {
      return {
        valid: false,
        error: `Incomplete trips require exactly ${INCOMPLETE_TRIP_CATEGORIES.length} category ratings: ${INCOMPLETE_TRIP_CATEGORIES.join(", ")}`,
      };
    }

    for (const rating of ratings) {
      if (!allowedSet.has(rating.category_key)) {
        return {
          valid: false,
          error: `Category "${rating.category_key}" is not allowed for incomplete trips. Only: ${INCOMPLETE_TRIP_CATEGORIES.join(", ")}`,
        };
      }
    }

    // Verify all required keys are present
    for (const key of INCOMPLETE_TRIP_CATEGORIES) {
      if (!uniqueKeys.has(key)) {
        return {
          valid: false,
          error: `Missing required category rating: ${key}`,
        };
      }
    }
  }

  // Validate rating values
  for (const rating of ratings) {
    if (
      !Number.isInteger(rating.rating_value) ||
      rating.rating_value < 1 ||
      rating.rating_value > 5
    ) {
      return {
        valid: false,
        error: `Rating value must be an integer between 1 and 5`,
      };
    }
  }

  return { valid: true };
}

// ─── Category Labels (for display) ───────────────────────────────────

export const CATEGORY_LABELS: Record<
  (typeof CATEGORY_KEYS)[number],
  string
> = {
  accuracy_of_listing: "Accuracy of Listing",
  ease_of_access: "Ease of Access",
  property_condition: "Property Condition",
  quality_of_fishing_experience: "Quality of Fishing Experience",
  privacy_crowding: "Privacy & Crowding",
  host_communication: "Host Communication",
  value_for_price: "Value for Price",
};
