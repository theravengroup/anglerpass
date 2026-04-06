import { describe, it, expect } from "vitest";
import { scanForAutoFlag } from "./auto-flag";

describe("scanForAutoFlag", () => {
  // ─── Clean text ─────────────────────────────────────────────────

  it("does not flag clean review text", () => {
    const result = scanForAutoFlag(
      "Great fishing spot. The water was clear and the trout were biting. Highly recommend."
    );
    expect(result.shouldFlag).toBe(false);
    expect(result.reason).toBeNull();
    expect(result.notes).toBeNull();
  });

  it("does not flag text with single profanity (below threshold)", () => {
    const result = scanForAutoFlag("The damn fish got away but it was still fun.");
    expect(result.shouldFlag).toBe(false);
  });

  // ─── Threats ───────────────────────────────────────────────────

  it("flags text with threatening language: kill", () => {
    const result = scanForAutoFlag("I will kill you if you don't refund me");
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("threat");
  });

  it("flags text with threatening language: burn down", () => {
    const result = scanForAutoFlag("I want to burn it down");
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("threat");
  });

  it("flags text with threatening language: watch your back", () => {
    const result = scanForAutoFlag("You better watch your back buddy");
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("threat");
  });

  it("flags text with threatening language: you are dead", () => {
    const result = scanForAutoFlag("You're dead to me and everyone");
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("threat");
  });

  it("flags text with threatening language: I will find", () => {
    const result = scanForAutoFlag("I'll find you no matter what");
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("threat");
  });

  // ─── Extortion ────────────────────────────────────────────────

  it("flags extortion: refund near negative review", () => {
    const result = scanForAutoFlag(
      "Give me a refund or I will leave a 1-star review"
    );
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("extortion");
  });

  it("flags extortion: negative review near refund (reversed)", () => {
    const result = scanForAutoFlag(
      "I'm going to post a negative review unless I get a refund"
    );
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("extortion");
  });

  it("flags extortion: refund or else pattern", () => {
    const result = scanForAutoFlag("Give me a refund or else");
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("extortion");
  });

  // ─── Contact Info (Doxxing) ───────────────────────────────────

  it("flags phone numbers", () => {
    const result = scanForAutoFlag(
      "Call the owner at (555) 123-4567 for a real answer"
    );
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("doxxing");
  });

  it("flags email addresses", () => {
    const result = scanForAutoFlag(
      "Email the owner at john.doe@example.com directly"
    );
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("doxxing");
  });

  it("flags street addresses", () => {
    const result = scanForAutoFlag(
      "The property is at 123 Main Street if you want to find them"
    );
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("doxxing");
  });

  // ─── Profanity Threshold ──────────────────────────────────────

  it("flags text with 2+ profanity hits (meets threshold)", () => {
    const result = scanForAutoFlag("This shit was bullshit, worst trip ever");
    expect(result.shouldFlag).toBe(true);
    expect(result.reason).toBe("other");
    expect(result.notes).toContain("profanity");
  });

  it("does not flag text with only 1 profanity hit", () => {
    const result = scanForAutoFlag("What a shit experience but the water was nice");
    expect(result.shouldFlag).toBe(false);
  });

  // ─── Priority: threats before extortion before doxxing ────────

  it("prioritizes threats over other flags", () => {
    const result = scanForAutoFlag(
      "I will kill you. Call me at (555) 123-4567. Give refund or else."
    );
    expect(result.reason).toBe("threat");
  });
});
