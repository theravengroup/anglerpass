import { describe, it, expect } from "vitest";
import {
  calculateRefund,
  FULL_REFUND_HOURS,
  REFUND_TIERS,
  CANCELLATION_POLICY_TEXT,
} from "./cancellation";

describe("Cancellation constants", () => {
  it("has 48-hour full refund window", () => {
    expect(FULL_REFUND_HOURS).toBe(48);
  });

  it("has correct refund tier percentages", () => {
    expect(REFUND_TIERS.FULL.percentage).toBe(100);
    expect(REFUND_TIERS.PARTIAL.percentage).toBe(50);
    expect(REFUND_TIERS.NONE.percentage).toBe(0);
  });

  it("has human-readable labels for all tiers", () => {
    expect(REFUND_TIERS.FULL.label).toBeTruthy();
    expect(REFUND_TIERS.PARTIAL.label).toBeTruthy();
    expect(REFUND_TIERS.NONE.label).toBeTruthy();
  });

  it("has 4 cancellation policy text items", () => {
    expect(CANCELLATION_POLICY_TEXT).toHaveLength(4);
  });
});

describe("calculateRefund", () => {
  const totalAmount = 200;

  it("returns full refund when cancelled more than 48 hours before", () => {
    // Booking is 3 days from now
    const now = new Date("2026-01-10T12:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(100);
    expect(result.amount).toBe(200);
    expect(result.label).toBe("Full refund");
    expect(result.hoursUntilBooking).toBeGreaterThan(48);
  });

  it("returns 50% refund when cancelled within 48 hours but before day-of", () => {
    // Booking is 24 hours from now
    const now = new Date("2026-01-12T00:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(50);
    expect(result.amount).toBe(100);
    expect(result.label).toBe("50% refund");
    expect(result.hoursUntilBooking).toBeGreaterThan(0);
    expect(result.hoursUntilBooking).toBeLessThan(48);
  });

  it("returns no refund on day of booking", () => {
    // Same day as booking
    const now = new Date("2026-01-13T10:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
    expect(result.label).toBe("No refund");
  });

  it("returns no refund when booking has already passed", () => {
    const now = new Date("2026-01-14T12:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
    expect(result.hoursUntilBooking).toBe(0);
  });

  it("returns 50% refund at exactly 47 hours before", () => {
    // Booking starts at midnight Jan 13, now is 47 hours before (Jan 11 01:00)
    const now = new Date("2026-01-11T01:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(50);
    expect(result.hoursUntilBooking).toBe(47);
  });

  it("returns full refund at exactly 48+ hours before", () => {
    // 49 hours before
    const now = new Date("2026-01-10T23:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(100);
    expect(result.hoursUntilBooking).toBeGreaterThanOrEqual(48);
  });

  it("rounds 50% refund to 2 decimal places", () => {
    const result = calculateRefund(
      "2026-01-13",
      33.33,
      new Date("2026-01-12T12:00:00")
    );
    expect(result.amount).toBe(16.67); // Math.round(33.33 * 0.5 * 100) / 100
  });

  it("accepts Date object for bookingDate", () => {
    const bookingDate = new Date("2026-01-20T00:00:00");
    const now = new Date("2026-01-10T00:00:00");
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(100);
    expect(result.hoursUntilBooking).toBeGreaterThan(48);
  });

  it("defaults to current time when now is not provided", () => {
    // Use a far-future date to guarantee full refund
    const result = calculateRefund("2099-12-31", totalAmount);
    expect(result.percentage).toBe(100);
    expect(result.amount).toBe(totalAmount);
  });
});
