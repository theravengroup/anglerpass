import { describe, it, expect } from "vitest";
import { validateCategoryRatings, CATEGORY_LABELS } from "./categories";
import { CATEGORY_KEYS, INCOMPLETE_TRIP_CATEGORIES } from "@/lib/validations/reviews";

// Helper to build all 7 category ratings
function allCategoryRatings(value = 4) {
  return CATEGORY_KEYS.map((key) => ({
    category_key: key,
    rating_value: value,
  }));
}

// Helper to build incomplete trip ratings
function incompleteCategoryRatings(value = 3) {
  return INCOMPLETE_TRIP_CATEGORIES.map((key) => ({
    category_key: key,
    rating_value: value,
  }));
}

describe("validateCategoryRatings — completed trip", () => {
  it("accepts all 7 categories with valid ratings", () => {
    const result = validateCategoryRatings(allCategoryRatings(), true);
    expect(result.valid).toBe(true);
  });

  it("rejects when missing categories", () => {
    const ratings = allCategoryRatings().slice(0, 5);
    const result = validateCategoryRatings(ratings, true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("require all");
  });

  it("rejects duplicate categories", () => {
    const ratings = allCategoryRatings();
    ratings[6] = { ...ratings[0] }; // duplicate first key
    const result = validateCategoryRatings(ratings, true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Duplicate");
  });

  it("rejects rating below 1", () => {
    const ratings = allCategoryRatings();
    ratings[0].rating_value = 0;
    const result = validateCategoryRatings(ratings, true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("between 1 and 5");
  });

  it("rejects rating above 5", () => {
    const ratings = allCategoryRatings();
    ratings[0].rating_value = 6;
    const result = validateCategoryRatings(ratings, true);
    expect(result.valid).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const ratings = allCategoryRatings();
    ratings[0].rating_value = 3.5;
    const result = validateCategoryRatings(ratings, true);
    expect(result.valid).toBe(false);
  });
});

describe("validateCategoryRatings — incomplete trip", () => {
  it("accepts exactly 3 allowed categories", () => {
    const result = validateCategoryRatings(incompleteCategoryRatings(), false);
    expect(result.valid).toBe(true);
  });

  it("rejects more than 3 categories for incomplete trip", () => {
    const ratings = allCategoryRatings();
    const result = validateCategoryRatings(ratings, false);
    expect(result.valid).toBe(false);
  });

  it("rejects disallowed category for incomplete trip", () => {
    const ratings = [
      { category_key: "accuracy_of_listing" as const, rating_value: 3 },
      { category_key: "ease_of_access" as const, rating_value: 3 },
      { category_key: "property_condition" as const, rating_value: 3 }, // not allowed
    ];
    const result = validateCategoryRatings(ratings, false);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not allowed for incomplete trips");
  });

  it("rejects missing required incomplete-trip category", () => {
    const ratings = [
      { category_key: "accuracy_of_listing" as const, rating_value: 3 },
      { category_key: "ease_of_access" as const, rating_value: 3 },
    ];
    const result = validateCategoryRatings(ratings, false);
    expect(result.valid).toBe(false);
  });
});

describe("CATEGORY_LABELS", () => {
  it("has a label for every category key", () => {
    for (const key of CATEGORY_KEYS) {
      expect(CATEGORY_LABELS[key]).toBeTruthy();
      expect(typeof CATEGORY_LABELS[key]).toBe("string");
    }
  });

  it("has exactly 7 labels", () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(7);
  });
});
