import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
  isDuplicateError,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { createRegistrationSchema } from "@/lib/validations/clubos-operations";
import { logMemberActivity } from "@/lib/clubos/activity-logger";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

/**
 * POST /api/clubos/events/[eventId]/registrations — Register for an event
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { eventId } = await ctx.params;
    const admin = createUntypedAdminClient();

    // Get event details
    const { data: event } = await admin
      .from("club_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!event) return jsonError("Event not found", 404);
    if (event.status !== "published") return jsonError("Event is not open for registration", 400);

    // Check RSVP deadline
    if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
      return jsonError("Registration deadline has passed", 400);
    }

    const body = await req.json();
    const parsed = createRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const data = parsed.data;

    // Determine membership_id — use provided or look up from auth user
    let membershipId: string = data.membership_id ?? "";
    if (!membershipId) {
      const { data: membership } = await admin
        .from("club_memberships")
        .select("id")
        .eq("club_id", event.club_id)
        .eq("user_id", auth.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership) return jsonError("Active club membership required", 403);
      membershipId = membership.id;
    } else {
      // Staff registering on behalf — verify permission
      const role = await requireClubRole(auth.user.id, event.club_id, P.OPS_MANAGE_EVENTS);
      if (!role?.isStaff) return jsonError("Forbidden", 403);
    }

    // Check guest limit
    if (event.guest_allowed && data.guest_count > event.guest_limit_per_member) {
      return jsonError(`Maximum ${event.guest_limit_per_member} guests allowed`, 400);
    }
    if (!event.guest_allowed && data.guest_count > 0) {
      return jsonError("Guests are not allowed for this event", 400);
    }

    // Determine if waitlisted or registered
    const spotsNeeded = 1 + data.guest_count;
    const atCapacity = event.rsvp_limit && event.registered_count + spotsNeeded > event.rsvp_limit;
    let status: string;
    let waitlistPosition: number | null = null;

    if (atCapacity) {
      if (!event.waitlist_enabled) {
        return jsonError("Event is at capacity", 400);
      }
      status = "waitlisted";
      waitlistPosition = event.waitlist_count + 1;
    } else {
      status = "registered";
    }

    const { data: registration, error } = await admin
      .from("club_event_registrations")
      .insert({
        event_id: eventId,
        membership_id: membershipId,
        status,
        waitlist_position: waitlistPosition,
        guest_count: data.guest_count,
        notes: data.notes ?? null,
      })
      .select()
      .single();

    if (isDuplicateError(error)) {
      return jsonError("Already registered for this event", 409);
    }

    if (error) {
      console.error("[clubos/events/registrations] Create failed:", error);
      return jsonError("Failed to register", 500);
    }

    // Update event counts
    if (status === "registered") {
      try {
        await admin.rpc("increment_field", {
          table_name: "club_events",
          row_id: eventId,
          field_name: "registered_count",
          amount: spotsNeeded,
        });
      } catch {
        // Fallback: direct update
        await admin
          .from("club_events")
          .update({ registered_count: event.registered_count + spotsNeeded })
          .eq("id", eventId);
      }
    } else {
      await admin
        .from("club_events")
        .update({ waitlist_count: event.waitlist_count + 1 })
        .eq("id", eventId);
    }

    // Log activity
    await logMemberActivity({
      admin,
      membershipId,
      clubId: event.club_id,
      eventType: status === "registered" ? "event_registered" : "waitlist_joined",
      metadata: { event_id: eventId, event_title: event.title, guest_count: data.guest_count },
    });

    return jsonCreated({ registration });
  } catch (err) {
    console.error("[clubos/events/registrations] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/events/[eventId]/registrations — List registrations
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { eventId } = await ctx.params;
    const admin = createUntypedAdminClient();

    // Get event to verify club access
    const { data: event } = await admin
      .from("club_events")
      .select("club_id")
      .eq("id", eventId)
      .single();

    if (!event) return jsonError("Event not found", 404);

    const role = await requireClubRole(auth.user.id, event.club_id, P.OPS_MANAGE_EVENTS);
    if (!role?.isStaff) return jsonError("Forbidden", 403);

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");

    let query = admin
      .from("club_event_registrations")
      .select(`
        *,
        membership:club_memberships(
          id,
          user_id,
          profile:profiles(full_name, email)
        )
      `)
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: registrations, error } = await query;

    if (error) {
      console.error("[clubos/events/registrations] List failed:", error);
      return jsonError("Failed to list registrations", 500);
    }

    return jsonOk({ registrations });
  } catch (err) {
    console.error("[clubos/events/registrations] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
