import { test, expect } from "@playwright/test";

/**
 * Production smoke suite.
 *
 * Runs every 5 minutes against the live site to catch regressions before
 * users do. Must be idempotent and read-only — no signups, no bookings,
 * no payments. If any of these fail, on-call gets paged.
 *
 * Target URL is set via BASE_URL env var (defaults to production).
 * Auth-required surfaces are intentionally NOT covered here — a prod
 * monitor account would be a persistent credential leak. We verify that
 * public surfaces are healthy and that auth-gated routes correctly
 * redirect unauthenticated traffic.
 */

test.describe("Production smoke", () => {
  test("health endpoint returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status(), "DB or Stripe circuit unhealthy").toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checks.database).toBe("ok");
    expect(body.checks.stripe).toBe("ok");
  });

  test("homepage loads", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status(), "homepage returned non-2xx").toBeLessThan(400);
    await expect(page).toHaveTitle(/AnglerPass/i);
  });

  test("login page loads", async ({ page }) => {
    const res = await page.goto("/login", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
    // Login form is present
    await expect(
      page.getByRole("textbox", { name: /email/i })
    ).toBeVisible();
  });

  test("signup page loads", async ({ page }) => {
    const res = await page.goto("/signup", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
  });

  test("pricing page loads", async ({ page }) => {
    const res = await page.goto("/pricing", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
  });

  test("explore page loads", async ({ page }) => {
    const res = await page.goto("/explore", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status()).toBeLessThan(400);
  });

  test("audience pages load", async ({ page }) => {
    for (const path of ["/anglers", "/landowners", "/clubs", "/guides"]) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${path} returned non-2xx`).toBeLessThan(400);
    }
  });

  test("dashboard redirects unauth traffic to login", async ({ page }) => {
    const res = await page.goto("/dashboard", {
      waitUntil: "domcontentloaded",
    });
    // Either a redirect or the login page itself.
    expect(res?.status()).toBeLessThan(400);
    expect(page.url()).toMatch(/\/login/);
  });

  test("public clubs API responds", async ({ request }) => {
    const res = await request.get("/api/clubs/public");
    expect(res.status()).toBeLessThan(500);
  });

  test("no JS errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/", { waitUntil: "networkidle" });
    // Filter known-benign third-party noise
    const significant = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.toLowerCase().includes("extension")
    );
    expect(significant, `Console errors: ${significant.join("; ")}`).toHaveLength(0);
  });
});
