import { describe, it, expect, vi, afterEach } from "vitest";
import { getExpiryInfo } from "./proposal-expiry";

describe("getExpiryInfo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null label when expiresAt is null", () => {
    const result = getExpiryInfo(null);
    expect(result.label).toBeNull();
    expect(result.isExpired).toBe(false);
    expect(result.isUrgent).toBe(false);
  });

  it("marks as expired when expiresAt is in the past", () => {
    const pastDate = new Date(Date.now() - 60_000).toISOString();
    const result = getExpiryInfo(pastDate);
    expect(result.label).toBe("Expired");
    expect(result.isExpired).toBe(true);
    expect(result.isUrgent).toBe(false);
  });

  it("shows minutes when less than 1 hour remains", () => {
    const in30Min = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const result = getExpiryInfo(in30Min);
    expect(result.label).toMatch(/^Expires in \d+m$/);
    expect(result.isExpired).toBe(false);
    expect(result.isUrgent).toBe(true);
  });

  it("shows hours when between 1 and 24 hours remain", () => {
    const in5Hours = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const result = getExpiryInfo(in5Hours);
    expect(result.label).toMatch(/^Expires in \d+h$/);
    expect(result.isExpired).toBe(false);
  });

  it("marks urgent when less than 6 hours remain", () => {
    const in3Hours = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const result = getExpiryInfo(in3Hours);
    expect(result.isUrgent).toBe(true);
  });

  it("is not urgent when 6+ hours remain", () => {
    const in10Hours = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
    const result = getExpiryInfo(in10Hours);
    expect(result.isUrgent).toBe(false);
  });

  it("shows days when 24+ hours remain", () => {
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const result = getExpiryInfo(in3Days);
    expect(result.label).toBe("Expires in 3d");
    expect(result.isExpired).toBe(false);
    expect(result.isUrgent).toBe(false);
  });

  it("shows 1d for ~36 hours", () => {
    const in36Hours = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
    const result = getExpiryInfo(in36Hours);
    expect(result.label).toBe("Expires in 1d");
  });
});
