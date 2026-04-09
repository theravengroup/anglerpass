/**
 * Validate a Turnstile CAPTCHA token server-side via our API route.
 * Returns null on success, or an error message string on failure.
 */
export async function verifyTurnstileToken(token: string | null): Promise<string | null> {
  if (!token) {
    return "Please complete the CAPTCHA verification.";
  }

  try {
    const response = await fetch("/api/auth/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data: { success?: boolean; error?: string } = await response.json();

    if (!response.ok || !data.success) {
      return data.error ?? "CAPTCHA verification failed. Please try again.";
    }

    return null;
  } catch {
    return "Unable to verify CAPTCHA. Please check your connection and try again.";
  }
}
