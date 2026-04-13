import { NextRequest } from "next/server";
import type { Json } from "@/types/supabase";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonCreated,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import {
  createClubEventSchema,
  getEventsQuerySchema,
} from "@/lib/validations/clubos-operations";
import { logMemberActivity } from "@/lib/clubos/activity-logger";

/**
 * POST /api/clubos/events — Create a new club event
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...eventData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, club_id, P.OPS_MANAGE_EVENTS);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const parsed = createClubEventSchema.safeParse(eventData);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const admin = createAdminClient();
    const data = parsed.data;

    const { data: event, error } = await admin
      .from("club_events")
      .insert({
        club_id,
        title: data.title,
        description: data.description ?? null,
        type: data.type,
        location: data.location ?? null,
        starts_at: data.starts_at,
        ends_at: data.ends_at ?? null,
        all_day: data.all_day,
        rsvp_limit: data.rsvp_limit ?? null,
        rsvp_deadline: data.rsvp_deadline ?? null,
        waitlist_enabled: data.waitlist_enabled,
        guest_allowed: data.guest_allowed,
        guest_limit_per_member: data.guest_limit_per_member,
        status: data.status,
        vertical_context: (data.vertical_context ?? null) as Json,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[clubos/events] Create failed:", error);
      return jsonError("Failed to create event", 500);
    }

    return jsonCreated({ event });
  } catch (err) {
    console.error("[clubos/events] POST error:", err);
    return jsonError("Internal server error", 500);
  }
}

/**
 * GET /api/clubos/events?club_id=...&status=...&type=...&upcoming=...
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { searchParams } = req.nextUrl;
    const clubId = searchParams.get("club_id");
    if (!clubId) return jsonError("club_id is required", 400);

    // Any club member can view published events
    const admin = createAdminClient();

    const queryParsed = getEventsQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      upcoming: searchParams.get("upcoming") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!queryParsed.success) {
      return jsonError(queryParsed.error.issues[0].message, 400);
    }

    const { status, type, upcoming, page, limit } = queryParsed.data;
    const offset = (page - 1) * limit;

    // Check if staff to determine visibility
    const role = await requireClubRole(auth.user.id, clubId, P.OPS_MANAGE_EVENTS);
    const isStaff = role?.isStaff ?? false;

    let query = admin
      .from("club_events")
      .select("*", { count: "exact" })
      .eq("club_id", clubId)
      .order("starts_at", { ascending: true })
      .range(offset, offset + limit - 1);

    // Non-staff only see published events
    if (!isStaff) {
      query = query.eq("status", "published");
    } else if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (upcoming) {
      query = query.gte("starts_at", new Date().toISOString());
    }

    const { data: events, count, error } = await query;

    if (error) {
      console.error("[clubos/events] List failed:", error);
      return jsonError("Failed to list events", 500);
    }

    return jsonOk({
      events,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    console.error("[clubos/events] GET error:", err);
    return jsonError("Internal server error", 500);
  }
}
