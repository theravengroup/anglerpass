import { describe, it, expect } from "vitest";
import { isEligibleForPublication } from "./publication";

describe("isEligibleForPublication", () => {
  it("returns false for non-submitted reviews", () => {
    expect(
      isEligibleForPublication({
        status: "draft",
        submitted_at: null,
        review_window_expires_at: "2099-12-31T23:59:59Z",
      })
    ).toBe(false);
  });

  it("returns false for submitted review with no submitted_at", () => {
    expect(
      isEligibleForPublication({
        status: "submitted",
        submitted_at: null,
        review_window_expires_at: "2099-12-31T23:59:59Z",
      })
    ).toBe(false);
  });

  it("returns true when 48+ hours have passed since submission", () => {
    const submittedAt = new Date();
    submittedAt.setHours(submittedAt.getHours() - 49);

    expect(
      isEligibleForPublication({
        status: "submitted",
        submitted_at: submittedAt.toISOString(),
        review_window_expires_at: "2099-12-31T23:59:59Z",
      })
    ).toBe(true);
  });

  it("returns false when less than 48 hours since submission and window still open", () => {
    const submittedAt = new Date();
    submittedAt.setHours(submittedAt.getHours() - 24);

    expect(
      isEligibleForPublication({
        status: "submitted",
        submitted_at: submittedAt.toISOString(),
        review_window_expires_at: "2099-12-31T23:59:59Z",
      })
    ).toBe(false);
  });

  it("returns true when review window has expired", () => {
    const pastWindow = new Date();
    pastWindow.setHours(pastWindow.getHours() - 1);

    expect(
      isEligibleForPublication({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        review_window_expires_at: pastWindow.toISOString(),
      })
    ).toBe(true);
  });

  it("returns false for published review", () => {
    expect(
      isEligibleForPublication({
        status: "published",
        submitted_at: "2020-01-01T00:00:00Z",
        review_window_expires_at: "2020-01-01T00:00:00Z",
      })
    ).toBe(false);
  });

  it("returns false for flagged review", () => {
    expect(
      isEligibleForPublication({
        status: "flagged",
        submitted_at: "2020-01-01T00:00:00Z",
        review_window_expires_at: "2020-01-01T00:00:00Z",
      })
    ).toBe(false);
  });
});
