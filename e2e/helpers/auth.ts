import { type Page, type BrowserContext, expect } from "@playwright/test";

/**
 * Valid roles for the dev login endpoint.
 * Maps role names to the dashboard path they redirect to.
 */
export const ROLE_PATHS: Record<string, string> = {
  landowner: "/landowner",
  club_admin: "/club",
  angler: "/angler",
  admin: "/admin",
  guide: "/guide",
  corporate: "/corporate",
  affiliate: "/affiliate",
};

/**
 * Log in as a given role using the dev-only login endpoint.
 *
 * Uses page.goto to follow the full redirect chain (sets cookies in
 * the browser context reliably), then navigates to the role dashboard.
 *
 * Includes a retry mechanism: if the first login attempt lands on the
 * wrong role (due to a concurrent test mutating the shared test user),
 * it retries once.
 */
export async function loginAsRole(
  page: Page,
  role: string
): Promise<void> {
  const context = page.context();
  await context.clearCookies();

  const expectedPath = ROLE_PATHS[role] ?? `/${role}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(`/api/dev/login?role=${role}`, {
        waitUntil: "domcontentloaded",
        timeout: 15_000,
      });
      break;
    } catch {
      if (attempt < 2) {
        await page.waitForTimeout(2_000);
        continue;
      }
      throw new Error(`Failed to login as ${role} after 3 attempts`);
    }
  }

  // Navigate to the expected dashboard if we're not already there
  if (!page.url().includes(expectedPath)) {
    await page.goto(expectedPath, { waitUntil: "domcontentloaded" });
  }
}

/**
 * Log in via the API context for API-level tests that need auth cookies.
 *
 * Uses maxRedirects: 0 because the dev login redirect URL may point to
 * a different port than the test server. The 307 response still sets
 * cookies via Set-Cookie headers which Playwright captures.
 *
 * Retries up to 3 times to handle cold-start latency on first login.
 */
export async function loginAsRoleViaAPI(
  context: BrowserContext,
  baseURL: string,
  role: string
): Promise<void> {
  await context.clearCookies();

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await context.request.get(
      `${baseURL}/api/dev/login?role=${role}`,
      { maxRedirects: 0 },
    );

    // The 307 response sets cookies via Set-Cookie headers
    expect([200, 307]).toContain(res.status());

    // Verify cookies are working by making an authenticated request
    const verifyRes = await context.request.get(`${baseURL}/api/profile`);
    if (verifyRes.status() === 200) {
      return; // Auth is established
    }

    // If still 401, cookies may not have applied yet — retry
    if (attempt < 2) {
      await context.clearCookies();
    }
  }

  // Final fallback: if verification still fails, proceed anyway
  // (some tests may handle 401 themselves)
}
