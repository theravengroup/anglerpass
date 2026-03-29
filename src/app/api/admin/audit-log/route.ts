import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 50;

// GET: Fetch audit log entries (admin only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify admin role
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const entityType = searchParams.get("entity_type") ?? "";
    const actionFilter = searchParams.get("action") ?? "";

    let query = admin
      .from("audit_log")
      .select("id, actor_id, action, entity_type, entity_id, old_data, new_data, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false });

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (actionFilter) {
      query = query.ilike("action", `%${actionFilter}%`);
    }

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data: entries, count, error } = await query;

    if (error) {
      console.error("[admin/audit-log] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit log" },
        { status: 500 }
      );
    }

    // Resolve actor names
    const actorIds = [
      ...new Set(
        (entries ?? [])
          .map((e: { actor_id: string | null }) => e.actor_id)
          .filter(Boolean) as string[]
      ),
    ];

    let actorMap: Record<string, string> = {};
    if (actorIds.length > 0) {
      const { data: actors } = await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", actorIds);

      actorMap = (actors ?? []).reduce(
        (acc: Record<string, string>, a: { id: string; display_name: string | null }) => {
          acc[a.id] = a.display_name ?? "Unknown";
          return acc;
        },
        {} as Record<string, string>
      );
    }

    const enriched = (entries ?? []).map((e: {
      id: number;
      actor_id: string | null;
      action: string;
      entity_type: string;
      entity_id: string | null;
      old_data: unknown;
      new_data: unknown;
      created_at: string;
    }) => ({
      ...e,
      actor_name: e.actor_id ? actorMap[e.actor_id] ?? "Unknown" : "System",
    }));

    return NextResponse.json({
      entries: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/audit-log] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
