import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { publishEligibleReviews } from "@/lib/reviews";

/**
 * POST: Publish eligible reviews.
 *
 * This endpoint is designed to be called by a cron job (e.g., Vercel Cron).
 * It publishes all submitted reviews that meet either condition:
 * - 48 hours have passed since submission
 * - The review window has expired
 *
 * Protected by a secret token in the Authorization header.
 */
export async function POST(request: Request) {
  // Verify cron secret — Vercel sends this automatically for cron jobs.
  // Fail closed — an unset secret means the endpoint is not safe to call.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();
  const result = await publishEligibleReviews(admin);

  if (result.error) {
    console.error("[trip-reviews/publish-cron] Error:", result.error);
    return jsonError(result.error, 500);
  }

  return jsonOk({
    published: result.published,
    timestamp: new Date().toISOString(),
  });
}
