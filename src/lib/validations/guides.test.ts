import { describe, it, expect } from "vitest";
import {
  guideProfileSchema,
  guideAffiliationSchema,
  guideAvailabilitySchema,
  reviewSchema,
  TECHNIQUES,
  SKILL_LEVELS,
  GUIDE_STATUSES,
  CREDENTIAL_TYPES,
} from "./guides";

describe("Guide validation constants", () => {
  it("has 10 techniques", () => {
    expect(TECHNIQUES).toHaveLength(10);
    expect(TECHNIQUES).toContain("walk_wade");
    expect(TECHNIQUES).toContain("dry_fly");
  });

  it("has 3 skill levels", () => {
    expect(SKILL_LEVELS).toHaveLength(3);
    expect(SKILL_LEVELS).toContain("beginner");
    expect(SKILL_LEVELS).toContain("advanced");
  });

  it("has 6 guide statuses", () => {
    expect(GUIDE_STATUSES).toHaveLength(6);
    expect(GUIDE_STATUSES).toContain("draft");
    expect(GUIDE_STATUSES).toContain("live");
    expect(GUIDE_STATUSES).toContain("suspended");
  });

  it("has 5 credential types", () => {
    expect(CREDENTIAL_TYPES).toHaveLength(5);
    expect(CREDENTIAL_TYPES).toContain("license");
    expect(CREDENTIAL_TYPES).toContain("insurance");
  });
});

describe("guideProfileSchema", () => {
  it("accepts valid minimal guide profile", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "John Guide",
    });
    expect(result.success).toBe(true);
  });

  it("rejects display_name shorter than 2 chars", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "J",
    });
    expect(result.success).toBe(false);
  });

  it("rejects display_name over 100 chars", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid techniques array", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "John Guide",
      techniques: ["walk_wade", "dry_fly"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid technique", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "John Guide",
      techniques: ["invalid_technique"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid rate_full_day", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "John Guide",
      rate_full_day: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects rate over $10,000", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "John Guide",
      rate_full_day: 10001,
    });
    expect(result.success).toBe(false);
  });

  it("defaults max_anglers to 2", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "John Guide",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.max_anglers).toBe(2);
    }
  });

  it("defaults gear_included to true", () => {
    const result = guideProfileSchema.safeParse({
      display_name: "John Guide",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.gear_included).toBe(true);
    }
  });
});

describe("guideAffiliationSchema", () => {
  it("accepts valid club UUID", () => {
    const result = guideAffiliationSchema.safeParse({
      club_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID club_id", () => {
    const result = guideAffiliationSchema.safeParse({
      club_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("guideAvailabilitySchema", () => {
  it("accepts valid availability", () => {
    const result = guideAvailabilitySchema.safeParse({
      dates: ["2026-06-15"],
      status: "available",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty dates array", () => {
    const result = guideAvailabilitySchema.safeParse({
      dates: [],
      status: "available",
    });
    expect(result.success).toBe(false);
  });

  it("accepts blocked status", () => {
    const result = guideAvailabilitySchema.safeParse({
      dates: ["2026-06-15"],
      status: "blocked",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = guideAvailabilitySchema.safeParse({
      dates: ["2026-06-15"],
      status: "maybe",
    });
    expect(result.success).toBe(false);
  });
});

describe("reviewSchema (guide reviews)", () => {
  it("accepts valid review", () => {
    const result = reviewSchema.safeParse({
      booking_id: "550e8400-e29b-41d4-a716-446655440000",
      rating: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects rating of 0", () => {
    const result = reviewSchema.safeParse({
      booking_id: "550e8400-e29b-41d4-a716-446655440000",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = reviewSchema.safeParse({
      booking_id: "550e8400-e29b-41d4-a716-446655440000",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects body over 2000 characters", () => {
    const result = reviewSchema.safeParse({
      booking_id: "550e8400-e29b-41d4-a716-446655440000",
      rating: 4,
      body: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});
