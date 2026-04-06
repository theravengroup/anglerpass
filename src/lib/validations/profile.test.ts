import { describe, it, expect } from "vitest";
import { profileUpdateSchema } from "./profile";

describe("profileUpdateSchema", () => {
  it("accepts valid profile update", () => {
    const result = profileUpdateSchema.safeParse({
      display_name: "John Doe",
      bio: "Avid fly fisher",
      location: "Montana",
      fishing_experience: "advanced",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal profile update (all fields optional)", () => {
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects empty display_name", () => {
    const result = profileUpdateSchema.safeParse({
      display_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects display_name over 100 chars", () => {
    const result = profileUpdateSchema.safeParse({
      display_name: "A".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid fishing_experience values", () => {
    for (const level of ["beginner", "intermediate", "advanced", "expert"]) {
      const result = profileUpdateSchema.safeParse({
        fishing_experience: level,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid fishing_experience value", () => {
    const result = profileUpdateSchema.safeParse({
      fishing_experience: "professional",
    });
    expect(result.success).toBe(false);
  });

  it("rejects bio over 500 chars", () => {
    const result = profileUpdateSchema.safeParse({
      bio: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("accepts favorite_species as string array", () => {
    const result = profileUpdateSchema.safeParse({
      favorite_species: ["Rainbow Trout", "Brown Trout"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 20 favorite_species", () => {
    const result = profileUpdateSchema.safeParse({
      favorite_species: Array.from({ length: 21 }, (_, i) => `Species ${i}`),
    });
    expect(result.success).toBe(false);
  });
});
