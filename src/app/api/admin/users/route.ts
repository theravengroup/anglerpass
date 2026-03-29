import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const VALID_ROLES = ["landowner", "club_admin", "angler", "admin"];
const PAGE_SIZE = 25;

// GET: List/search users (admin only)
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
    const search = searchParams.get("search")?.trim() ?? "";
    const role = searchParams.get("role") ?? "";
    const status = searchParams.get("status") ?? ""; // "active" | "suspended" | ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const sortBy = searchParams.get("sort") ?? "created_at";
    const sortDir = searchParams.get("dir") === "asc" ? true : false;

    // Build query
    let query = admin
      .from("profiles")
      .select("id, display_name, role, created_at, updated_at, suspended_at, suspended_reason", {
        count: "exact",
      });

    // Role filter
    if (role && VALID_ROLES.includes(role)) {
      query = query.eq("role", role);
    }

    // Status filter
    if (status === "active") {
      query = query.is("suspended_at", null);
    } else if (status === "suspended") {
      query = query.not("suspended_at", "is", null);
    }

    // Search by display_name (ilike)
    if (search) {
      query = query.ilike("display_name", `%${search}%`);
    }

    // Sort
    const validSorts = ["created_at", "display_name", "role", "updated_at"];
    const sortField = validSorts.includes(sortBy) ? sortBy : "created_at";
    query = query.order(sortField, { ascending: sortDir });

    // Paginate
    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data: users, count, error } = await query;

    if (error) {
      console.error("[admin/users] Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Fetch emails from auth for the returned users
    const userIds = (users ?? []).map((u: { id: string }) => u.id);
    const emailMap: Record<string, string> = {};

    if (userIds.length > 0) {
      // Use admin auth to list users
      for (const uid of userIds) {
        const { data: authData } = await admin.auth.admin.getUserById(uid);
        if (authData?.user?.email) {
          emailMap[uid] = authData.user.email;
        }
      }
    }

    const enriched = (users ?? []).map((u: {
      id: string;
      display_name: string | null;
      role: string;
      created_at: string;
      updated_at: string;
      suspended_at: string | null;
      suspended_reason: string | null;
    }) => ({
      ...u,
      email: emailMap[u.id] ?? null,
    }));

    return NextResponse.json({
      users: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/users] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update a user's role or suspension status
export async function PATCH(request: Request) {
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
    const { data: actorProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (actorProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, action, role, reason } = body;

    if (!user_id || typeof user_id !== "string") {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    // Prevent self-modification for dangerous actions
    if (user_id === user.id && (action === "suspend" || action === "change_role")) {
      return NextResponse.json(
        { error: "Cannot modify your own account" },
        { status: 400 }
      );
    }

    // Get target user
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("id, role, display_name, suspended_at")
      .eq("id", user_id)
      .single();

    if (!targetProfile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    switch (action) {
      case "change_role": {
        if (!role || !VALID_ROLES.includes(role)) {
          return NextResponse.json(
            { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
            { status: 400 }
          );
        }

        const oldRole = targetProfile.role;
        const { error: updateError } = await admin
          .from("profiles")
          .update({ role })
          .eq("id", user_id);

        if (updateError) {
          console.error("[admin/users] Role update error:", updateError);
          return NextResponse.json(
            { error: "Failed to update role" },
            { status: 500 }
          );
        }

        // Audit log
        await admin.from("audit_log").insert({
          actor_id: user.id,
          action: "user.role_changed",
          entity_type: "profile",
          entity_id: user_id,
          old_data: { role: oldRole },
          new_data: { role },
        });

        return NextResponse.json({ success: true, role });
      }

      case "suspend": {
        if (targetProfile.suspended_at) {
          return NextResponse.json(
            { error: "User is already suspended" },
            { status: 400 }
          );
        }

        const { error: updateError } = await admin
          .from("profiles")
          .update({
            suspended_at: new Date().toISOString(),
            suspended_reason: reason ?? "Suspended by admin",
          })
          .eq("id", user_id);

        if (updateError) {
          console.error("[admin/users] Suspend error:", updateError);
          return NextResponse.json(
            { error: "Failed to suspend user" },
            { status: 500 }
          );
        }

        // Audit log
        await admin.from("audit_log").insert({
          actor_id: user.id,
          action: "user.suspended",
          entity_type: "profile",
          entity_id: user_id,
          old_data: { suspended_at: null },
          new_data: { suspended_at: new Date().toISOString(), reason: reason ?? "Suspended by admin" },
        });

        return NextResponse.json({ success: true, suspended: true });
      }

      case "unsuspend": {
        if (!targetProfile.suspended_at) {
          return NextResponse.json(
            { error: "User is not suspended" },
            { status: 400 }
          );
        }

        const { error: updateError } = await admin
          .from("profiles")
          .update({
            suspended_at: null,
            suspended_reason: null,
          })
          .eq("id", user_id);

        if (updateError) {
          console.error("[admin/users] Unsuspend error:", updateError);
          return NextResponse.json(
            { error: "Failed to unsuspend user" },
            { status: 500 }
          );
        }

        // Audit log
        await admin.from("audit_log").insert({
          actor_id: user.id,
          action: "user.unsuspended",
          entity_type: "profile",
          entity_id: user_id,
          old_data: { suspended_at: targetProfile.suspended_at },
          new_data: { suspended_at: null },
        });

        return NextResponse.json({ success: true, suspended: false });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be: change_role, suspend, or unsuspend" },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[admin/users] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
