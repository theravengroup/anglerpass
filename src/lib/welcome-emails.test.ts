import { describe, it, expect } from "vitest";
import { getWelcomeEmailContent } from "./welcome-emails";

const ROLES = ["angler", "guide", "club_admin", "landowner"] as const;
const EMAIL_NUMBERS = [1, 2, 3] as const;

describe("getWelcomeEmailContent", () => {
  for (const role of ROLES) {
    for (const emailNumber of EMAIL_NUMBERS) {
      it(`returns valid content for role="${role}", email=${emailNumber}`, () => {
        const content = getWelcomeEmailContent(role, emailNumber);
        expect(content).not.toBeNull();
        expect(content!.subject).toBeTruthy();
        expect(content!.subject.length).toBeGreaterThan(0);
        expect(content!.body).toBeTruthy();
        expect(content!.body.length).toBeGreaterThan(0);
        expect(content!.ctaLabel).toBeTruthy();
        expect(content!.ctaLabel.length).toBeGreaterThan(0);
        expect(content!.ctaUrl).toBeTruthy();
        expect(content!.ctaUrl.startsWith("/")).toBe(true);
        expect(content!.ctaColor).toBeTruthy();
      });
    }
  }

  it("returns 12 total email combinations (4 roles x 3 emails)", () => {
    let count = 0;
    for (const role of ROLES) {
      for (const emailNumber of EMAIL_NUMBERS) {
        if (getWelcomeEmailContent(role, emailNumber)) count++;
      }
    }
    expect(count).toBe(12);
  });

  it("returns null for invalid role", () => {
    expect(getWelcomeEmailContent("invalid_role", 1)).toBeNull();
  });

  it("returns null for empty role string", () => {
    expect(getWelcomeEmailContent("", 1)).toBeNull();
  });

  it("has Welcome to AnglerPass as first email subject for all roles", () => {
    for (const role of ROLES) {
      const content = getWelcomeEmailContent(role, 1);
      expect(content!.subject).toBe("Welcome to AnglerPass");
    }
  });

  it("uses audience-appropriate CTA colors", () => {
    // Angler = bronze-ish
    const angler = getWelcomeEmailContent("angler", 1);
    expect(angler!.ctaColor).toBe("#8b6914");

    // Guide = charcoal
    const guide = getWelcomeEmailContent("guide", 1);
    expect(guide!.ctaColor).toBe("#1e1e1a");

    // Club = river/blue-ish
    const club = getWelcomeEmailContent("club_admin", 1);
    expect(club!.ctaColor).toBe("#3a6b7c");

    // Landowner = forest/green
    const landowner = getWelcomeEmailContent("landowner", 1);
    expect(landowner!.ctaColor).toBe("#2a5a3a");
  });
});
