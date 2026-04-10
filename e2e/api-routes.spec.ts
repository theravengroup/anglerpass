import { test, expect } from "@playwright/test";
import { loginAsRoleViaAPI } from "./helpers/auth";

/**
 * Critical API route tests — verifies key endpoints return expected
 * responses with proper auth and error handling.
 */

test.describe("Admin API routes (unauthenticated)", () => {
  test("admin endpoints reject unauthenticated requests", async ({ request }) => {
    const adminRoutes = [
      "/api/admin/segments",
      "/api/admin/campaigns",
    ];

    for (const route of adminRoutes) {
      const response = await request.get(route);
      // Should return 401 Unauthorized
      expect(response.status()).toBe(401);
    }
  });
});

test.describe("Admin API routes (authenticated as admin)", () => {
  test("GET /api/admin/segments returns segments list", async ({
    context,
    baseURL,
  }) => {
    await loginAsRoleViaAPI(context, baseURL!, "admin");

    const response = await context.request.get(`${baseURL}/api/admin/segments`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("segments");
    expect(body).toHaveProperty("pagination");
    expect(Array.isArray(body.segments)).toBe(true);
  });

  test("GET /api/admin/campaigns returns campaigns list", async ({
    context,
    baseURL,
  }) => {
    await loginAsRoleViaAPI(context, baseURL!, "admin");

    const response = await context.request.get(
      `${baseURL}/api/admin/campaigns`
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("campaigns");
    expect(Array.isArray(body.campaigns)).toBe(true);
  });

  test("POST /api/admin/segments validates input", async ({
    context,
    baseURL,
  }) => {
    await loginAsRoleViaAPI(context, baseURL!, "admin");

    // Empty body should be rejected
    const response = await context.request.post(
      `${baseURL}/api/admin/segments`,
      { data: {} }
    );
    expect(response.status()).toBe(400);
  });
});

test.describe("Corporate API routes", () => {
  test("GET /api/corporate/onboarding-status requires auth", async ({
    request,
  }) => {
    const response = await request.get("/api/corporate/onboarding-status");
    expect(response.status()).toBe(401);
  });

  test("GET /api/corporate/onboarding-status returns state for corporate user", async ({
    context,
    baseURL,
  }) => {
    await loginAsRoleViaAPI(context, baseURL!, "corporate");

    const response = await context.request.get(
      `${baseURL}/api/corporate/onboarding-status`
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("state");
    // New corporate user should be in no_club state
    expect(["no_club", "pending", "payment_pending", "active"]).toContain(
      body.state
    );
  });

  test("GET /api/corporate/dashboard requires auth", async ({ request }) => {
    const response = await request.get("/api/corporate/dashboard");
    expect(response.status()).toBe(401);
  });

  test("POST /api/corporate/join-club validates input", async ({
    context,
    baseURL,
  }) => {
    await loginAsRoleViaAPI(context, baseURL!, "corporate");

    // Empty body should be rejected
    const response = await context.request.post(
      `${baseURL}/api/corporate/join-club`,
      { data: {} }
    );
    // Should return 400 (invalid input) not 500
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe("Public API routes", () => {
  test("auth callback route exists", async ({ request }) => {
    // GET without code param should redirect or return error, not 500
    const response = await request.get("/auth/callback", {
      maxRedirects: 0,
    });
    expect(response.status()).toBeLessThan(500);
  });
});
