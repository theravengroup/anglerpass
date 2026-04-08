import "server-only";

import type { AuthorizationContext } from "./authorize";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

type AuditLogInsert = Database["public"]["Tables"]["audit_log"]["Insert"];

// ─── Types ──────────────────────────────────────────────────────────

export interface AuditEntry {
  /** The user who performed the action */
  actor_id: string;
  /** The action performed (e.g., 'booking.created', 'delegate.added') */
  action: string;
  /** The type of entity affected (e.g., 'booking', 'profile', 'delegate') */
  entity_type: string;
  /** The ID of the affected entity */
  entity_id?: string;
  /** Previous state (for updates) */
  old_data?: Record<string, unknown>;
  /** New state (for creates/updates) */
  new_data?: Record<string, unknown>;
  /** User being acted on behalf of (if on-behalf-of action) */
  represented_user_id?: string;
  /** Organization context (e.g., club_id) */
  organization_id?: string;
  /** Scope: 'platform', 'organization', 'consumer' */
  scope?: string;
  /** Reason for the action (required for high-risk actions) */
  reason?: string;
}

// ─── Audit Actions ──────────────────────────────────────────────────

export const AuditAction = {
  // Bookings
  BOOKING_CREATED: "booking.created",
  BOOKING_CREATED_ON_BEHALF: "booking.created_on_behalf",
  BOOKING_MODIFIED: "booking.modified",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_FEE_WAIVED: "booking.fee_waived",
  BOOKING_LIMIT_OVERRIDDEN: "booking.limit_overridden",
  BOOKING_STANDING_CHANGED: "booking.standing_changed",
  BOOKING_ABUSE_FLAGGED: "booking.abuse_flagged",
  BOOKING_LATE_CANCEL_FEE: "booking.late_cancel_fee",

  // Users
  USER_ROLE_CHANGED: "user.role_changed",
  USER_SUSPENDED: "user.suspended",
  USER_UNSUSPENDED: "user.unsuspended",

  // Platform staff
  PLATFORM_STAFF_GRANTED: "platform_staff.granted",
  PLATFORM_STAFF_REVOKED: "platform_staff.revoked",
  PLATFORM_STAFF_CHANGED: "platform_staff.role_changed",

  // Club roles
  CLUB_ROLE_ASSIGNED: "club.role_assigned",
  CLUB_ROLE_CHANGED: "club.role_changed",
  CLUB_MEMBER_REMOVED: "club.member_removed",

  // Delegates
  DELEGATE_ADDED: "delegate.added",
  DELEGATE_ACCEPTED: "delegate.accepted",
  DELEGATE_REVOKED: "delegate.revoked",
  DELEGATE_LEVEL_CHANGED: "delegate.level_changed",

  // Financial
  REFUND_ISSUED: "financial.refund_issued",
  FEE_ADJUSTED: "financial.fee_adjusted",
  PAYOUT_CHANGED: "financial.payout_changed",

  // Compliance
  VERIFICATION_APPROVED: "compliance.verification_approved",
  VERIFICATION_REJECTED: "compliance.verification_rejected",
  LISTING_SUSPENDED: "compliance.listing_suspended",

  // Moderation (existing actions — kept for backward compatibility)
  MODERATION_APPROVED: "moderation.approved",
  MODERATION_CHANGES_REQUESTED: "moderation.changes_requested",
  MODERATION_REJECTED: "moderation.rejected",

  // Settings
  SETTINGS_UPDATED: "settings.updated",
  ADMIN_INVITED: "admin.invited",

  // System
  IMPERSONATION_STARTED: "system.impersonation_started",
  IMPERSONATION_ENDED: "system.impersonation_ended",
} as const;

// ─── Audit Logger ───────────────────────────────────────────────────

/**
 * Write an audit log entry. Fire-and-forget — errors are logged but don't
 * block the calling operation.
 */
export async function auditLog(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    const row: AuditLogInsert = {
      actor_id: entry.actor_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id ?? null,
      old_data: (entry.old_data as AuditLogInsert["old_data"]) ?? null,
      new_data: (entry.new_data as AuditLogInsert["new_data"]) ?? null,
      represented_user_id: entry.represented_user_id ?? null,
      organization_id: entry.organization_id ?? null,
      scope: entry.scope ?? null,
      reason: entry.reason ?? null,
    };
    const { error } = await admin.from("audit_log").insert(row);

    if (error) {
      console.error("[audit] Failed to write audit log:", error.message);
    }
  } catch (err) {
    console.error("[audit] Unexpected error writing audit log:", err);
  }
}

/**
 * Write an audit log entry with authorization context automatically populated.
 * Use this when you already have an AuthorizationContext from an authorize() call.
 */
export async function auditLogWithContext(
  ctx: AuthorizationContext,
  entry: Omit<AuditEntry, "actor_id" | "represented_user_id" | "organization_id" | "scope">
): Promise<void> {
  return auditLog({
    ...entry,
    actor_id: ctx.userId,
    represented_user_id: ctx.principalId ?? undefined,
    organization_id: ctx.clubId ?? undefined,
    scope: ctx.platformRole
      ? "platform"
      : ctx.clubRole
        ? "organization"
        : ctx.delegateLevel
          ? "consumer"
          : undefined,
  });
}

/**
 * Convenience: log a booking action with full context.
 */
export async function auditBookingAction(params: {
  actorId: string;
  action: string;
  bookingId: string;
  representedUserId?: string;
  clubId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  reason?: string;
}): Promise<void> {
  return auditLog({
    actor_id: params.actorId,
    action: params.action,
    entity_type: "booking",
    entity_id: params.bookingId,
    represented_user_id: params.representedUserId,
    organization_id: params.clubId,
    scope: params.representedUserId ? "organization" : "consumer",
    old_data: params.oldData,
    new_data: params.newData,
    reason: params.reason,
  });
}
