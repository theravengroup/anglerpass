import { test, expect } from "@playwright/test";

/**
 * Email unsubscribe endpoint tests — verifies GET (HTML) and POST (JSON)
 * handlers reject invalid/missing tokens with correct status codes and
 * content types, without returning 500 errors.
 */

const ENDPOINT = "/api/notifications/unsubscribe";

test.describe("GET /api/notifications/unsubscribe", () => {
  test("without token returns 400 error HTML", async ({ request }) => {
    const response = await request.get(ENDPOINT);
    expect(response.status()).toBe(400);

    const html = await response.text();
    expect(html.toLowerCase()).toContain("invalid");
    expect(response.headers()["content-type"]).toContain("text/html");
  });

  test("with invalid token returns 400 error HTML", async ({ request }) => {
    const response = await request.get(`${ENDPOINT}?token=invalid.token`);
    expect(response.status()).toBe(400);

    const html = await response.text();
    expect(html.toLowerCase()).toContain("invalid");
    expect(response.headers()["content-type"]).toContain("text/html");
  });

  test("with valid format but wrong HMAC returns 400", async ({ request }) => {
    // Properly formatted token: base64url(userId).base64url(fakeHmac)
    const encodedId = Buffer.from("fake-user-id").toString("base64url");
    const fakeHmac = Buffer.from("not-a-real-hmac-value").toString("base64url");
    const token = `${encodedId}.${fakeHmac}`;

    const response = await request.get(`${ENDPOINT}?token=${token}`);
    expect(response.status()).toBe(400);
    expect(response.headers()["content-type"]).toContain("text/html");
  });
});

test.describe("POST /api/notifications/unsubscribe", () => {
  test("without token returns 400 error JSON", async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("with invalid token returns 400 error JSON", async ({ request }) => {
    const response = await request.post(ENDPOINT, {
      data: { token: "invalid.token" },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  test("with form-encoded data handles gracefully (no 500)", async ({
    request,
  }) => {
    const response = await request.post(ENDPOINT, {
      data: "List-Unsubscribe=One-Click",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    // Should return 400 (no valid token) but never 500
    expect(response.status()).toBeLessThan(500);
    expect(response.status()).toBe(400);
  });
});
