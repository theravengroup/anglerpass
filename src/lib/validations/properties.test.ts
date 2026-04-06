import { describe, it, expect } from "vitest";
import { propertySchema, WATER_TYPES, COMMON_SPECIES, MIN_PHOTOS, MAX_PHOTOS } from "./properties";

describe("Property validation constants", () => {
  it("has expected water types", () => {
    expect(WATER_TYPES).toContain("river");
    expect(WATER_TYPES).toContain("lake");
    expect(WATER_TYPES).toContain("spring_creek");
    expect(WATER_TYPES.length).toBeGreaterThan(0);
  });

  it("has common fish species", () => {
    expect(COMMON_SPECIES).toContain("Rainbow Trout");
    expect(COMMON_SPECIES).toContain("Brown Trout");
    expect(COMMON_SPECIES.length).toBeGreaterThan(0);
  });

  it("has photo limits", () => {
    expect(MIN_PHOTOS).toBe(3);
    expect(MAX_PHOTOS).toBe(10);
  });
});

describe("propertySchema", () => {
  const validProperty = {
    name: "Blue River Ranch",
    description: "Beautiful private water",
  };

  it("accepts valid minimal property", () => {
    const result = propertySchema.safeParse(validProperty);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = propertySchema.safeParse({ ...validProperty, name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid GPS coordinates", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      coordinates: "39.2242, -105.9731",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid GPS coordinates", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      coordinates: "200, 500",
    });
    expect(result.success).toBe(false);
  });

  it("rejects coordinates with latitude > 90", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      coordinates: "91, -105",
    });
    expect(result.success).toBe(false);
  });

  it("rejects coordinates with longitude > 180", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      coordinates: "39, 181",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty coordinates", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      coordinates: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid water type", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      water_type: "river",
    });
    expect(result.success).toBe(true);
  });

  it("requires half-day rates when half_day_allowed is true", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      half_day_allowed: true,
      rate_adult_half_day: null,
      rate_youth_half_day: null,
      rate_child_half_day: null,
    });
    expect(result.success).toBe(false);
  });

  it("accepts half_day_allowed when all half-day rates provided", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      half_day_allowed: true,
      rate_adult_half_day: 50,
      rate_youth_half_day: 30,
      rate_child_half_day: 20,
    });
    expect(result.success).toBe(true);
  });

  it("rejects max_rods exceeding max_guests", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      max_rods: 10,
      max_guests: 5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts max_rods equal to max_guests", () => {
    const result = propertySchema.safeParse({
      ...validProperty,
      max_rods: 5,
      max_guests: 5,
    });
    expect(result.success).toBe(true);
  });
});
