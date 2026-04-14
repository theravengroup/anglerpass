import { describe, it, expect } from "vitest";
import { verifyTurnstileSchema } from "./auth";

describe("verifyTurnstileSchema", () => {
  it("accepts a valid token", () => {
    const result = verifyTurnstileSchema.safeParse({ token: "abc123-turnstile-token" });
    expect(result.success).toBe(true);
  });

  it("rejects missing token", () => {
    const result = verifyTurnstileSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty token", () => {
    const result = verifyTurnstileSchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-string token", () => {
    const result = verifyTurnstileSchema.safeParse({ token: 12345 });
    expect(result.success).toBe(false);
  });
});
