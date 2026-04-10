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
};

/**
 * Log in as a given role using the dev-only login endpoint.
 *
 * Uses the API context to set auth cookies (avoids browser-level
 * connection issues), then navigates to the role's dashboard.
 */
export async function loginAsRole(
  page: Page,
  role: string
): Promise<void> {
  // Clear all cookies to ensure a clean auth state
  const context = page.context();
  await context.clearCookies();

  const expectedPath = ROLE_PATHS[role] ?? `/${role}`;

  // Use the API context to call dev login — this sets cookies without
  // needing a full page navigation (more reliable under load)
  const baseURL = page.url().startsWith("http")
    ? new URL(page.url()).origin
    : undefined;

  // Try API-based login first, fall back to page navigation
  try {
    const url = baseURL
      ? `${baseURL}/api/dev/login?role=${role}`
      : `/api/dev/login?role=${role}`;

    const res = await context.request.get(url, { maxRedirects: 0 });
    expect([200, 307]).toContain(res.status());
  } catch {
    // Fall back to page navigation with retry
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto(`/api/dev/login?role=${role}`, {
          waitUntil: "domcontentloaded",
          timeout: 15_000,
        });
        break;
      } catch (err) {
        if (attempt < 2) {
          await page.waitForTimeout(3_000);
          continue;
        }
        throw err;
      }
    }
  }

  // Navigate to the dashboard
  await page.goto(expectedPath, { waitUntil: "domcontentloaded" });
}

/**
 * Log in via the API (without following the redirect) and store
 * cookies on the context. Useful for API-level tests that need auth.
 */
export async function loginAsRoleViaAPI(
  context: BrowserContext,
  baseURL: string,
  role: string
): Promise<void> {
  // Clear existing cookies for clean state
  await context.clearCookies();

  const res = await context.request.get(
    `${baseURL}/api/dev/login?role=${role}`,
    { maxRedirects: 0 }
  );

  // The 307 response sets cookies; the context stores them automatically.
  expect([200, 307]).toContain(res.status());
}
