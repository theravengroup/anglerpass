import { test, expect } from "@playwright/test";
import { loginAsRole, ROLE_PATHS } from "./helpers/auth";

/**
 * Dashboard smoke tests — verifies each role's dashboard loads,
 * shows the sidebar with correct navigation items, and renders
 * main content without errors.
 *
 * Runs after the "smoke" project finishes to avoid overwhelming
 * the dev server with parallel connections.
 */

test.describe("Dashboard smoke tests", () => {
  const ROLE_CONFIGS: Array<{
    role: string;
    sidebarItems: string[];
  }> = [
    {
      role: "landowner",
      sidebarItems: ["Properties", "Bookings"],
    },
    {
      role: "club_admin",
      sidebarItems: ["Members", "Properties"],
    },
    {
      role: "angler",
      sidebarItems: ["Bookings", "Discover"],
    },
    {
      role: "guide",
      sidebarItems: ["My Profile", "Availability"],
    },
    {
      role: "corporate",
      sidebarItems: ["Staff", "Billing", "Company Profile", "Club Details"],
    },
  ];

  for (const { role, sidebarItems } of ROLE_CONFIGS) {
    test(`${role} dashboard loads with sidebar`, async ({ page }) => {
      await loginAsRole(page, role);

      // Should be on the role's dashboard
      const path = ROLE_PATHS[role];
      expect(page.url()).toContain(path);

      // Page should not show a server error
      const body = await page.textContent("body");
      expect(body).not.toContain("Internal Server Error");

      // Dashboard heading should be present
      const heading = page.locator("h1, h2").first();
      await expect(heading).toBeVisible({ timeout: 10_000 });

      // Sidebar should contain role-specific nav items
      for (const item of sidebarItems) {
        const navItem = page.getByText(item, { exact: false });
        expect(await navItem.count()).toBeGreaterThan(0);
      }
    });
  }

  test("admin dashboard loads with admin panel", async ({ page }) => {
    await loginAsRole(page, "admin");

    expect(page.url()).toContain("/admin");

    const body = await page.textContent("body");
    expect(body).not.toContain("Internal Server Error");

    // Admin-specific nav items
    for (const item of ["Users", "CRM", "Finance"]) {
      const navItem = page.getByText(item, { exact: false });
      expect(await navItem.count()).toBeGreaterThan(0);
    }
  });
});

test.describe("Dashboard sub-pages", () => {
  test("corporate sub-pages load without 500s", async ({ page }) => {
    await loginAsRole(page, "corporate");

    const subPages = [
      "/corporate/staff",
      "/corporate/billing",
      "/corporate/profile",
      "/corporate/club",
    ];

    for (const subPage of subPages) {
      const response = await page.goto(subPage, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBeLessThan(500);
      expect(page.url()).toContain(subPage);
    }
  });

  test("angler sub-pages load without 500s", async ({ page }) => {
    await loginAsRole(page, "angler");

    const subPages = [
      "/angler/bookings",
      "/angler/discover",
    ];

    for (const subPage of subPages) {
      const response = await page.goto(subPage, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBeLessThan(500);
    }
  });

  test("landowner sub-pages load without 500s", async ({ page }) => {
    await loginAsRole(page, "landowner");

    const subPages = [
      "/landowner/properties",
      "/landowner/bookings",
    ];

    for (const subPage of subPages) {
      const response = await page.goto(subPage, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBeLessThan(500);
    }
  });
});
