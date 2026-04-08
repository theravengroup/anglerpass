import { describe, it, expect } from "vitest";
import {
  calculateRefund,
  CANCELLATION_POLICY_TEXT,
} from "./cancellation";

describe("Cancellation policy text", () => {
  it("has 6 cancellation policy text items", () => {
    expect(CANCELLATION_POLICY_TEXT).toHaveLength(6);
  });

  it("includes all graduated tiers", () => {
    const text = CANCELLATION_POLICY_TEXT.join(" ");
    expect(text).toContain("7 days");
    expect(text).toContain("75%");
    expect(text).toContain("50%");
    expect(text).toContain("No refund");
    expect(text).toContain("$15");
    expect(text).toContain("72 hours");
  });
});

describe("calculateRefund — graduated tiers", () => {
  const totalAmount = 200;

  it("returns 100% refund when cancelled more than 7 days before", () => {
    // Booking is 10 days from now
    const now = new Date("2026-01-03T12:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(100);
    expect(result.amount).toBe(200);
    expect(result.label).toContain("100%");
    expect(result.hoursUntilBooking).toBeGreaterThan(168);
    expect(result.lateCancelFee).toBe(0);
  });

  it("returns 75% refund when cancelled 3–7 days before", () => {
    // Booking is 5 days from now (120 hours)
    const now = new Date("2026-01-08T00:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(75);
    expect(result.amount).toBe(150);
    expect(result.hoursUntilBooking).toBeGreaterThanOrEqual(72);
    expect(result.hoursUntilBooking).toBeLessThan(168);
    expect(result.lateCancelFee).toBe(0);
  });

  it("returns 50% refund when cancelled 24 hours – 3 days before", () => {
    // Booking is 48 hours from now
    const now = new Date("2026-01-11T00:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(50);
    expect(result.amount).toBe(100);
    expect(result.hoursUntilBooking).toBeGreaterThanOrEqual(24);
    expect(result.hoursUntilBooking).toBeLessThan(72);
    expect(result.lateCancelFee).toBe(15);
  });

  it("returns 0% refund when cancelled less than 24 hours before", () => {
    // 12 hours before
    const now = new Date("2026-01-12T12:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
    expect(result.lateCancelFee).toBe(15);
  });

  it("returns 0% refund when booking has already passed", () => {
    const now = new Date("2026-01-14T12:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
    expect(result.hoursUntilBooking).toBe(0);
    expect(result.lateCancelFee).toBe(0);
  });
});

describe("calculateRefund — late cancel fee", () => {
  const totalAmount = 200;

  it("applies $15 fee within 72 hours", () => {
    // 48 hours before (within 72h window)
    const now = new Date("2026-01-11T00:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.lateCancelFee).toBe(15);
  });

  it("applies $15 fee at 12 hours before", () => {
    const now = new Date("2026-01-12T12:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.lateCancelFee).toBe(15);
  });

  it("does not apply fee beyond 72 hours", () => {
    // 5 days before
    const now = new Date("2026-01-08T00:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.lateCancelFee).toBe(0);
  });

  it("does not apply fee after booking has passed", () => {
    const now = new Date("2026-01-14T12:00:00");
    const bookingDate = "2026-01-13";
    const result = calculateRefund(bookingDate, totalAmount, now);

    expect(result.lateCancelFee).toBe(0);
  });
});

describe("calculateRefund — edge cases", () => {
  it("rounds refund amounts to 2 decimal places", () => {
    // 48 hours before → 50% tier
    const result = calculateRefund(
      "2026-01-13",
      33.33,
      new Date("2026-01-11T00:00:00")
    );
    expect(result.amount).toBe(16.67);
  });

  it("accepts Date object for bookingDate", () => {
    const bookingDate = new Date("2026-01-20T00:00:00");
    const now = new Date("2026-01-03T00:00:00");
    const result = calculateRefund(bookingDate, 200, now);

    expect(result.percentage).toBe(100);
    expect(result.hoursUntilBooking).toBeGreaterThan(168);
  });

  it("defaults to current time when now is not provided", () => {
    const result = calculateRefund("2099-12-31", 200);
    expect(result.percentage).toBe(100);
    expect(result.amount).toBe(200);
  });
});
