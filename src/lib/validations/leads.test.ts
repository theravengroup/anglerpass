import { describe, it, expect } from "vitest";
import { leadSchema } from "./leads";

describe("leadSchema", () => {
  const validLead = {
    firstName: "John",
    email: "john@example.com",
    interestType: "angler" as const,
  };

  it("accepts valid waitlist lead with minimal fields", () => {
    const result = leadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("waitlist");
    }
  });

  it("accepts valid lead with all optional fields", () => {
    const result = leadSchema.safeParse({
      ...validLead,
      lastName: "Doe",
      state: "CO",
      roleResponse: "I own a ranch",
      message: "Interested in listing",
      source: "google",
      type: "investor" as const,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing firstName", () => {
    const { firstName, ...rest } = validLead;
    const result = leadSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty firstName", () => {
    const result = leadSchema.safeParse({ ...validLead, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email, ...rest } = validLead;
    const result = leadSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = leadSchema.safeParse({ ...validLead, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing interestType", () => {
    const { interestType, ...rest } = validLead;
    const result = leadSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid interestType enum", () => {
    const result = leadSchema.safeParse({ ...validLead, interestType: "fisherman" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid interestType values", () => {
    const types = ["landowner", "club", "angler", "guide", "corporate", "partner", "investor", "other"] as const;
    for (const t of types) {
      const result = leadSchema.safeParse({ ...validLead, interestType: t });
      expect(result.success).toBe(true);
    }
  });

  it("accepts all valid type values", () => {
    for (const t of ["waitlist", "investor", "contact"] as const) {
      const result = leadSchema.safeParse({ ...validLead, type: t });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid type enum", () => {
    const result = leadSchema.safeParse({ ...validLead, type: "newsletter" });
    expect(result.success).toBe(false);
  });

  it("defaults type to waitlist when omitted", () => {
    const result = leadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("waitlist");
    }
  });
});
