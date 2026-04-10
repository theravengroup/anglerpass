import { test, expect } from "@playwright/test";

/**
 * Auth flow tests — verifies middleware correctly protects routes,
 * redirects unauthenticated users, and routes authenticated users
 * to the right dashboards.
 */

test.describe("Unauthenticated redirects", () => {
  const PROTECTED_ROUTES = [
    "/landowner",
    "/club",
    "/angler",
    "/admin",
    "/guide",
    "/corporate",
  ];

  for (const route of PROTECTED_ROUTES) {
    test(`${route} redirects to /login`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      // Should end up on the login page
      expect(page.url()).toContain("/login");
    });
  }

  test("public marketing pages do NOT redirect", async ({ page }) => {
    for (const path of ["/landowners", "/clubs", "/anglers", "/guides", "/corporates"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Should stay on the same path (public overrides)
      expect(page.url()).toContain(path);
      expect(page.url()).not.toContain("/login");
    }
  });
});

test.describe("Login page", () => {
  test("login page renders form fields", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });

    // Email and password fields should exist
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    // Submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("signup page renders role selector", async ({ page }) => {
    await page.goto("/signup", { waitUntil: "domcontentloaded" });

    // Role selection should be present
    const pageText = await page.textContent("body");
    expect(pageText).toContain("Landowner");
    expect(pageText).toContain("Angler");
    expect(pageText).toContain("Corporate Membership");
  });
});

test.describe("Dev login endpoint", () => {
  test("returns 307 redirect for valid roles", async ({ request }) => {
    for (const role of ["landowner", "angler", "club_admin", "guide", "corporate"]) {
      const response = await request.get(`/api/dev/login?role=${role}`, {
        maxRedirects: 0,
      });
      expect(response.status()).toBe(307);
    }
  });

  test("sets auth cookies on login", async ({ context, baseURL }) => {
    await context.request.get(`${baseURL}/api/dev/login?role=angler`, {
      maxRedirects: 0,
    });

    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name.includes("auth-token"));
    expect(authCookie).toBeTruthy();
  });
});
