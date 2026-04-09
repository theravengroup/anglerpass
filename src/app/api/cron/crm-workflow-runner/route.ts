import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { processWorkflowEnrollments } from "@/lib/crm/workflow-engine";

/**
 * GET /api/cron/crm-workflow-runner
 *
 * Cron job that processes workflow enrollments through the visual
 * node graph. Runs every 5 minutes. For each active enrollment
 * whose wait_until has passed (or is null), executes the current
 * node and advances to the next.
 *
 * Protected by CRON_SECRET in the Authorization header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return jsonError("Unauthorized", 401);
  }

  const admin = createAdminClient();

  try {
    const result = await processWorkflowEnrollments(admin);

    console.log(
      `[cron/crm-workflow-runner] Batch complete: ${result.processed} processed, ` +
        `${result.advanced} advanced, ${result.completed} completed, ` +
        `${result.exited} exited, ${result.errors} errors`
    );

    return jsonOk(result);
  } catch (err) {
    console.error("[cron/crm-workflow-runner] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonError(`Workflow runner failed: ${msg}`, 500);
  }
}
