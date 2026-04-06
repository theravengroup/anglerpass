import { describe, it, expect } from "vitest";
import { bookingSchema, bookingStatusSchema, bookingCancelSchema, BOOKING_STATUSES, DURATIONS } from "./bookings";

describe("Booking validation constants", () => {
  it("has 5 booking statuses", () => {
    expect(BOOKING_STATUSES).toHaveLength(5);
    expect(BOOKING_STATUSES).toContain("pending");
    expect(BOOKING_STATUSES).toContain("confirmed");
    expect(BOOKING_STATUSES).toContain("completed");
  });

  it("has 2 durations", () => {
    expect(DURATIONS).toHaveLength(2);
    expect(DURATIONS).toContain("full_day");
    expect(DURATIONS).toContain("half_day");
  });
});

describe("bookingSchema", () => {
  const validBooking = {
    property_id: "550e8400-e29b-41d4-a716-446655440000",
    club_membership_id: "550e8400-e29b-41d4-a716-446655440001",
    booking_date: "2026-06-15",
    duration: "full_day" as const,
    party_size: 2,
    non_fishing_guests: 1,
  };

  it("accepts valid booking", () => {
    const result = bookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it("rejects missing property_id", () => {
    const { property_id, ...rest } = validBooking;
    const result = bookingSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects empty booking_date", () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      booking_date: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects party_size of 0", () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      party_size: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects party_size over 20", () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      party_size: 21,
    });
    expect(result.success).toBe(false);
  });

  it("defaults party_size to 1", () => {
    const { party_size, ...rest } = validBooking;
    const result = bookingSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.party_size).toBe(1);
    }
  });

  it("defaults duration to full_day", () => {
    const { duration, ...rest } = validBooking;
    const result = bookingSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.duration).toBe("full_day");
    }
  });

  it("rejects message over 2000 characters", () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      message: "A".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional guide_id as UUID", () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      guide_id: "550e8400-e29b-41d4-a716-446655440002",
    });
    expect(result.success).toBe(true);
  });
});

describe("bookingStatusSchema", () => {
  it("accepts confirmed status", () => {
    expect(bookingStatusSchema.safeParse({ status: "confirmed" }).success).toBe(true);
  });

  it("accepts declined status", () => {
    expect(bookingStatusSchema.safeParse({ status: "declined" }).success).toBe(true);
  });

  it("rejects cancelled status (not a valid transition)", () => {
    expect(bookingStatusSchema.safeParse({ status: "cancelled" }).success).toBe(false);
  });
});

describe("bookingCancelSchema", () => {
  it("accepts cancelled status", () => {
    expect(bookingCancelSchema.safeParse({ status: "cancelled" }).success).toBe(true);
  });

  it("rejects confirmed status", () => {
    expect(bookingCancelSchema.safeParse({ status: "confirmed" }).success).toBe(false);
  });
});
