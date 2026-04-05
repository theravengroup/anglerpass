import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authorize, type AuthorizationResult } from "@/lib/permissions/authorize";
import type { PermissionId } from "@/lib/permissions/constants";
import { CLUB_STAFF_ROLES, type ClubRole } from "@/lib/permissions/constants";

// ─── Standard API Responses ─────────────────────────────────────────

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonCreated<T>(data: T) {
  return Response.json(data, { status: 201 });
}

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status });
}

// ─── Authentication Helpers ─────────────────────────────────────────

interface AuthResult {
  user: { id: string; email?: string };
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Verifies the request is from an authenticated user.
 * Returns the user and supabase client, or null if unauthorized.
 */
export async function requireAuth(): Promise<AuthResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { user, supabase };
}

/**
 * Verifies the request is from an authenticated admin.
 * Returns the user, supabase client, and admin client, or null.
 */
export async function requireAdmin() {
  const auth = await requireAuth();
  if (!auth) return null;

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (error || !profile || profile.role !== "admin") return null;

  return { ...auth, admin };
}

// ─── Ownership Verification ─────────────────────────────────────────

/**
 * Verify that the given user owns the property.
 * Returns the property row on success, or null if not found / not owned.
 */
export async function requirePropertyOwner(
  admin: SupabaseClient,
  propertyId: string,
  userId: string
) {
  const { data: property } = await admin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .maybeSingle();

  if (!property || property.owner_id !== userId) return null;
  return property;
}

/**
 * Verify that the given user is the club manager (owner).
 * Returns the club row on success, or null if not found / not owned.
 */
export async function requireClubManager(
  admin: SupabaseClient,
  clubId: string,
  userId: string
) {
  const { data: club } = await admin
    .from("clubs")
    .select("*")
    .eq("id", clubId)
    .maybeSingle();

  if (!club || club.owner_id !== userId) return null;
  return club;
}

// ─── Input Sanitization ─────────────────────────────────────────────

/**
 * Parse a positive integer from a string, with a default and max.
 */
export function parsePositiveInt(
  value: string | null,
  defaultValue: number,
  max = 3650
): number {
  const parsed = parseInt(value ?? String(defaultValue), 10);
  if (isNaN(parsed) || parsed < 1) return defaultValue;
  return Math.min(parsed, max);
}

/**
 * Escape special characters for Supabase/Postgres ilike patterns.
 * Prevents user input from being interpreted as wildcards.
 */
export function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

// ─── Permission-Based Helpers ───────────────────────────────────────

/**
 * Verify the current user has a specific permission.
 * Returns auth + authorization context, or null (caller should return 403).
 */
export async function requirePermission(permission: PermissionId, opts?: { clubId?: string; anglerId?: string }) {
  const auth = await requireAuth();
  if (!auth) return null;

  const result = await authorize({
    permission,
    userId: auth.user.id,
    clubId: opts?.clubId,
    anglerId: opts?.anglerId,
  });

  if (!result.allowed) return null;

  return { ...auth, authorization: result, admin: createAdminClient() };
}

/**
 * Verify a user has a specific club role with the required permission.
 * Replaces the pattern of `requireClubManager()` + manual staff checks.
 */
export async function requireClubRole(
  userId: string,
  clubId: string,
  permission: PermissionId
): Promise<{
  allowed: boolean;
  membership: { id: string; role: ClubRole; status: string } | null;
  isOwner: boolean;
  isStaff: boolean;
} | null> {
  const admin = createAdminClient();

  // Check authorization
  const authResult = await authorize({ permission, userId, clubId });

  // Get membership info — .single() returns error when no row matches,
  // so membership may be null even without a thrown exception.
  const { data: membership } = await admin
    .from("club_memberships")
    .select("id, role, status")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!authResult.allowed && !membership) return null;

  const clubRole = membership?.role as ClubRole | undefined;

  return {
    allowed: authResult.allowed,
    membership: membership ? {
      id: membership.id,
      role: clubRole ?? "member",
      status: membership.status,
    } : null,
    isOwner: clubRole === "owner" || clubRole === "admin",
    isStaff: clubRole != null && CLUB_STAFF_ROLES.includes(clubRole),
  };
}
