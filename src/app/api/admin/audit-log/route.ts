import { requireAdmin, jsonError, jsonOk, parsePositiveInt, escapeIlike } from "@/lib/api/helpers";

const PAGE_SIZE = 50;

// GET: Fetch audit log entries (admin only)
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { admin } = auth;
    const { searchParams } = new URL(request.url);

    const page = parsePositiveInt(searchParams.get("page"), 1, 1000);
    const entityType = searchParams.get("entity_type") ?? "";
    const actionFilter = searchParams.get("action") ?? "";

    let query = admin
      .from("audit_log")
      .select(
        "id, actor_id, action, entity_type, entity_id, old_data, new_data, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (actionFilter) {
      query = query.ilike("action", `%${escapeIlike(actionFilter)}%`);
    }

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data: entries, count, error } = await query;

    if (error) {
      console.error("[admin/audit-log] Query error:", error);
      return jsonError("Failed to fetch audit log", 500);
    }

    // Resolve actor display names
    const actorIds = [
      ...new Set(
        (entries ?? [])
          .map((e: { actor_id: string | null }) => e.actor_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    let actorMap: Record<string, string> = {};
    if (actorIds.length > 0) {
      const { data: actors } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", actorIds);

      actorMap = (actors ?? []).reduce(
        (
          acc: Record<string, string>,
          a: { id: string; display_name: string | null }
        ) => {
          acc[a.id] = a.display_name ?? "Unknown";
          return acc;
        },
        {}
      );
    }

    const enriched = (entries ?? []).map((e) => ({
        ...e,
        actor_name: e.actor_id ? actorMap[e.actor_id] ?? "Unknown" : "System",
      })
    );

    return jsonOk({
      entries: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/audit-log] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
