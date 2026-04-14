import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Set PROD_SMOKE=1 to run the read-only production smoke suite against
 * BASE_URL without starting a local dev server. Used by the every-5-min
 * synthetic monitor workflow.
 */
const IS_PROD_SMOKE = process.env.PROD_SMOKE === "1";

/**
 * Playwright E2E test configuration for AnglerPass.
 *
 * Runs against the Next.js dev server. Set PORT or BASE_URL env vars
 * to target a different server. Uses the /api/dev/login endpoint for auth.
 *
 * Two projects:
 *  1. "smoke" — marketing pages, auth flows, API routes (parallel)
 *  2. "dashboards" — role dashboards (serial, runs after smoke)
 *
 * Usage:
 *   npm run test:e2e                    # starts dev server on :3000
 *   PORT=3001 npm run test:e2e          # reuses existing server on :3001
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: IS_PROD_SMOKE
    ? [
        {
          name: "prod-smoke",
          testMatch: /\/prod-smoke\.spec\.ts$/,
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "smoke",
          testMatch:
            /\/(marketing-pages|auth-flows|api-routes|learn-pages|unsubscribe|form-submissions)\.spec\.ts$/,
          use: { ...devices["Desktop Chrome"] },
        },
        {
          name: "dashboards",
          testMatch: /\/dashboards\.spec\.ts$/,
          use: { ...devices["Desktop Chrome"] },
          dependencies: ["smoke"],
          fullyParallel: false,
        },
      ],

  // No local web server when targeting production.
  webServer: IS_PROD_SMOKE
    ? undefined
    : {
        command: "npm run dev",
        port: PORT,
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
