import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api/helpers";
import { processSendBatch } from "@/lib/crm/email-sender";

/**
 * GET /api/cron/crm-sender
 *
 * Cron job that processes queued CRM email sends.
 * Runs every 5 minutes. Picks up queued sends that are due,
 * checks suppression/opt-out, and sends via Resend.
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
    const result = await processSendBatch(admin, 50);

    console.log(
      `[cron/crm-sender] Batch complete: ${result.sent} sent, ${result.skipped} skipped, ${result.failed} failed`
    );

    return jsonOk({
      processed: true,
      ...result,
    });
  } catch (err) {
    console.error("[cron/crm-sender] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonError(`CRM sender failed: ${msg}`, 500);
  }
}
