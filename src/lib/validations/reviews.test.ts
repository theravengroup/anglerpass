import { describe, it, expect } from "vitest";
import {
  tripReviewCreateSchema,
  tripReviewUpdateSchema,
  reviewFlagSchema,
  reviewResponseSchema,
  REVIEW_STATUSES,
  CATEGORY_KEYS,
  INCOMPLETE_TRIP_CATEGORIES,
  FLAG_REASONS,
  LANDOWNER_FAULTS,
  REVIEW_WINDOW_DAYS,
  REVIEW_EXTENSION_DAYS,
  PUBLICATION_DELAY_HOURS,
  RANKING_IMMUNITY_THRESHOLD,
} from "./reviews";

describe("Review validation constants", () => {
  it("has 6 review statuses", () => {
    expect(REVIEW_STATUSES).toHaveLength(6);
    expect(REVIEW_STATUSES).toContain("draft");
    expect(REVIEW_STATUSES).toContain("published");
  });

  it("has 7 category keys", () => {
    expect(CATEGORY_KEYS).toHaveLength(7);
  });

  it("has 3 incomplete trip categories", () => {
    expect(INCOMPLETE_TRIP_CATEGORIES).toHaveLength(3);
    for (const cat of INCOMPLETE_TRIP_CATEGORIES) {
      expect(CATEGORY_KEYS).toContain(cat);
    }
  });

  it("has correct timing constants", () => {
    expect(REVIEW_WINDOW_DAYS).toBe(21);
    expect(REVIEW_EXTENSION_DAYS).toBe(7);
    expect(PUBLICATION_DELAY_HOURS).toBe(48);
    expect(RANKING_IMMUNITY_THRESHOLD).toBe(5);
  });

  it("landowner faults are subset of cancellation faults", () => {
    expect(LANDOWNER_FAULTS.length).toBeGreaterThan(0);
    for (const fault of LANDOWNER_FAULTS) {
      expect(fault).toMatch(/^landowner_/);
    }
  });
});

describe("tripReviewCreateSchema", () => {
  const validReview = {
    booking_id: "550e8400-e29b-41d4-a716-446655440000",
    overall_rating: 4,
    review_text: "A".repeat(50),
    would_fish_again: true,
    category_ratings: [
      { category_key: "accuracy_of_listing", rating_value: 4 },
      { category_key: "ease_of_access", rating_value: 5 },
      { category_key: "host_communication", rating_value: 3 },
    ],
  };

  it("accepts valid review data", () => {
    const result = tripReviewCreateSchema.safeParse(validReview);
    expect(result.success).toBe(true);
  });

  it("rejects review text shorter than 50 characters", () => {
    const result = tripReviewCreateSchema.safeParse({
      ...validReview,
      review_text: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating outside 1-5 range", () => {
    const result = tripReviewCreateSchema.safeParse({
      ...validReview,
      overall_rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating of 0", () => {
    const result = tripReviewCreateSchema.safeParse({
      ...validReview,
      overall_rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects anonymous reviews", () => {
    const result = tripReviewCreateSchema.safeParse({
      ...validReview,
      is_anonymous: true,
    });
    expect(result.success).toBe(false);
  });

  it("accepts is_anonymous = false", () => {
    const result = tripReviewCreateSchema.safeParse({
      ...validReview,
      is_anonymous: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid booking_id", () => {
    const result = tripReviewCreateSchema.safeParse({
      ...validReview,
      booking_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("requires at least 3 category ratings", () => {
    const result = tripReviewCreateSchema.safeParse({
      ...validReview,
      category_ratings: [
        { category_key: "accuracy_of_listing", rating_value: 4 },
        { category_key: "ease_of_access", rating_value: 5 },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewFlagSchema", () => {
  it("accepts valid flag reason", () => {
    for (const reason of FLAG_REASONS) {
      const result = reviewFlagSchema.safeParse({ flag_reason: reason });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid flag reason", () => {
    const result = reviewFlagSchema.safeParse({
      flag_reason: "invalid_reason",
    });
    expect(result.success).toBe(false);
  });

  it("accepts flag notes up to 2000 chars", () => {
    const result = reviewFlagSchema.safeParse({
      flag_reason: "other",
      flag_notes: "A".repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});

describe("reviewResponseSchema", () => {
  it("accepts valid response", () => {
    const result = reviewResponseSchema.safeParse({
      response_text: "Thank you for your feedback.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty response", () => {
    const result = reviewResponseSchema.safeParse({
      response_text: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects response over 5000 characters", () => {
    const result = reviewResponseSchema.safeParse({
      response_text: "A".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
