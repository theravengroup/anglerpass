import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonError } from "@/lib/api/helpers";
import { buildCrmEmailHtml } from "@/lib/crm/email-sender";
import { testSendSchema } from "@/lib/validations/campaigns";
import { getResend } from "@/lib/email";
import { SITE_URL } from "@/lib/constants";

/**
 * POST /api/admin/campaigns/[id]/test-send
 *
 * Send a test email for a campaign step. Doesn't create any
 * campaign_sends records — just sends the formatted email
 * directly to the specified address.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const resend = getResend();
  if (!resend) {
    return jsonError("Resend not configured", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = testSendSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { email, step_id } = result.data;

  // Load campaign
  const { data: campaign } = await auth.admin.from("campaigns")
    .select("from_name, from_email, reply_to")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) return jsonError("Campaign not found", 404);

  const c = campaign as Record<string, unknown>;

  // Load the step — if step_id provided, use that; otherwise use step 1
  let stepQuery = auth.admin.from("campaign_steps")
    .select("subject, html_body, cta_label, cta_url")
    .eq("campaign_id", id);

  if (step_id) {
    stepQuery = stepQuery.eq("id", step_id);
  } else {
    stepQuery = stepQuery.order("step_order", { ascending: true }).limit(1);
  }

  const { data: step } = await stepQuery.maybeSingle();

  if (!step) {
    return jsonError("No steps found for this campaign", 404);
  }

  const s = step as Record<string, unknown>;

  // Build the email HTML with a fake sendId (test sends aren't tracked)
  const testSendId = crypto.randomUUID();
  const html = buildCrmEmailHtml({
    sendId: testSendId,
    to: email,
    subject: `[TEST] ${s.subject as string}`,
    htmlBody: s.html_body as string,
    fromName: (c.from_name as string) ?? "AnglerPass",
    fromEmail: (c.from_email as string) ?? "hello@anglerpass.com",
    replyTo: (c.reply_to as string) ?? undefined,
    ctaLabel: (s.cta_label as string) ?? undefined,
    ctaUrl: (s.cta_url as string) ?? undefined,
    recipientName: "Test User",
    userId: auth.user.id,
  });

  // Send via Resend directly (no tracking, no suppression checks)
  try {
    const sendResult = await resend.emails.send({
      from: `${(c.from_name as string) ?? "AnglerPass"} <${(c.from_email as string) ?? "hello@anglerpass.com"}>`,
      to: email,
      subject: `[TEST] ${s.subject as string}`,
      html,
      replyTo: (c.reply_to as string) ?? undefined,
      headers: {
        "List-Unsubscribe": `<${SITE_URL}/api/notifications/unsubscribe>`,
        "X-Test-Send": "true",
      },
    });

    return jsonOk({
      sent: true,
      messageId: sendResult.data && "id" in sendResult.data ? sendResult.data.id : null,
      to: email,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send failed";
    return jsonError(msg, 500);
  }
}
