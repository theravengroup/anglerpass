import { NextRequest } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { updateClubEventSchema } from "@/lib/validations/clubos-operations";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

/**
 * GET /api/clubos/events/[eventId] — Get event details
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { eventId } = await ctx.params;
    const admin = createUntypedAdminClient();

    const { data: event, error } = await admin
      .from("club_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !event) return jsonError("Event not found", 404);

    return jsonOk({ event });
  } catch (err) {
    console.error("[clubos/events] GET detail error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * PATCH /api/clubos/events/[eventId] — Update an event
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { eventId } = await ctx.params;
    const admin = createUntypedAdminClient();

    // Fetch existing event to get club_id
    const { data: existing } = await admin
      .from("club_events")
      .select("club_id")
      .eq("id", eventId)
      .single();

    if (!existing) return jsonError("Event not found", 404);

    const role = await requireClubRole(auth.user.id, existing.club_id, P.OPS_MANAGE_EVENTS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const body = await req.json();
    const parsed = updateClubEventSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.type !== undefined) updates.type = data.type;
    if (data.location !== undefined) updates.location = data.location;
    if (data.starts_at !== undefined) updates.starts_at = data.starts_at;
    if (data.ends_at !== undefined) updates.ends_at = data.ends_at;
    if (data.all_day !== undefined) updates.all_day = data.all_day;
    if (data.rsvp_limit !== undefined) updates.rsvp_limit = data.rsvp_limit;
    if (data.rsvp_deadline !== undefined) updates.rsvp_deadline = data.rsvp_deadline;
    if (data.waitlist_enabled !== undefined) updates.waitlist_enabled = data.waitlist_enabled;
    if (data.guest_allowed !== undefined) updates.guest_allowed = data.guest_allowed;
    if (data.guest_limit_per_member !== undefined) updates.guest_limit_per_member = data.guest_limit_per_member;
    if (data.status !== undefined) updates.status = data.status;
    if (data.cancelled_reason !== undefined) updates.cancelled_reason = data.cancelled_reason;
    if (data.vertical_context !== undefined) updates.vertical_context = data.vertical_context;

    // Auto-set timestamps for status transitions
    if (data.status === "cancelled") {
      updates.cancelled_reason = data.cancelled_reason ?? null;
    }

    const { data: event, error } = await admin
      .from("club_events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("[clubos/events] Update failed:", error);
      return jsonError("Failed to update event", 500);
    }

    return jsonOk({ event });
  } catch (err) {
    console.error("[clubos/events] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * DELETE /api/clubos/events/[eventId] — Delete an event (admin only)
 */
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { eventId } = await ctx.params;
    const admin = createUntypedAdminClient();

    const { data: existing } = await admin
      .from("club_events")
      .select("club_id")
      .eq("id", eventId)
      .single();

    if (!existing) return jsonError("Event not found", 404);

    const role = await requireClubRole(auth.user.id, existing.club_id, P.OPS_MANAGE_EVENTS);
    if (!role?.isOwner && !role?.allowed) return jsonError("Forbidden", 403);

    const { error } = await admin
      .from("club_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("[clubos/events] Delete failed:", error);
      return jsonError("Failed to delete event", 500);
    }

    return jsonOk({ deleted: true });
  } catch (err) {
    console.error("[clubos/events] DELETE error:", err);
    return jsonError("Internal server error", 500);
  }
}
