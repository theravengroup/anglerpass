import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { bulkCheckInSchema } from "@/lib/validations/clubos-operations";
import { logMemberActivityBatch } from "@/lib/clubos/activity-logger";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

/**
 * POST /api/clubos/events/[eventId]/check-in — Bulk check-in/mark no-show
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { eventId } = await ctx.params;
    const admin = createAdminClient();

    // Get event
    const { data: event } = await admin
      .from("club_events")
      .select("club_id, title")
      .eq("id", eventId)
      .single();

    if (!event) return jsonError("Event not found", 404);

    const role = await requireClubRole(auth.user.id, event.club_id, P.OPS_MANAGE_EVENTS);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const body = await req.json();
    const parsed = bulkCheckInSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const results: { id: string; status: string; success: boolean }[] = [];
    let attendedCount = 0;
    const activityEvents: Parameters<typeof logMemberActivityBatch>[1] = [];

    for (const item of parsed.data.registrations) {
      const { data: reg } = await admin
        .from("club_event_registrations")
        .select("id, membership_id, status")
        .eq("id", item.registration_id)
        .eq("event_id", eventId)
        .single();

      if (!reg || reg.status === "cancelled") {
        results.push({ id: item.registration_id, status: "skipped", success: false });
        continue;
      }

      const now = new Date().toISOString();
      const { error } = await admin
        .from("club_event_registrations")
        .update({
          status: item.status,
          checked_in_at: item.status === "attended" ? now : null,
        })
        .eq("id", item.registration_id);

      if (error) {
        results.push({ id: item.registration_id, status: "error", success: false });
        continue;
      }

      if (item.status === "attended") attendedCount++;

      results.push({ id: item.registration_id, status: item.status, success: true });

      activityEvents.push({
        membershipId: reg.membership_id,
        clubId: event.club_id,
        eventType: item.status === "attended" ? "event_attended" : "event_no_show",
        metadata: { event_id: eventId, event_title: event.title },
      });
    }

    // Update attended count on event
    if (attendedCount > 0) {
      const { data: currentEvent } = await admin
        .from("club_events")
        .select("attended_count")
        .eq("id", eventId)
        .single();

      if (currentEvent) {
        await admin
          .from("club_events")
          .update({ attended_count: currentEvent.attended_count + attendedCount })
          .eq("id", eventId);
      }
    }

    // Log all activity
    if (activityEvents.length > 0) {
      await logMemberActivityBatch(admin, activityEvents);
    }

    return jsonOk({ results });
  } catch (err) {
    console.error("[clubos/events/check-in] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}
