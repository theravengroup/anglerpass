import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { PermissionId, PlatformRole, ClubRole, DelegateLevel } from "./constants";
import { CLUB_STAFF_ROLES } from "./constants";
import { getPlatformStaffRole, getAllRolePermissions, getActiveDelegate } from "./db";

// ─── Types ──────────────────────────────────────────────────────────

export interface AuthorizationContext {
  userId: string;
  /** Platform staff role, if any */
  platformRole: PlatformRole | null;
  /** Club membership role for a specific club, if requested */
  clubRole: ClubRole | null;
  /** Club ID being operated on, if any */
  clubId: string | null;
  /** Delegate access level to a specific angler, if any */
  delegateLevel: DelegateLevel | null;
  /** The angler this user is a delegate for, if applicable */
  principalId: string | null;
}

export interface AuthorizationResult {
  allowed: boolean;
  context: AuthorizationContext;
  /** Human-readable denial reason */
  reason?: string;
}

// ─── Permission Cache ───────────────────────────────────────────────

/**
 * In-memory cache of role→permissions mappings.
 * Loaded once per cold start, shared across requests.
 * Safe because permissions are seeded data that rarely change.
 */
let rolePermCache: Map<string, Set<string>> | null = null;

function cacheKey(scopeType: string, role: string): string {
  return `${scopeType}:${role}`;
}

async function loadRolePermissions(): Promise<Map<string, Set<string>>> {
  if (rolePermCache) return rolePermCache;

  const data = await getAllRolePermissions();

  const cache = new Map<string, Set<string>>();
  for (const row of data) {
    const key = cacheKey(row.scope_type, row.role);
    if (!cache.has(key)) cache.set(key, new Set());
    cache.get(key)!.add(row.permission);
  }

  rolePermCache = cache;
  return cache;
}

/** Force reload — call after role_permissions are modified at runtime */
export function invalidatePermissionCache(): void {
  rolePermCache = null;
}

// ─── Core Authorization ─────────────────────────────────────────────

interface AuthorizeOptions {
  /** The permission to check */
  permission: PermissionId;
  /** The user to authorize */
  userId: string;
  /** Club context — required for organization-scoped permissions */
  clubId?: string;
  /** Angler context — required for delegate permissions */
  anglerId?: string;
}

/**
 * Central authorization function.
 *
 * Checks if a user has a specific permission in a given scope.
 * Checks in order: platform role → club role → delegate access.
 * Returns allowed/denied with context for audit logging.
 */
export async function authorize(
  options: AuthorizeOptions
): Promise<AuthorizationResult> {
  const { permission, userId, clubId, anglerId } = options;
  const perms = await loadRolePermissions();

  const ctx: AuthorizationContext = {
    userId,
    platformRole: null,
    clubRole: null,
    clubId: clubId ?? null,
    delegateLevel: null,
    principalId: anglerId ?? null,
  };

  // 1. Check platform staff permissions
  const staffRecord = await getPlatformStaffRole(userId);

  if (staffRecord) {
    ctx.platformRole = staffRecord.role as PlatformRole;
    const platformPerms = perms.get(cacheKey("platform", staffRecord.role));
    if (platformPerms?.has(permission)) {
      return { allowed: true, context: ctx };
    }
  }

  // 2. Check organization (club) permissions
  if (clubId) {
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("club_memberships")
      .select("role")
      .eq("club_id", clubId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      ctx.clubRole = membership.role as ClubRole;
      const orgPerms = perms.get(cacheKey("organization", membership.role));
      if (orgPerms?.has(permission)) {
        return { allowed: true, context: ctx };
      }
    }
  }

  // 3. Check delegate permissions
  if (anglerId && anglerId !== userId) {
    const delegation = await getActiveDelegate(anglerId, userId);

    if (delegation) {
      ctx.delegateLevel = delegation.access_level as DelegateLevel;
      const delegatePerms = getDelegatePermissions(delegation.access_level as DelegateLevel);
      if (delegatePerms.has(permission)) {
        return { allowed: true, context: ctx };
      }
    }
  }

  return {
    allowed: false,
    context: ctx,
    reason: `User ${userId} lacks permission '${permission}'`,
  };
}

/**
 * Check multiple permissions at once. Returns true only if ALL are granted.
 */
export async function authorizeAll(
  options: Omit<AuthorizeOptions, "permission"> & { permissions: PermissionId[] }
): Promise<AuthorizationResult> {
  for (const perm of options.permissions) {
    const result = await authorize({ ...options, permission: perm });
    if (!result.allowed) return result;
  }
  // Return the context from the last successful check
  return authorize({ ...options, permission: options.permissions[0] });
}

/**
 * Check multiple permissions. Returns true if ANY is granted.
 */
export async function authorizeAny(
  options: Omit<AuthorizeOptions, "permission"> & { permissions: PermissionId[] }
): Promise<AuthorizationResult> {
  for (const perm of options.permissions) {
    const result = await authorize({ ...options, permission: perm });
    if (result.allowed) return result;
  }
  return {
    allowed: false,
    context: {
      userId: options.userId,
      platformRole: null,
      clubRole: null,
      clubId: options.clubId ?? null,
      delegateLevel: null,
      principalId: options.anglerId ?? null,
    },
    reason: `User ${options.userId} lacks all of: ${options.permissions.join(", ")}`,
  };
}

// ─── Delegate Permission Mapping ────────────────────────────────────

function getDelegatePermissions(level: DelegateLevel): Set<string> {
  const perms = new Set<string>();

  if (level === "viewer" || level === "booking_manager") {
    perms.add("delegate.view_principal_bookings");
    perms.add("messaging.view_trip");
  }

  if (level === "booking_manager") {
    perms.add("delegate.create_booking_for_principal");
    perms.add("booking.modify");
    perms.add("booking.cancel");
  }

  return perms;
}

// ─── Convenience: Club Authorization ────────────────────────────────

interface ClubAuthResult {
  authorized: boolean;
  membership: { id: string; role: ClubRole; status: string } | null;
  isOwner: boolean;
  isStaff: boolean;
}

/**
 * Check if a user has a specific club role with the required permission.
 * This replaces the old `requireClubManager()` for granular checks.
 */
export async function requireClubPermission(
  userId: string,
  clubId: string,
  permission: PermissionId
): Promise<ClubAuthResult & { allowed: boolean }> {
  const result = await authorize({ permission, userId, clubId });

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("club_memberships")
    .select("id, role, status")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const clubRole = membership?.role as ClubRole | undefined;

  return {
    allowed: result.allowed,
    authorized: result.allowed,
    membership: membership ? {
      id: membership.id,
      role: clubRole ?? "member",
      status: membership.status,
    } : null,
    isOwner: clubRole === "owner" || clubRole === "admin",
    isStaff: clubRole != null && CLUB_STAFF_ROLES.includes(clubRole),
  };
}

/**
 * Check if a user is a staff member (any staff role) of a specific club.
 * Lightweight check — does not verify a specific permission.
 */
export async function isClubStaff(
  userId: string,
  clubId: string
): Promise<{ isStaff: boolean; role: ClubRole | null }> {
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("club_memberships")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!membership) return { isStaff: false, role: null };

  const role = membership.role as ClubRole;
  return {
    isStaff: CLUB_STAFF_ROLES.includes(role),
    role,
  };
}
