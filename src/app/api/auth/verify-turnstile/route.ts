import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/helpers";

const verifyTurnstileSchema = z.object({
  token: z.string().min(1, "Turnstile token is required"),
});

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  if (!body) {
    return jsonError("Invalid request body", 400);
  }

  const parsed = verifyTurnstileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0].message, 400);
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    console.error("[verify-turnstile] TURNSTILE_SECRET_KEY is not configured");
    return jsonError("CAPTCHA verification is not configured", 500);
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", parsed.data.token);

  // Forward the client IP if available for additional security
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) {
    formData.append("remoteip", ip);
  }

  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    }
  );

  if (!verifyResponse.ok) {
    console.error("[verify-turnstile] Cloudflare API returned", verifyResponse.status);
    return jsonError("CAPTCHA verification service unavailable", 502);
  }

  const result: TurnstileVerifyResponse = await verifyResponse.json();

  if (!result.success) {
    const codes = result["error-codes"]?.join(", ") ?? "unknown";
    console.warn("[verify-turnstile] Verification failed:", codes);
    return jsonError("CAPTCHA verification failed. Please try again.", 403);
  }

  return jsonOk({ success: true });
}
