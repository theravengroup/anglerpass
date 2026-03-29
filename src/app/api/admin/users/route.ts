import { requireAdmin, jsonError, jsonSuccess, parsePositiveInt } from "@/lib/api/helpers";
import { VALID_ROLES } from "@/lib/constants/status";

const PAGE_SIZE = 25;
const VALID_SORT_FIELDS = ["created_at", "display_name", "role", "updated_at"];

// ─── GET: List / search users ───────────────────────────────────────

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { admin } = auth;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const role = searchParams.get("role") ?? "";
    const status = searchParams.get("status") ?? "";
    const page = parsePositiveInt(searchParams.get("page"), 1, 1000);
    const sortBy = searchParams.get("sort") ?? "created_at";
    const ascending = searchParams.get("dir") === "asc";

    // Build query
    let query = admin
      .from("profiles")
      .select(
        "id, display_name, role, created_at, updated_at, suspended_at, suspended_reason",
        { count: "exact" }
      );

    if (role && (VALID_ROLES as readonly string[]).includes(role)) {
      query = query.eq("role", role);
    }

    if (status === "active") {
      query = query.is("suspended_at", null);
    } else if (status === "suspended") {
      query = query.not("suspended_at", "is", null);
    }

    if (search) {
      query = query.ilike("display_name", `%${search}%`);
    }

    const sortField = VALID_SORT_FIELDS.includes(sortBy) ? sortBy : "created_at";
    query = query.order(sortField, { ascending });

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data: users, count, error } = await query;

    if (error) {
      console.error("[admin/users] Query error:", error);
      return jsonError("Failed to fetch users", 500);
    }

    // Batch-resolve emails from auth (sequential to avoid rate limits)
    const emailMap: Record<string, string> = {};
    for (const u of users ?? []) {
      const uid = (u as { id: string }).id;
      const { data: authData } = await admin.auth.admin.getUserById(uid);
      if (authData?.user?.email) {
        emailMap[uid] = authData.user.email;
      }
    }

    const enriched = (users ?? []).map(
      (u: {
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
      })
    );

    return jsonSuccess({
      users: enriched,
      total: count ?? 0,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/users] Error:", err);
    return jsonError("Internal server error", 500);
  }
}

// ─── PATCH: Change role or suspend / unsuspend ──────────────────────

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth) return jsonError("Forbidden", 403);

    const { user, admin } = auth;
    const body = await request.json();
    const { user_id, action, role, reason } = body;

    if (!user_id || typeof user_id !== "string") {
      return jsonError("user_id is required", 400);
    }

    // Prevent self-modification
    if (user_id === user.id && (action === "suspend" || action === "change_role")) {
      return jsonError("Cannot modify your own account", 400);
    }

    // Fetch target
    const { data: target } = await admin
      .from("profiles")
      .select("id, role, display_name, suspended_at")
      .eq("id", user_id)
      .single();

    if (!target) return jsonError("User not found", 404);

    switch (action) {
      case "change_role": {
        if (!role || !(VALID_ROLES as readonly string[]).includes(role)) {
          return jsonError(
            `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
            400
          );
        }

        const oldRole = target.role;
        const { error: updateErr } = await admin
          .from("profiles")
          .update({ role })
          .eq("id", user_id);

        if (updateErr) {
          console.error("[admin/users] Role update error:", updateErr);
          return jsonError("Failed to update role", 500);
        }

        await admin.from("audit_log").insert({
          actor_id: user.id,
          action: "user.role_changed",
          entity_type: "profile",
          entity_id: user_id,
          old_data: { role: oldRole },
          new_data: { role },
        });

        return jsonSuccess({ success: true, role });
      }

      case "suspend": {
        if (target.suspended_at) {
          return jsonError("User is already suspended", 400);
        }

        const now = new Date().toISOString();
        const suspendReason = reason ?? "Suspended by admin";

        const { error: updateErr } = await admin
          .from("profiles")
          .update({ suspended_at: now, suspended_reason: suspendReason })
          .eq("id", user_id);

        if (updateErr) {
          console.error("[admin/users] Suspend error:", updateErr);
          return jsonError("Failed to suspend user", 500);
        }

        await admin.from("audit_log").insert({
          actor_id: user.id,
          action: "user.suspended",
          entity_type: "profile",
          entity_id: user_id,
          old_data: { suspended_at: null },
          new_data: { suspended_at: now, reason: suspendReason },
        });

        return jsonSuccess({ success: true, suspended: true });
      }

      case "unsuspend": {
        if (!target.suspended_at) {
          return jsonError("User is not suspended", 400);
        }

        const { error: updateErr } = await admin
          .from("profiles")
          .update({ suspended_at: null, suspended_reason: null })
          .eq("id", user_id);

        if (updateErr) {
          console.error("[admin/users] Unsuspend error:", updateErr);
          return jsonError("Failed to unsuspend user", 500);
        }

        await admin.from("audit_log").insert({
          actor_id: user.id,
          action: "user.unsuspended",
          entity_type: "profile",
          entity_id: user_id,
          old_data: { suspended_at: target.suspended_at },
          new_data: { suspended_at: null },
        });

        return jsonSuccess({ success: true, suspended: false });
      }

      default:
        return jsonError(
          "Invalid action. Must be: change_role, suspend, or unsuspend",
          400
        );
    }
  } catch (err) {
    console.error("[admin/users] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
