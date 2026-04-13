import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Activity Event Types ─────────────────────────────────────────

export type ActivityEventType =
  | "event_registered"
  | "event_cancelled"
  | "event_attended"
  | "event_no_show"
  | "waitlist_joined"
  | "waitlist_offered"
  | "waitlist_accepted"
  | "waitlist_declined"
  | "waiver_signed"
  | "incident_reported"
  | "booking_created"
  | "booking_cancelled"
  | "booking_completed"
  | "membership_renewed"
  | "profile_updated";

// ─── Log Activity ─────────────────────────────────────────────────

interface LogActivityParams {
  admin: SupabaseClient;
  membershipId: string;
  clubId: string;
  eventType: ActivityEventType;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

/**
 * Log a member activity event for ClubOS analytics.
 * Uses the admin client to bypass RLS (called from API routes).
 * Fails silently — activity logging should never block the primary operation.
 */
export async function logMemberActivity({
  admin,
  membershipId,
  clubId,
  eventType,
  metadata,
  occurredAt,
}: LogActivityParams): Promise<void> {
  try {
    await admin.from("club_member_activity_events").insert({
      membership_id: membershipId,
      club_id: clubId,
      event_type: eventType,
      metadata: metadata ?? null,
      occurred_at: occurredAt ?? new Date().toISOString(),
    });
  } catch (err) {
    console.error("[activity-logger] Failed to log activity:", err);
  }
}

// ─── Batch Log ────────────────────────────────────────────────────

interface BatchActivityEvent {
  membershipId: string;
  clubId: string;
  eventType: ActivityEventType;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

/**
 * Log multiple activity events in a single insert.
 */
export async function logMemberActivityBatch(
  admin: SupabaseClient,
  events: BatchActivityEvent[]
): Promise<void> {
  if (events.length === 0) return;

  try {
    await admin.from("club_member_activity_events").insert(
      events.map((e) => ({
        membership_id: e.membershipId,
        club_id: e.clubId,
        event_type: e.eventType,
        metadata: e.metadata ?? null,
        occurred_at: e.occurredAt ?? new Date().toISOString(),
      }))
    );
  } catch (err) {
    console.error("[activity-logger] Batch log failed:", err);
  }
}
