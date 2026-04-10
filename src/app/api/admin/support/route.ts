import "server-only";

import { z } from "zod";
import {
  requireAdmin,
  jsonOk,
  jsonError,
  parsePositiveInt,
  escapeIlike,
} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  supportTicketUpdateSchema,
  SUPPORT_STATUSES,
} from "@/lib/validations/support-ticket";

/**
 * GET /api/admin/support
 * List all support tickets with filters and pagination.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  const { searchParams } = new URL(request.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(searchParams.get("page_size"), 20, 100);
  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";

  const untyped = createAdminClient();

  let query = untyped
    .from("support_tickets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status && SUPPORT_STATUSES.includes(status as typeof SUPPORT_STATUSES[number])) {
    query = query.eq("status", status);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.ilike("subject", `%${escapeIlike(search)}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: tickets, error, count } = await query;

  if (error) {
    return jsonError(`Failed to fetch tickets: ${error.message}`, 500);
  }

  // Resolve user display names
  const userIds = [...new Set((tickets ?? []).map((t) => t.user_id).filter(Boolean))];
  let profileMap = new Map<string, { display_name: string | null; email: string | null }>();

  const admin = createAdminClient();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profiles) {
      for (const p of profiles) {
        profileMap.set(p.id, {
          display_name: p.display_name,
          email: null,
        });
      }
    }

    // Get emails from auth
    try {
      const { data: authData } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (authData?.users) {
        for (const u of authData.users) {
          const existing = profileMap.get(u.id);
          if (existing) {
            existing.email = u.email ?? null;
          }
        }
      }
    } catch {
      // Email lookup is best-effort
    }
  }

  const enrichedTickets = (tickets ?? []).map((t) => {
    const profile = profileMap.get(t.user_id);
    return {
      ...t,
      user_display_name: profile?.display_name ?? null,
      user_email: profile?.email ?? null,
    };
  });

  const total = count ?? 0;

  return jsonOk({
    tickets: enrichedTickets,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  });
}

const patchSchema = z.object({
  ticket_id: z.string().uuid(),
  updates: supportTicketUpdateSchema,
});

/**
 * PATCH /api/admin/support
 * Update a support ticket (status, priority, assigned_to, admin_notes).
 */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request", 400);
  }

  const { ticket_id, updates } = parsed.data;
  const db = createAdminClient();

  // Build update object — only include defined fields
  const updatePayload: Record<string, unknown> = {};
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.priority !== undefined) updatePayload.priority = updates.priority;
  if (updates.assigned_to !== undefined) updatePayload.assigned_to = updates.assigned_to;
  if (updates.admin_notes !== undefined) updatePayload.admin_notes = updates.admin_notes;

  if (Object.keys(updatePayload).length === 0) {
    return jsonError("No updates provided", 400);
  }

  const { data: ticket, error } = await db
    .from("support_tickets")
    .update(updatePayload)
    .eq("id", ticket_id)
    .select("*")
    .single();

  if (error) {
    return jsonError(`Failed to update ticket: ${error.message}`, 500);
  }

  return jsonOk({ ticket });
}
