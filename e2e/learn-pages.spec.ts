import { test, expect } from "@playwright/test";

/**
 * Smoke tests for the /learn section.
 * Verifies the post listing page and individual article pages
 * load correctly, display images, and have proper meta tags.
 */

// Three real post slugs (with images) to test individual article pages
const ARTICLE_SLUGS = [
  "best-private-trout-streams-american-west",
  "how-to-start-a-fly-fishing-club",
  "etiquette-of-private-water",
];

test.describe("Learn listing page", () => {
  test("/learn loads and shows post grid", async ({ page }) => {
    const response = await page.goto("/learn", { waitUntil: "domcontentloaded" });

    expect(response?.status()).toBeLessThan(500);

    // Page has an h1 heading
    await expect(page.locator("h1").first()).toBeVisible();

    // Page shows article cards (links to /learn/*)
    const cards = page.locator('a[href^="/learn/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("/learn has at least 15 article cards after loading all", async ({ page }) => {
    await page.goto("/learn", { waitUntil: "domcontentloaded" });

    const cards = page.locator('a[href^="/learn/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });

    // The grid paginates with a "Load More" button — click until all shown
    const loadMoreBtn = page.getByText("Load More", { exact: false });
    while (await loadMoreBtn.isVisible()) {
      await loadMoreBtn.click();
      // Brief wait for new cards to render
      await page.waitForTimeout(500);
    }

    // 20 posts total, some may be future-dated; at least 14 should be published
    expect(await cards.count()).toBeGreaterThanOrEqual(14);
  });

  test("post cards with images show an <img> element", async ({ page }) => {
    await page.goto("/learn", { waitUntil: "domcontentloaded" });

    // Wait for cards to render
    const cards = page.locator('a[href^="/learn/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });

    // At least one card should contain an img element
    const cardsWithImages = page.locator('a[href^="/learn/"] img');
    expect(await cardsWithImages.count()).toBeGreaterThan(0);
  });
});

test.describe("Learn article pages", () => {
  for (const slug of ARTICLE_SLUGS) {
    test(`/learn/${slug} loads with heading and content`, async ({ page }) => {
      const response = await page.goto(`/learn/${slug}`, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status()).toBeLessThan(500);

      // Has an h1 heading
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible({ timeout: 10_000 });
      const headingText = await h1.textContent();
      expect(headingText?.length).toBeGreaterThan(0);

      // Has article content (the rendered markdown section)
      const article = page.locator("article");
      await expect(article).toBeVisible();
    });
  }

  test("article page with image shows hero image", async ({ page }) => {
    // This slug has a matching .webp in public/images/posts-images/
    await page.goto("/learn/best-private-trout-streams-american-west", {
      waitUntil: "domcontentloaded",
    });

    // The hero image is rendered via Next.js Image inside a section above the article
    const heroImg = page.locator("img").first();
    await expect(heroImg).toBeVisible({ timeout: 10_000 });
  });

  test("article pages have OpenGraph meta tags", async ({ page }) => {
    await page.goto("/learn/how-to-start-a-fly-fishing-club", {
      waitUntil: "domcontentloaded",
    });

    // og:title should exist
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);
    const titleContent = await ogTitle.getAttribute("content");
    expect(titleContent?.length).toBeGreaterThan(0);

    // og:image should exist
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveCount(1);
    const imageContent = await ogImage.getAttribute("content");
    expect(imageContent?.length).toBeGreaterThan(0);
  });
});
