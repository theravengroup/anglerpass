import { describe, it, expect } from "vitest";
import { smsConsentSchema, normalizePhone } from "./sms-consent";

// ─── normalizePhone ─────────────────────────────────────────────────

describe("normalizePhone", () => {
  it("normalizes 10-digit number to E.164", () => {
    expect(normalizePhone("5551234567")).toBe("+15551234567");
  });

  it("normalizes 11-digit number starting with 1", () => {
    expect(normalizePhone("15551234567")).toBe("+15551234567");
  });

  it("strips parentheses and dashes", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
  });

  it("strips dots", () => {
    expect(normalizePhone("555.123.4567")).toBe("+15551234567");
  });

  it("strips spaces", () => {
    expect(normalizePhone("555 123 4567")).toBe("+15551234567");
  });

  it("handles +1 prefix", () => {
    expect(normalizePhone("+1 555 123 4567")).toBe("+15551234567");
  });

  it("handles +1 with parens", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("+15551234567");
  });

  it("handles already-formatted E.164", () => {
    expect(normalizePhone("+15551234567")).toBe("+15551234567");
  });

  it("handles short numbers by prefixing with +", () => {
    // Short numbers get + prefix but no +1 treatment
    const result = normalizePhone("12345");
    expect(result).toBe("+12345");
  });

  it("handles 1-prefixed 11-digit international-like numbers", () => {
    expect(normalizePhone("15551234567")).toBe("+15551234567");
  });
});

// ─── smsConsentSchema ──────────────────────────────────────────────

describe("smsConsentSchema", () => {
  it("accepts valid US phone with consent", () => {
    const result = smsConsentSchema.safeParse({
      phone: "(555) 123-4567",
      consented: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts various US phone formats", () => {
    const formats = [
      "5551234567",
      "555-123-4567",
      "(555) 123-4567",
      "555.123.4567",
      "+15551234567",
      "1 555 123 4567",
    ];
    for (const phone of formats) {
      const result = smsConsentSchema.safeParse({ phone, consented: false });
      expect(result.success).toBe(true);
    }
  });

  it("rejects empty phone", () => {
    const result = smsConsentSchema.safeParse({ phone: "", consented: true });
    expect(result.success).toBe(false);
  });

  it("rejects phone with letters", () => {
    const result = smsConsentSchema.safeParse({
      phone: "555-ABC-4567",
      consented: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects too-short phone number", () => {
    const result = smsConsentSchema.safeParse({
      phone: "12345",
      consented: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires consented to be boolean", () => {
    const result = smsConsentSchema.safeParse({
      phone: "5551234567",
      consented: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("accepts consented = false (schema does not enforce true)", () => {
    const result = smsConsentSchema.safeParse({
      phone: "5551234567",
      consented: false,
    });
    expect(result.success).toBe(true);
  });
});
