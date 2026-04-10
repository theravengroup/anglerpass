import { z } from "zod";

// ─── Turnstile Verification ──────────────────────────────────────

export const verifyTurnstileSchema = z.object({
  token: z.string().min(1, "Turnstile token is required"),
});

export type VerifyTurnstileInput = z.infer<typeof verifyTurnstileSchema>;
