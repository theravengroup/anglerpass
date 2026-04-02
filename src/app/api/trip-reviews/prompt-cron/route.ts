import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { processReviewPrompts } from "@/lib/reviews/prompts";

/**
 * POST: Send review prompts to eligible anglers.
 *
 * This endpoint is designed to be called by a cron job (e.g., Vercel Cron).
 * It processes all eligible bookings and sends:
 * - Initial email + SMS on the last fishing day (day 0)
 * - Reminder email on day 14 (if no review submitted)
 * - Reminder SMS on day 18 (if no review submitted)
 *
 * Maximum 2 emails and 2 SMS messages per booking per review window.
 *
 * Protected by a secret token in the Authorization header.
 */
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();

  try {
    const result = await processReviewPrompts(admin);

    return jsonOk({
      prompted: result.prompted,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[trip-reviews/prompt-cron] Error:", err);
    return jsonError("Failed to process review prompts", 500);
  }
}
