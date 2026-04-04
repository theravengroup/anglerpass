/**
 * AnglerPass Permissions System
 *
 * Usage:
 *   import { P, authorize, auditLog, AuditAction } from "@/lib/permissions";
 *
 *   const result = await authorize({
 *     permission: P.BOOKING_CREATE_ON_BEHALF,
 *     userId: user.id,
 *     clubId: "...",
 *   });
 *
 *   if (!result.allowed) return jsonError("Forbidden", 403);
 *
 *   // ... do the thing ...
 *
 *   await auditLog({
 *     actor_id: user.id,
 *     action: AuditAction.BOOKING_CREATED_ON_BEHALF,
 *     entity_type: "booking",
 *     entity_id: booking.id,
 *     represented_user_id: anglerId,
 *     organization_id: clubId,
 *   });
 */

export { P, type PermissionId, type ScopeType } from "./constants";
export {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  PLATFORM_ROLE_DESCRIPTIONS,
  type PlatformRole,
} from "./constants";
export {
  CLUB_ROLES,
  CLUB_ROLE_LABELS,
  CLUB_ROLE_DESCRIPTIONS,
  CLUB_ROLE_PERMISSION_SUMMARIES,
  CLUB_ROLE_HIERARCHY,
  CLUB_STAFF_ROLES,
  ASSIGNABLE_CLUB_ROLES,
  type ClubRole,
} from "./constants";
export {
  DELEGATE_LEVELS,
  DELEGATE_LEVEL_LABELS,
  DELEGATE_LEVEL_DESCRIPTIONS,
  DELEGATE_PERMISSION_SUMMARIES,
  type DelegateLevel,
} from "./constants";

export {
  authorize,
  authorizeAll,
  authorizeAny,
  requireClubPermission,
  isClubStaff,
  invalidatePermissionCache,
  type AuthorizationContext,
  type AuthorizationResult,
} from "./authorize";

export {
  auditLog,
  auditLogWithContext,
  auditBookingAction,
  AuditAction,
  type AuditEntry,
} from "./audit";
