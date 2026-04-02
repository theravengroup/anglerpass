import { requireAdmin, jsonError, jsonSuccess, parsePositiveInt } from "@/lib/api/helpers";

const PAGE_SIZE = 25;
const VALID_SORT_FIELDS = ["created_at", "updated_at", "name", "status"];
const VALID_STATUSES = ["draft", "pending_review", "published", "archived"];

function escapeIlike(value: string): string {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// ─── GET: List / search properties ───────────────────────────────────

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { admin } = auth;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "";
    const page = parsePositiveInt(searchParams.get("page"), 1, 1000);
    const sortBy = searchParams.get("sort") ?? "created_at";
    const ascending = searchParams.get("dir") === "asc";

    // Build query
    let query = admin
      .from("properties")
      .select(
        "id, name, location_description, status, water_type, owner_id, created_at, updated_at",
        { count: "exact" }
      );

    if (status && VALID_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    if (search) {
      const escaped = escapeIlike(search);
      query = query.or(
        `name.ilike.%${escaped}%,location_description.ilike.%${escaped}%`
      );
    }

    const sortField = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at";
    query = query.order(sortField, { ascending });

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data: properties, count, error } = await query;

    if (error) {
      console.error("[admin/properties] Query error:", error);
      return jsonError("Failed to fetch properties", 500);
    }

    // Collect unique owner IDs
    const ownerIds = [
      ...new Set(
        (properties ?? [])
          .map((p: { owner_id: string }) => p.owner_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    // Batch-resolve owner display names from profiles
    let ownerProfileMap: Record<string, string> = {};
    if (ownerIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds);

      ownerProfileMap = (profiles ?? []).reduce(
        (acc: Record<string, string>, p: { id: string; display_name: string | null }) => {
          acc[p.id] = p.display_name ?? "Unknown";
          return acc;
        },
        {}
      );
    }

    // Batch-resolve owner emails from auth
    const ownerEmailMap: Record<string, string> = {};
    for (const ownerId of ownerIds) {
      const { data: authData } = await admin.auth.admin.getUserById(ownerId);
      if (authData?.user?.email) {
        ownerEmailMap[ownerId] = authData.user.email;
      }
    }

    const enriched = (properties ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        location_description: p.location_description,
        status: p.status,
        water_type: p.water_type,
        owner_name: ownerProfileMap[p.owner_id] ?? null,
        owner_email: ownerEmailMap[p.owner_id] ?? null,
        created_at: p.created_at,
        updated_at: p.updated_at,
      })
    );

    return jsonSuccess({
      properties: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/properties] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
