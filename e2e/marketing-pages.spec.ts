import { test, expect } from "@playwright/test";

/**
 * Smoke tests for all public marketing pages.
 * Verifies each page loads without errors (no 500s, no blank pages).
 */

const MARKETING_PAGES = [
  { path: "/", title: "AnglerPass" },
  { path: "/anglers", title: "Anglers" },
  { path: "/landowners", title: "Landowners" },
  { path: "/clubs", title: "Clubs" },
  { path: "/guides", title: "Guides" },
  { path: "/corporates", title: "Corporate" },
  { path: "/about", title: "About" },
  { path: "/team", title: "Team" },
  { path: "/press", title: "Press" },
  { path: "/pricing", title: "Pricing" },
  { path: "/explore", title: "Explore" },
  { path: "/learn", title: "Learn" },
  { path: "/conservation", title: "Conservation" },
  { path: "/privacy", title: "Privacy" },
  { path: "/terms", title: "Terms" },
  { path: "/policies", title: "Policies" },
];

test.describe("Marketing pages", () => {
  for (const { path, title } of MARKETING_PAGES) {
    test(`${path} loads without errors`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      // No server errors
      expect(response?.status()).toBeLessThan(500);

      // Page has a title (not blank)
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();

      // Page contains expected content marker
      // (title word appears somewhere in the page or document title)
      const hasContent =
        pageTitle.toLowerCase().includes(title.toLowerCase()) ||
        (await page.locator("h1, h2").first().isVisible());
      expect(hasContent).toBe(true);
    });
  }
});

test.describe("Marketing page structure", () => {
  test("homepage has navigation and waitlist section", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Nav exists
    await expect(page.locator("nav").first()).toBeVisible();

    // Waitlist section exists (id="waitlist" or a form)
    const waitlistSection =
      page.locator("#waitlist").or(page.locator('form[action*="waitlist"]'));
    // At minimum the page should have some call to action
    const ctaLink = page.locator('a[href*="waitlist"]').first();
    const hasWaitlist =
      (await waitlistSection.count()) > 0 || (await ctaLink.count()) > 0;
    expect(hasWaitlist).toBe(true);
  });

  test("audience pages have hero and CTA buttons", async ({ page }) => {
    for (const path of ["/anglers", "/landowners", "/clubs", "/guides", "/corporates"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      // Has an h1 heading
      await expect(page.locator("h1").first()).toBeVisible();

      // Has at least one CTA link
      const ctas = page.locator('a[href*="waitlist"], a[href*="#"]');
      expect(await ctas.count()).toBeGreaterThan(0);
    }
  });

  test("footer links are present on marketing pages", async ({ page }) => {
    await page.goto("/anglers", { waitUntil: "domcontentloaded" });

    // Footer exists
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Key footer links
    for (const text of ["For Landowners", "For Clubs", "For Anglers", "Corporate Memberships"]) {
      await expect(footer.getByText(text, { exact: false })).toBeVisible();
    }
  });
});
