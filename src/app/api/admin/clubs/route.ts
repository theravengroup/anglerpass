import { requireAdmin, jsonError, jsonOk, parsePositiveInt } from "@/lib/api/helpers";

const PAGE_SIZE = 25;
const VALID_SORT_FIELDS = ["created_at", "name", "location", "subscription_tier"];

function escapeIlike(value: string): string {
  return value.replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// ─── GET: List / search clubs ────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { admin } = auth;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const page = parsePositiveInt(searchParams.get("page"), 1, 1000);
    const sortBy = searchParams.get("sort") ?? "created_at";
    const ascending = searchParams.get("dir") === "asc";

    // Build query
    let query = admin
      .from("clubs")
      .select("id, name, description, location, owner_id, subscription_tier, created_at", {
        count: "exact",
      });

    if (search) {
      const escaped = escapeIlike(search);
      query = query.or(`name.ilike.%${escaped}%,location.ilike.%${escaped}%`);
    }

    const sortField = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at";
    query = query.order(sortField, { ascending });

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data: clubs, count, error } = await query;

    if (error) {
      console.error("[admin/clubs] Query error:", error);
      return jsonError("Failed to fetch clubs", 500);
    }

    // Collect unique owner IDs for batch lookups
    const ownerIds = [
      ...new Set(
        (clubs ?? [])
          .map((c: { owner_id: string }) => c.owner_id)
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

    // Count active members per club
    const clubIds = (clubs ?? []).map((c: { id: string }) => c.id);
    let memberCountMap: Record<string, number> = {};
    if (clubIds.length > 0) {
      const { data: memberships } = await admin
        .from("club_memberships")
        .select("club_id")
        .in("club_id", clubIds)
        .eq("status", "active");

      memberCountMap = (memberships ?? []).reduce(
        (acc: Record<string, number>, m: { club_id: string }) => {
          acc[m.club_id] = (acc[m.club_id] ?? 0) + 1;
          return acc;
        },
        {}
      );
    }

    // Count approved properties per club
    let propertyCountMap: Record<string, number> = {};
    if (clubIds.length > 0) {
      const { data: access } = await admin
        .from("club_property_access")
        .select("club_id")
        .in("club_id", clubIds)
        .eq("status", "approved");

      propertyCountMap = (access ?? []).reduce(
        (acc: Record<string, number>, a: { club_id: string }) => {
          acc[a.club_id] = (acc[a.club_id] ?? 0) + 1;
          return acc;
        },
        {}
      );
    }

    const enriched = (clubs ?? []).map(
      (c: {
        id: string;
        name: string;
        description: string | null;
        location: string | null;
        owner_id: string;
        subscription_tier: string;
        created_at: string;
      }) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        location: c.location,
        owner_name: ownerProfileMap[c.owner_id] ?? null,
        owner_email: ownerEmailMap[c.owner_id] ?? null,
        member_count: memberCountMap[c.id] ?? 0,
        property_count: propertyCountMap[c.id] ?? 0,
        subscription_tier: c.subscription_tier,
        created_at: c.created_at,
      })
    );

    return jsonOk({
      clubs: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/clubs] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
