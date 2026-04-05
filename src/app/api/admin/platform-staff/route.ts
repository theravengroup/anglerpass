import { requireAdmin, jsonOk, jsonError, jsonCreated } from "@/lib/api/helpers";
import { platformStaffAssignSchema, platformStaffRevokeSchema } from "@/lib/validations/permissions";
import { auditLog, AuditAction, P, authorize } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/platform-staff
 *
 * List all platform staff members with their roles.
 * Only accessible to admins.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  const { data: staff, error } = await createAdminClient().from("platform_staff")
    .select("id, user_id, role, granted_by, granted_at, revoked_at")
    .order("granted_at", { ascending: false });

  if (error) {
    console.error("[platform-staff] Fetch error:", error);
    return jsonError("Failed to fetch staff", 500);
  }

  // Enrich with user names and emails
  const staffList = staff ?? [];
  const userIds = [...new Set(staffList.flatMap((s) => [s.user_id, s.granted_by].filter(Boolean)))] as string[];

  const { data: profiles } = userIds.length > 0
    ? await auth.admin.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.display_name])
  );

  // Get emails from auth
  const emailMap = new Map<string, string>();
  for (const uid of userIds) {
    try {
      const { data } = await auth.admin.auth.admin.getUserById(uid);
      if (data?.user?.email) emailMap.set(uid, data.user.email);
    } catch {
      // skip
    }
  }

  const enriched = staffList.map((s) => ({
    ...s,
    user_name: profileMap.get(s.user_id) ?? "Unknown",
    user_email: emailMap.get(s.user_id) ?? null,
    granted_by_name: s.granted_by ? profileMap.get(s.granted_by) ?? null : null,
  }));

  return jsonOk({ staff: enriched });
}

/**
 * POST /api/admin/platform-staff
 *
 * Assign a platform staff role to a user.
 * Only super_admin can assign platform roles.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  // Check super_admin permission
  const authResult = await authorize({
    permission: P.PROFILE_CHANGE_ROLE,
    userId: auth.user.id,
  });

  if (!authResult.allowed) {
    return jsonError("Only super admins can assign platform staff roles", 403);
  }

  const body = await request.json();
  const result = platformStaffAssignSchema.safeParse(body);

  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { user_id, role } = result.data;

  // Verify user exists
  const { data: profile } = await auth.admin
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user_id)
    .single();

  if (!profile) {
    return jsonError("User not found", 404);
  }

  // Check for existing active staff record
  const { data: existing } = await createAdminClient().from("platform_staff")
    .select("id, role, revoked_at")
    .eq("user_id", user_id)
    .single();

  if (existing && !existing.revoked_at) {
    // Update role in place
    const oldRole = existing.role;
    const { data: updated, error } = await createAdminClient().from("platform_staff")
      .update({ role })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("[platform-staff] Update error:", error);
      return jsonError("Failed to update staff role", 500);
    }

    auditLog({
      actor_id: auth.user.id,
      action: AuditAction.PLATFORM_STAFF_CHANGED,
      entity_type: "platform_staff",
      entity_id: existing.id,
      old_data: { role: oldRole },
      new_data: { role },
      scope: "platform",
    }).catch((err) => console.error("[platform-staff] Audit error:", err));

    return jsonOk({ staff: updated });
  }

  // Create new staff record (or reactivate revoked)
  if (existing?.revoked_at) {
    const { data: reactivated, error } = await createAdminClient().from("platform_staff")
      .update({
        role,
        granted_by: auth.user.id,
        granted_at: new Date().toISOString(),
        revoked_at: null,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      console.error("[platform-staff] Reactivate error:", error);
      return jsonError("Failed to reactivate staff", 500);
    }

    auditLog({
      actor_id: auth.user.id,
      action: AuditAction.PLATFORM_STAFF_GRANTED,
      entity_type: "platform_staff",
      entity_id: existing.id,
      new_data: { role, user_id, reactivated: true },
      scope: "platform",
    }).catch((err) => console.error("[platform-staff] Audit error:", err));

    return jsonOk({ staff: reactivated });
  }

  const { data: newStaff, error } = await createAdminClient().from("platform_staff")
    .insert({
      user_id,
      role,
      granted_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("[platform-staff] Insert error:", error);
    return jsonError("Failed to create staff record", 500);
  }

  // Also ensure user has admin role in profiles for middleware access
  if (profile.role !== "admin") {
    await auth.admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user_id);

    auditLog({
      actor_id: auth.user.id,
      action: AuditAction.USER_ROLE_CHANGED,
      entity_type: "profile",
      entity_id: user_id,
      old_data: { role: profile.role },
      new_data: { role: "admin" },
      scope: "platform",
      reason: `Promoted to platform staff (${role})`,
    }).catch((err) => console.error("[platform-staff] Audit error:", err));
  }

  auditLog({
    actor_id: auth.user.id,
    action: AuditAction.PLATFORM_STAFF_GRANTED,
    entity_type: "platform_staff",
    entity_id: newStaff.id,
    new_data: { role, user_id },
    scope: "platform",
  }).catch((err) => console.error("[platform-staff] Audit error:", err));

  return jsonCreated({ staff: newStaff });
}

/**
 * DELETE /api/admin/platform-staff
 *
 * Revoke a platform staff role. Soft-delete (sets revoked_at).
 * Only super_admin can revoke.
 */
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Forbidden", 403);

  const authResult = await authorize({
    permission: P.PROFILE_CHANGE_ROLE,
    userId: auth.user.id,
  });

  if (!authResult.allowed) {
    return jsonError("Only super admins can revoke platform staff roles", 403);
  }

  const body = await request.json();
  const result = platformStaffRevokeSchema.safeParse(body);

  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { user_id, reason } = result.data;

  // Prevent self-revocation
  if (user_id === auth.user.id) {
    return jsonError("You cannot revoke your own platform staff role", 400);
  }

  const { data: existing } = await createAdminClient().from("platform_staff")
    .select("id, role")
    .eq("user_id", user_id)
    .is("revoked_at", null)
    .single();

  if (!existing) {
    return jsonError("No active platform staff record found", 404);
  }

  const { error } = await createAdminClient().from("platform_staff")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", existing.id);

  if (error) {
    console.error("[platform-staff] Revoke error:", error);
    return jsonError("Failed to revoke staff role", 500);
  }

  auditLog({
    actor_id: auth.user.id,
    action: AuditAction.PLATFORM_STAFF_REVOKED,
    entity_type: "platform_staff",
    entity_id: existing.id,
    old_data: { role: existing.role, user_id },
    new_data: { revoked_at: new Date().toISOString() },
    scope: "platform",
    reason,
  }).catch((err) => console.error("[platform-staff] Audit error:", err));

  return jsonOk({ success: true });
}
