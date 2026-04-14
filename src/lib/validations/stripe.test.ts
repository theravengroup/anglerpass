import { describe, it, expect } from "vitest";
import {
  payoutSchema,
  clubSubscriptionSchema,
  membershipCheckoutSchema,
  createPaymentIntentSchema,
  capturePaymentSchema,
  cancelHoldSchema,
} from "./stripe";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("payoutSchema", () => {
  it("accepts valid UUID bookingId", () => {
    const result = payoutSchema.safeParse({ bookingId: UUID });
    expect(result.success).toBe(true);
  });

  it("rejects missing bookingId", () => {
    const result = payoutSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID bookingId", () => {
    const result = payoutSchema.safeParse({ bookingId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("clubSubscriptionSchema", () => {
  const valid = {
    clubId: UUID,
    priceId: "price_abc123",
    tier: "starter" as const,
  };

  it("accepts valid subscription", () => {
    const result = clubSubscriptionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts all tier values", () => {
    for (const tier of ["starter", "standard", "pro"] as const) {
      const result = clubSubscriptionSchema.safeParse({ ...valid, tier });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid tier", () => {
    const result = clubSubscriptionSchema.safeParse({ ...valid, tier: "enterprise" });
    expect(result.success).toBe(false);
  });

  it("rejects missing clubId", () => {
    const { clubId, ...rest } = valid;
    const result = clubSubscriptionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID clubId", () => {
    const result = clubSubscriptionSchema.safeParse({ ...valid, clubId: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("membershipCheckoutSchema", () => {
  it("accepts minimal valid data with defaults", () => {
    const result = membershipCheckoutSchema.safeParse({ clubId: UUID });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.membershipType).toBe("individual");
    }
  });

  it("accepts all membershipType values", () => {
    for (const mt of ["individual", "corporate", "corporate_employee"] as const) {
      const result = membershipCheckoutSchema.safeParse({ clubId: UUID, membershipType: mt });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid membershipType", () => {
    const result = membershipCheckoutSchema.safeParse({ clubId: UUID, membershipType: "family" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = membershipCheckoutSchema.safeParse({
      clubId: UUID,
      duesPriceId: "price_123",
      invitationToken: "tok_abc",
      companyName: "Acme Corp",
    });
    expect(result.success).toBe(true);
  });
});

describe("createPaymentIntentSchema", () => {
  const valid = {
    bookingId: UUID,
    amountCents: 5000,
    platformFeeCents: 500,
  };

  it("accepts valid payment intent", () => {
    const result = createPaymentIntentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects zero amountCents", () => {
    const result = createPaymentIntentSchema.safeParse({ ...valid, amountCents: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative amountCents", () => {
    const result = createPaymentIntentSchema.safeParse({ ...valid, amountCents: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer amountCents", () => {
    const result = createPaymentIntentSchema.safeParse({ ...valid, amountCents: 50.5 });
    expect(result.success).toBe(false);
  });

  it("rejects negative platformFeeCents", () => {
    const result = createPaymentIntentSchema.safeParse({ ...valid, platformFeeCents: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts zero platformFeeCents", () => {
    const result = createPaymentIntentSchema.safeParse({ ...valid, platformFeeCents: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects missing bookingId", () => {
    const { bookingId, ...rest } = valid;
    const result = createPaymentIntentSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe("capturePaymentSchema", () => {
  it("accepts valid UUID", () => {
    const result = capturePaymentSchema.safeParse({ bookingId: UUID });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID", () => {
    const result = capturePaymentSchema.safeParse({ bookingId: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("cancelHoldSchema", () => {
  it("accepts valid UUID", () => {
    const result = cancelHoldSchema.safeParse({ bookingId: UUID });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID", () => {
    const result = cancelHoldSchema.safeParse({ bookingId: "abc" });
    expect(result.success).toBe(false);
  });
});
