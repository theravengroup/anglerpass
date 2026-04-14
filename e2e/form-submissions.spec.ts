import { test, expect } from "@playwright/test";

/**
 * Form submission tests — waitlist (leads) and contact form flows.
 *
 * Both API routes verify Cloudflare Turnstile tokens before processing.
 * In environments without the Turnstile test secret key, requests with
 * dummy tokens get 400 "CAPTCHA verification failed". The tests account
 * for this: valid-payload tests accept either 200 (CAPTCHA passes) or
 * 400 with the CAPTCHA message (not a 500). Validation tests confirm
 * the server never returns 500 regardless of input.
 *
 * Each API test sends a unique X-Forwarded-For header so that the
 * in-memory rate limiter treats every test as a separate client.
 */

/** Return headers with a unique IP to avoid shared rate-limit buckets. */
function uniqueIpHeaders() {
  const a = Math.floor(Math.random() * 254) + 1;
  const b = Math.floor(Math.random() * 254) + 1;
  const c = Math.floor(Math.random() * 254) + 1;
  return { "X-Forwarded-For": `10.${a}.${b}.${c}` };
}

// ---------------------------------------------------------------------------
// Waitlist / Leads API
// ---------------------------------------------------------------------------

test.describe("Waitlist API (/api/leads)", () => {
  const VALID_LEAD = {
    firstName: "Test",
    lastName: "User",
    email: "test-e2e@example.com",
    interestType: "angler",
    type: "waitlist",
    state: "CO",
    turnstileToken: "test-token",
  };

  test("POST with valid waitlist data returns 200 or CAPTCHA 400", async ({
    request,
  }) => {
    const response = await request.post("/api/leads", {
      data: VALID_LEAD,
      headers: uniqueIpHeaders(),
    });
    const status = response.status();
    const body = await response.json();

    if (status === 200) {
      expect(body).toEqual({ success: true });
    } else {
      // Turnstile blocks with real secret — expect CAPTCHA error, not 500
      expect(status).toBe(400);
      expect(body.error).toBe("CAPTCHA verification failed");
    }
  });

  test("POST with missing required fields returns 400", async ({
    request,
  }) => {
    const response = await request.post("/api/leads", {
      data: {},
      headers: uniqueIpHeaders(),
    });
    expect(response.status()).toBe(400);
  });

  test("POST with invalid email returns 400", async ({ request }) => {
    const response = await request.post("/api/leads", {
      data: {
        firstName: "Test",
        email: "not-an-email",
        interestType: "angler",
        turnstileToken: "test-token",
      },
      headers: uniqueIpHeaders(),
    });
    expect(response.status()).toBe(400);
  });

  test("POST with missing turnstile token returns 400", async ({
    request,
  }) => {
    const response = await request.post("/api/leads", {
      data: {
        firstName: "Test",
        lastName: "User",
        email: "test-e2e@example.com",
        interestType: "angler",
        type: "waitlist",
      },
      headers: uniqueIpHeaders(),
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("CAPTCHA verification failed");
  });
});

// ---------------------------------------------------------------------------
// Homepage waitlist section (page-level)
// ---------------------------------------------------------------------------

test.describe("Homepage waitlist section", () => {
  test("waitlist section exists and form fields are visible", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Scroll to the waitlist section
    const waitlistSection = page.locator("#waitlist");
    if ((await waitlistSection.count()) > 0) {
      await waitlistSection.scrollIntoViewIfNeeded();

      // Look for typical form fields within the section
      const firstNameInput = waitlistSection
        .locator('input[name="firstName"], input[placeholder*="First"]')
        .first();
      const emailInput = waitlistSection
        .locator('input[name="email"], input[type="email"]')
        .first();

      // At least the section and some form elements should exist
      await expect(waitlistSection).toBeVisible();

      const hasFormFields =
        (await firstNameInput.count()) > 0 ||
        (await emailInput.count()) > 0;
      expect(hasFormFields).toBe(true);
    } else {
      // If no #waitlist section, at least verify there's a waitlist CTA
      const ctaLink = page.locator('a[href*="waitlist"]').first();
      expect(await ctaLink.count()).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Contact API (/api/contact)
// ---------------------------------------------------------------------------

test.describe("Contact API (/api/contact)", () => {
  const VALID_CONTACT = {
    name: "Test User",
    email: "test-e2e@example.com",
    department: "general",
    message: "This is a test message for E2E testing purposes.",
    turnstileToken: "test-token",
  };

  test("POST with valid data returns 200 or CAPTCHA 400", async ({
    request,
  }) => {
    const response = await request.post("/api/contact", {
      data: VALID_CONTACT,
      headers: uniqueIpHeaders(),
    });
    const status = response.status();
    const body = await response.json();

    if (status === 200) {
      expect(body).toEqual({ success: true });
    } else {
      expect(status).toBe(400);
      expect(body.error).toBe("CAPTCHA verification failed");
    }
  });

  test("POST with missing message returns 400", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "Test User",
        email: "test-e2e@example.com",
        department: "general",
        turnstileToken: "test-token",
      },
      headers: uniqueIpHeaders(),
    });
    expect(response.status()).toBe(400);
  });

  test("POST with invalid department returns 400", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        name: "Test User",
        email: "test-e2e@example.com",
        department: "nonexistent-department",
        message: "This is a test message for E2E testing purposes.",
        turnstileToken: "test-token",
      },
      headers: uniqueIpHeaders(),
    });
    expect(response.status()).toBe(400);
  });

  test("POST with empty body returns 400", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {},
      headers: uniqueIpHeaders(),
    });
    expect(response.status()).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Contact form on page (page-level)
// ---------------------------------------------------------------------------

test.describe("Contact form on page", () => {
  test("contact form is accessible from the footer", async ({ page }) => {
    // The contact form lives in the MarketingFooter as a modal.
    // We need networkidle so React hydration completes before clicking.
    await page.goto("/about", { waitUntil: "networkidle" });

    // Scroll footer into view so the Contact button is interactive
    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    // Click the "Contact" link in the Company column.
    // The FooterButtonLink is an <a href="#"> — wait for it to be attached
    // (hydrated) before clicking so the onClick handler fires.
    const contactButton = footer.getByText("Contact", { exact: true });
    await expect(contactButton).toBeAttached();
    await contactButton.click();

    // Wait for the contact form modal to render (role="dialog")
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Verify the key form fields are present inside the modal
    await expect(page.locator("#contact-name")).toBeVisible();
    await expect(page.locator("#contact-email")).toBeVisible();
    await expect(page.locator("#contact-department")).toBeVisible();
    await expect(page.locator("#contact-message")).toBeVisible();
  });
});
