import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth, escapeIlike } from "@/lib/api/helpers";

/**
 * GET /api/admin/crm/contacts
 *
 * List CRM contacts (users + leads) with engagement stats.
 * Query params: search, limit, offset, tag
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();
  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const tag = url.searchParams.get("tag") ?? "";

  try {
    // Query profiles (no email column — we'll get email from auth)
    let query = admin
      .from("profiles")
      .select("id, display_name, role, created_at, phone_number, sms_opt_in", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      // Search by display_name only (email search requires auth lookup)
      query = query.ilike("display_name", `%${escapeIlike(search)}%`);
    }

    const { data: profiles, count, error } = await query;

    if (error) {
      console.error("[crm/contacts] Query error:", error);
      return jsonError("Failed to fetch contacts", 500);
    }

    const userIds = (profiles ?? []).map(
      (p) => (p as unknown as Record<string, unknown>).id as string
    );

    // Get emails from auth in bulk
    const emailMap = new Map<string, string>();
    for (const uid of userIds) {
      const {
        data: { user },
      } = await admin.auth.admin.getUserById(uid);
      if (user?.email) {
        emailMap.set(uid, user.email);
      }
    }

    // If searching by email, filter after resolving
    let filteredIds = userIds;
    if (search && search.includes("@")) {
      const searchLower = search.toLowerCase();
      filteredIds = userIds.filter((uid) =>
        emailMap.get(uid)?.toLowerCase().includes(searchLower)
      );
    }

    // Enrich with engagement stats in bulk
    const [sendStatsRes, openStatsRes, tagDataRes, convDataRes] =
      await Promise.all([
        admin.from("campaign_sends")
          .select("recipient_id")
          .in("recipient_id", filteredIds)
          .eq("status", "sent")
          .returns<{ recipient_id: string }[]>(),
        admin.from("campaign_sends")
          .select("recipient_id")
          .in("recipient_id", filteredIds)
          .not("opened_at", "is", null)
          .returns<{ recipient_id: string }[]>(),
        admin.from("crm_contact_tags")
          .select("user_id, tag")
          .in("user_id", filteredIds)
          .returns<{ user_id: string; tag: string }[]>(),
        admin.from("crm_conversions")
          .select("user_id")
          .in("user_id", filteredIds)
          .returns<{ user_id: string }[]>(),
      ]);

    const sendCounts = new Map<string, number>();
    for (const s of sendStatsRes.data ?? []) {
      sendCounts.set(s.recipient_id, (sendCounts.get(s.recipient_id) ?? 0) + 1);
    }

    const openCounts = new Map<string, number>();
    for (const o of openStatsRes.data ?? []) {
      openCounts.set(o.recipient_id, (openCounts.get(o.recipient_id) ?? 0) + 1);
    }

    const tagsByUser = new Map<string, string[]>();
    for (const t of tagDataRes.data ?? []) {
      const existing = tagsByUser.get(t.user_id) ?? [];
      existing.push(t.tag);
      tagsByUser.set(t.user_id, existing);
    }

    const convCounts = new Map<string, number>();
    for (const c of convDataRes.data ?? []) {
      convCounts.set(c.user_id, (convCounts.get(c.user_id) ?? 0) + 1);
    }

    const enriched = (profiles ?? [])
      .filter((p) =>
        filteredIds.includes(
          (p as unknown as Record<string, unknown>).id as string
        )
      )
      .map((p) => {
        const profile = p as unknown as Record<string, unknown>;
        const userId = profile.id as string;
        return {
          id: userId,
          email: emailMap.get(userId) ?? "",
          display_name: profile.display_name,
          role: profile.role,
          phone_number: profile.phone_number,
          sms_opt_in: profile.sms_opt_in,
          created_at: profile.created_at,
          emails_sent: sendCounts.get(userId) ?? 0,
          emails_opened: openCounts.get(userId) ?? 0,
          conversions: convCounts.get(userId) ?? 0,
          tags: tagsByUser.get(userId) ?? [],
        };
      });

    // Filter by tag if specified
    const filtered = tag
      ? enriched.filter((c) => c.tags.includes(tag))
      : enriched;

    return jsonOk({
      contacts: filtered,
      total: tag ? filtered.length : (count ?? 0),
    });
  } catch (err) {
    console.error("[crm/contacts] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return jsonError(`Failed to fetch contacts: ${msg}`, 500);
  }
}
