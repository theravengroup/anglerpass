import { describe, it, expect } from "vitest";
import { calculateReviewWindow, checkActiveWindow } from "./eligibility";

describe("calculateReviewWindow", () => {
  it("calculates window as booking_date + 21 days for single-day booking", () => {
    const result = calculateReviewWindow({
      booking_date: "2026-03-01",
      booking_end_date: null,
    });
    // Should be March 22, 23:59:59 UTC
    expect(result.getUTCMonth()).toBe(2); // March = 2
    expect(result.getUTCDate()).toBe(22);
  });

  it("uses booking_end_date for multi-day bookings", () => {
    const result = calculateReviewWindow({
      booking_date: "2026-03-01",
      booking_end_date: "2026-03-05",
    });
    // Should be March 26, 23:59:59 UTC
    expect(result.getUTCMonth()).toBe(2);
    expect(result.getUTCDate()).toBe(26);
  });

  it("returns a Date object", () => {
    const result = calculateReviewWindow({
      booking_date: "2026-01-01",
      booking_end_date: null,
    });
    expect(result).toBeInstanceOf(Date);
  });
});

describe("checkActiveWindow", () => {
  it("returns withinWindow=true when window has not expired", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const result = checkActiveWindow({
      review_window_expires_at: futureDate.toISOString(),
      extension_requested: false,
      extension_expires_at: null,
    });
    expect(result.withinWindow).toBe(true);
  });

  it("returns withinWindow=false when window has expired", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const result = checkActiveWindow({
      review_window_expires_at: pastDate.toISOString(),
      extension_requested: false,
      extension_expires_at: null,
    });
    expect(result.withinWindow).toBe(false);
    expect(result.error).toContain("expired");
  });

  it("uses extension deadline when extension granted", () => {
    const pastWindow = new Date();
    pastWindow.setDate(pastWindow.getDate() - 1);

    const futureExtension = new Date();
    futureExtension.setDate(futureExtension.getDate() + 5);

    const result = checkActiveWindow({
      review_window_expires_at: pastWindow.toISOString(),
      extension_requested: true,
      extension_expires_at: futureExtension.toISOString(),
    });
    expect(result.withinWindow).toBe(true);
    expect(result.effectiveDeadline.getTime()).toBe(
      futureExtension.getTime()
    );
  });

  it("uses original window when extension_requested is false", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);

    const result = checkActiveWindow({
      review_window_expires_at: futureDate.toISOString(),
      extension_requested: false,
      extension_expires_at: null,
    });
    expect(result.effectiveDeadline.getTime()).toBeCloseTo(
      futureDate.getTime(),
      -3 // within 1 second
    );
  });
});
