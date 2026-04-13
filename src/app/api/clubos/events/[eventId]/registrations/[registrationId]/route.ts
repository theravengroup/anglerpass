import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { logMemberActivity } from "@/lib/clubos/activity-logger";

interface RouteContext {
  params: Promise<{ eventId: string; registrationId: string }>;
}

/**
 * DELETE /api/clubos/events/[eventId]/registrations/[registrationId] — Cancel a registration
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { eventId, registrationId } = await ctx.params;
    const admin = createAdminClient();

    // Get the registration with event details
    const { data: registration } = await admin
      .from("club_event_registrations")
      .select("*, event:club_events(club_id, title, registered_count, waitlist_count)")
      .eq("id", registrationId)
      .eq("event_id", eventId)
      .single();

    if (!registration) return jsonError("Registration not found", 404);
    if (registration.status === "cancelled") return jsonError("Already cancelled", 400);

    const event = registration.event as { club_id: string; title: string; registered_count: number; waitlist_count: number };

    // Verify ownership or staff access
    const { data: membership } = await admin
      .from("club_memberships")
      .select("user_id")
      .eq("id", registration.membership_id)
      .single();

    const isOwner = membership?.user_id === auth.user.id;
    if (!isOwner) {
      const role = await requireClubRole(auth.user.id, event.club_id, P.OPS_MANAGE_EVENTS);
      if (!role?.isStaff) return jsonError("Forbidden", 403);
    }

    // Cancel the registration
    const { error } = await admin
      .from("club_event_registrations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", registrationId);

    if (error) {
      console.error("[clubos/events/registrations] Cancel failed:", error);
      return jsonError("Failed to cancel registration", 500);
    }

    // Update event counts
    if (registration.status === "registered") {
      const spotsFreed = 1 + (registration.guest_count ?? 0);
      await admin
        .from("club_events")
        .update({ registered_count: Math.max(0, event.registered_count - spotsFreed) })
        .eq("id", eventId);

      // Auto-promote from waitlist if spots opened
      const { data: nextWaitlisted } = await admin
        .from("club_event_registrations")
        .select("id, membership_id, guest_count")
        .eq("event_id", eventId)
        .eq("status", "waitlisted")
        .order("waitlist_position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextWaitlisted) {
        await admin
          .from("club_event_registrations")
          .update({
            status: "registered",
            waitlist_position: null,
            promoted_at: new Date().toISOString(),
          })
          .eq("id", nextWaitlisted.id);

        // Update counts for promotion
        const promotedSpots = 1 + (nextWaitlisted.guest_count ?? 0);
        await admin
          .from("club_events")
          .update({
            registered_count: Math.max(0, event.registered_count - spotsFreed) + promotedSpots,
            waitlist_count: Math.max(0, event.waitlist_count - 1),
          })
          .eq("id", eventId);

        await logMemberActivity({
          admin,
          membershipId: nextWaitlisted.membership_id,
          clubId: event.club_id,
          eventType: "event_registered",
          metadata: { event_id: eventId, event_title: event.title, promoted_from_waitlist: true },
        });
      }
    } else if (registration.status === "waitlisted") {
      await admin
        .from("club_events")
        .update({ waitlist_count: Math.max(0, event.waitlist_count - 1) })
        .eq("id", eventId);
    }

    // Log activity
    await logMemberActivity({
      admin,
      membershipId: registration.membership_id,
      clubId: event.club_id,
      eventType: "event_cancelled",
      metadata: { event_id: eventId, event_title: event.title },
    });

    return jsonOk({ cancelled: true });
  } catch (err) {
    console.error("[clubos/events/registrations] DELETE error:", err);
    return jsonError("Internal server error", 500);
  }
}
