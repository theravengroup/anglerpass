import { describe, it, expect } from "vitest";
import {
  supportTicketSchema,
  supportTicketUpdateSchema,
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
  SUPPORT_PRIORITIES,
} from "./support-ticket";

describe("SUPPORT constants", () => {
  it("has 6 categories", () => {
    expect(SUPPORT_CATEGORIES).toHaveLength(6);
  });

  it("has 3 statuses", () => {
    expect(SUPPORT_STATUSES).toHaveLength(3);
  });

  it("has 3 priorities", () => {
    expect(SUPPORT_PRIORITIES).toHaveLength(3);
  });
});

describe("supportTicketSchema", () => {
  const valid = {
    category: "Booking Issue" as const,
    subject: "Cannot see my booking",
    message: "I booked a trip but it does not appear in my dashboard.",
  };

  it("accepts valid ticket", () => {
    const result = supportTicketSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts all category values", () => {
    for (const cat of SUPPORT_CATEGORIES) {
      const result = supportTicketSchema.safeParse({ ...valid, category: cat });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid category", () => {
    const result = supportTicketSchema.safeParse({ ...valid, category: "Spam" });
    expect(result.success).toBe(false);
  });

  it("rejects missing subject", () => {
    const { subject, ...rest } = valid;
    const result = supportTicketSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty subject", () => {
    const result = supportTicketSchema.safeParse({ ...valid, subject: "" });
    expect(result.success).toBe(false);
  });

  it("rejects subject over 100 characters", () => {
    const result = supportTicketSchema.safeParse({ ...valid, subject: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects message under 20 characters", () => {
    const result = supportTicketSchema.safeParse({ ...valid, message: "Short" });
    expect(result.success).toBe(false);
  });

  it("rejects message over 2000 characters", () => {
    const result = supportTicketSchema.safeParse({ ...valid, message: "x".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const { category, ...rest } = valid;
    const result = supportTicketSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("supportTicketUpdateSchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = supportTicketUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid status update", () => {
    const result = supportTicketUpdateSchema.safeParse({ status: "in_progress" });
    expect(result.success).toBe(true);
  });

  it("accepts valid priority update", () => {
    const result = supportTicketUpdateSchema.safeParse({ priority: "high" });
    expect(result.success).toBe(true);
  });

  it("accepts null assigned_to", () => {
    const result = supportTicketUpdateSchema.safeParse({ assigned_to: null });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = supportTicketUpdateSchema.safeParse({ status: "closed" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = supportTicketUpdateSchema.safeParse({ priority: "critical" });
    expect(result.success).toBe(false);
  });
});
