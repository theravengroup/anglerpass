import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyWebhookSignature } from "@/lib/checkr";
import { evaluateVerification } from "@/lib/guide-verification";

/**
 * POST: Checkr webhook handler.
 *
 * Handles background check events:
 * - report.completed → evaluate if guide can be auto-verified
 * - report.suspended → reject the guide
 */
export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-checkr-signature") ?? "";

    // Verify signature in production
    if (process.env.NODE_ENV === "production") {
      if (!verifyWebhookSignature(payload, signature)) {
        console.error("[checkr] Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(payload);
    const eventType = event.type as string;

    const admin = createAdminClient();

    if (eventType === "report.completed") {
      await handleReportCompleted(admin, event);
    } else if (eventType === "report.suspended") {
      await handleReportSuspended(admin, event);
    }

    // Acknowledge all events
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[checkr] Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleReportCompleted(
  admin: ReturnType<typeof createAdminClient>,
  event: Record<string, unknown>
) {
  const data = event.data as Record<string, unknown> | undefined;
  const object = data?.object as Record<string, unknown> | undefined;
  const reportId = object?.id as string | undefined;
  const candidateId = object?.candidate_id as string | undefined;
  const status = object?.status as string | undefined;

  if (!candidateId) {
    console.error("[checkr] No candidate_id in report.completed event");
    return;
  }

  // Find guide by Checkr candidate ID
  const { data: guide } = await admin
    .from("guide_profiles")
    .select("id, user_id, status")
    .eq("checkr_candidate_id", candidateId)
    .maybeSingle();

  if (!guide) {
    console.error("[checkr] No guide found for candidate:", candidateId);
    return;
  }

  // Map Checkr status to our status
  const checkrStatus = status === "clear" ? "clear" : "consider";

  // Update guide profile with report results
  await admin
    .from("guide_profiles")
    .update({
      checkr_report_id: reportId ?? null,
      checkr_status: checkrStatus,
      checkr_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", guide.id);

  // Log event
  await admin.from("guide_verification_events").insert({
    guide_id: guide.id,
    event_type: "checkr_completed",
    old_status: guide.status,
    new_status: guide.status,
    metadata: {
      report_id: reportId,
      checkr_status: checkrStatus,
      original_status: status,
    },
  });

  if (checkrStatus === "clear") {
    // Try to auto-verify (checks all conditions)
    await evaluateVerification(admin, guide.id);

    // Notify guide
    const { notify } = await import("@/lib/notifications");
    await notify(admin, {
      userId: guide.user_id,
      type: "guide_profile_approved",
      title: "Background check cleared!",
      body: "Your background check has cleared. Your profile is now under final admin review.",
      link: "/guide/verification",
    });
  } else {
    // "consider" status — notify admins for manual review
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin");

    if (admins) {
      const { notify } = await import("@/lib/notifications");
      for (const adminUser of admins) {
        await notify(admin, {
          userId: adminUser.id,
          type: "guide_water_approval_requested",
          title: "Background check needs review",
          body: `A guide's background check returned "consider" status and requires manual review.`,
          link: "/admin/guides",
        });
      }
    }
  }
}

async function handleReportSuspended(
  admin: ReturnType<typeof createAdminClient>,
  event: Record<string, unknown>
) {
  const data = event.data as Record<string, unknown> | undefined;
  const object = data?.object as Record<string, unknown> | undefined;
  const candidateId = object?.candidate_id as string | undefined;

  if (!candidateId) return;

  const { data: guide } = await admin
    .from("guide_profiles")
    .select("id, user_id, status")
    .eq("checkr_candidate_id", candidateId)
    .maybeSingle();

  if (!guide) return;

  // Reject the guide
  await admin
    .from("guide_profiles")
    .update({
      status: "rejected",
      checkr_status: "suspended",
      rejection_reason: "Background check could not be completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", guide.id);

  // Log event
  await admin.from("guide_verification_events").insert({
    guide_id: guide.id,
    event_type: "checkr_suspended",
    old_status: guide.status,
    new_status: "rejected",
    metadata: { reason: "Report suspended by Checkr" },
  });

  // Notify guide
  const { notifyGuideProfileRejected } = await import("@/lib/notifications");
  await notifyGuideProfileRejected(admin, {
    guideUserId: guide.user_id,
    reason: "Your background check could not be completed. Please contact support for assistance.",
  });
}
