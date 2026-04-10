import "server-only";

/**
 * Database access helpers for permissions tables.
 *
 * Uses the Supabase admin client with properly typed `.from()` calls
 * now that types have been regenerated after migration 00042.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

// ─── Row Types (re-exported from generated types) ──────────────────

export type PlatformStaffRow =
  Database["public"]["Tables"]["platform_staff"]["Row"];

export type AnglerDelegateRow =
  Database["public"]["Tables"]["angler_delegates"]["Row"];

export type RolePermissionRow =
  Database["public"]["Tables"]["role_permissions"]["Row"];

export type PermissionRow =
  Database["public"]["Tables"]["permissions"]["Row"];

// ─── Query Helpers ──────────────────────────────────────────────────

export async function getPlatformStaffRole(userId: string): Promise<PlatformStaffRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_staff")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function getAllRolePermissions(): Promise<RolePermissionRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("role_permissions")
    .select("*");

  if (error || !data) return [];
  return data;
}

export async function getActiveDelegate(
  anglerId: string,
  delegateId: string
): Promise<AnglerDelegateRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("angler_delegates")
    .select("*")
    .eq("angler_id", anglerId)
    .eq("delegate_id", delegateId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
