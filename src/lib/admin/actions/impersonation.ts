"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog, AuditAction } from "@/lib/permissions/audit";

const IMPERSONATION_COOKIE = "ap_impersonation_token";
const MAX_DURATION_HOURS = 4;

/**
 * Start impersonating a user. Only callable by platform admins.
 *
 * Sets an httpOnly cookie with a session token, then redirects the admin
 * to the target user's dashboard. The impersonation banner picks up the
 * cookie and shows it across all pages.
 */
export async function startImpersonation(formData: FormData) {
  const targetUserId = formData.get("targetUserId") as string;
  if (!targetUserId) throw new Error("Missing target user ID");

  // Verify the caller is an admin
  const admin = createAdminClient();
  const {
    data: { user },
  } = await admin.auth.getUser();

  // Note: In server actions, the admin client's getUser() may not have the
  // current user. We use the Supabase server client instead.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const { data: adminProfile } = await admin
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", currentUser.id)
    .single();

  if (!adminProfile || adminProfile.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  // Fetch the target user
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, role, display_name")
    .eq("id", targetUserId)
    .single();

  if (!targetProfile) {
    throw new Error("Target user not found");
  }

  if (targetProfile.role === "admin") {
    throw new Error("Cannot impersonate admin users");
  }

  // Get target email
  const { data: authUser } = await admin.auth.admin.getUserById(targetUserId);
  const targetEmail = authUser?.user?.email ?? "unknown";
  const adminEmail =
    (await admin.auth.admin.getUserById(currentUser.id)).data?.user?.email ??
    "unknown";

  // Generate session token
  const sessionToken = crypto.randomUUID();

  // Insert impersonation session
  const db = createAdminClient();
  const { error: insertError } = await db
    .from("impersonation_sessions")
    .insert({
      admin_id: currentUser.id,
      admin_email: adminEmail,
      target_user_id: targetUserId,
      target_user_email: targetEmail,
      target_user_name: targetProfile.display_name,
      target_role: targetProfile.role,
      session_token: sessionToken,
    });

  if (insertError) {
    console.error("[impersonation] Failed to create session:", insertError);
    throw new Error("Failed to start impersonation session");
  }

  // Set httpOnly cookie
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_DURATION_HOURS * 60 * 60,
  });

  // Audit log
  await auditLog({
    actor_id: currentUser.id,
    action: AuditAction.IMPERSONATION_STARTED,
    entity_type: "profile",
    entity_id: targetUserId,
    new_data: {
      target_email: targetEmail,
      target_role: targetProfile.role,
      target_name: targetProfile.display_name,
    },
    scope: "platform",
    reason: `Admin ${adminEmail} started impersonating ${targetEmail}`,
  });

  redirect("/dashboard");
}

/**
 * End an active impersonation session. Clears the cookie and redirects
 * back to the admin panel.
 */
export async function endImpersonation() {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (!token) {
    redirect("/admin/users");
  }

  const db = createAdminClient();

  // Find the active session
  const { data: session } = await db
    .from("impersonation_sessions")
    .select("*")
    .eq("session_token", token)
    .eq("is_active", true)
    .single();

  if (session) {
    // End the session
    await db
      .from("impersonation_sessions")
      .update({
        ended_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", session.id);

    // Audit log
    await auditLog({
      actor_id: session.admin_id,
      action: AuditAction.IMPERSONATION_ENDED,
      entity_type: "profile",
      entity_id: session.target_user_id,
      new_data: {
        target_email: session.target_user_email,
        duration_minutes: Math.round(
          (Date.now() - new Date(session.started_at).getTime()) / 60000
        ),
      },
      scope: "platform",
      reason: `Admin ${session.admin_email} ended impersonation of ${session.target_user_email}`,
    });
  }

  // Clear the cookie
  cookieStore.delete(IMPERSONATION_COOKIE);

  // Redirect back to admin
  const targetId = session?.target_user_id;
  redirect(targetId ? `/admin/users` : "/admin/users");
}

/**
 * Get the active impersonation session from the cookie (server-side).
 * Returns null if no active impersonation.
 */
export async function getActiveImpersonation(): Promise<{
  id: string;
  adminEmail: string;
  targetUserEmail: string;
  targetUserName: string | null;
  targetRole: string;
  startedAt: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (!token) return null;

  const db = createAdminClient();
  const { data: session } = await db
    .from("impersonation_sessions")
    .select("*")
    .eq("session_token", token)
    .eq("is_active", true)
    .single();

  if (!session) {
    // Token exists but session is invalid — clean up cookie
    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  // Check expiration
  const startedAt = new Date(session.started_at).getTime();
  const maxDurationMs = MAX_DURATION_HOURS * 60 * 60 * 1000;
  if (Date.now() - startedAt > maxDurationMs) {
    // Session expired — clean up
    await db
      .from("impersonation_sessions")
      .update({
        ended_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", session.id);

    cookieStore.delete(IMPERSONATION_COOKIE);
    return null;
  }

  return {
    id: session.id,
    adminEmail: session.admin_email,
    targetUserEmail: session.target_user_email,
    targetUserName: session.target_user_name,
    targetRole: session.target_role,
    startedAt: session.started_at,
  };
}
