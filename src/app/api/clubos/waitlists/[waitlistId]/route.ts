import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  jsonOk,
  jsonError,
  requireAuth,
  requireClubRole,
} from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { offerWaitlistSchema } from "@/lib/validations/clubos-operations";
import { logMemberActivity } from "@/lib/clubos/activity-logger";

interface RouteContext {
  params: Promise<{ waitlistId: string }>;
}

/**
 * PATCH /api/clubos/waitlists/[waitlistId] — Update waitlist entry (offer, accept, cancel, etc.)
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const { waitlistId } = await ctx.params;
    const admin = createAdminClient();

    const { data: entry } = await admin
      .from("club_waitlists")
      .select("*")
      .eq("id", waitlistId)
      .single();

    if (!entry) return jsonError("Waitlist entry not found", 404);

    const body = await req.json();
    const { action } = body;

    if (!action) return jsonError("action is required (offer, accept, decline, cancel)", 400);

    const now = new Date().toISOString();

    switch (action) {
      case "offer": {
        // Staff offers a spot
        const role = await requireClubRole(auth.user.id, entry.club_id, P.OPS_MANAGE_WAITLISTS);
        if (!role?.isStaff) return jsonError("Forbidden", 403);
        if (entry.status !== "waiting") return jsonError("Can only offer to waiting entries", 400);

        const parsed = offerWaitlistSchema.safeParse(body);
        if (!parsed.success) return jsonError(parsed.error.issues[0].message, 400);

        // Default expiration: 7 days from now
        const expiresAt = parsed.data.offer_expires_at ??
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await admin
          .from("club_waitlists")
          .update({ status: "offered", offered_at: now, offer_expires_at: expiresAt })
          .eq("id", waitlistId);

        if (error) return jsonError("Failed to offer spot", 500);

        // Log activity for the user
        const { data: mem } = await admin
          .from("club_memberships")
          .select("id")
          .eq("club_id", entry.club_id)
          .eq("user_id", entry.user_id)
          .eq("status", "active")
          .maybeSingle();

        if (mem) {
          await logMemberActivity({
            admin,
            membershipId: mem.id,
            clubId: entry.club_id,
            eventType: "waitlist_offered",
            metadata: { waitlist_id: waitlistId, type: entry.type },
          });
        }

        return jsonOk({ status: "offered" });
      }

      case "accept": {
        // User accepts an offer
        if (entry.user_id !== auth.user.id) return jsonError("Forbidden", 403);
        if (entry.status !== "offered") return jsonError("No pending offer", 400);

        if (entry.offer_expires_at && new Date(entry.offer_expires_at) < new Date()) {
          await admin
            .from("club_waitlists")
            .update({ status: "expired" })
            .eq("id", waitlistId);
          return jsonError("Offer has expired", 400);
        }

        const { error } = await admin
          .from("club_waitlists")
          .update({ status: "accepted", accepted_at: now })
          .eq("id", waitlistId);

        if (error) return jsonError("Failed to accept offer", 500);

        const { data: mem } = await admin
          .from("club_memberships")
          .select("id")
          .eq("club_id", entry.club_id)
          .eq("user_id", entry.user_id)
          .eq("status", "active")
          .maybeSingle();

        if (mem) {
          await logMemberActivity({
            admin,
            membershipId: mem.id,
            clubId: entry.club_id,
            eventType: "waitlist_accepted",
            metadata: { waitlist_id: waitlistId, type: entry.type },
          });
        }

        return jsonOk({ status: "accepted" });
      }

      case "decline": {
        if (entry.user_id !== auth.user.id) return jsonError("Forbidden", 403);
        if (entry.status !== "offered") return jsonError("No pending offer to decline", 400);

        const { error } = await admin
          .from("club_waitlists")
          .update({ status: "declined", cancelled_at: now })
          .eq("id", waitlistId);

        if (error) return jsonError("Failed to decline offer", 500);

        const { data: mem } = await admin
          .from("club_memberships")
          .select("id")
          .eq("club_id", entry.club_id)
          .eq("user_id", entry.user_id)
          .eq("status", "active")
          .maybeSingle();

        if (mem) {
          await logMemberActivity({
            admin,
            membershipId: mem.id,
            clubId: entry.club_id,
            eventType: "waitlist_declined",
            metadata: { waitlist_id: waitlistId, type: entry.type },
          });
        }

        return jsonOk({ status: "declined" });
      }

      case "cancel": {
        // Staff can cancel, or user can cancel their own waiting entry
        const isOwnEntry = entry.user_id === auth.user.id;
        if (!isOwnEntry) {
          const role = await requireClubRole(auth.user.id, entry.club_id, P.OPS_MANAGE_WAITLISTS);
          if (!role?.isStaff) return jsonError("Forbidden", 403);
        }

        if (!["waiting", "offered"].includes(entry.status)) {
          return jsonError("Cannot cancel entry in current status", 400);
        }

        const { error } = await admin
          .from("club_waitlists")
          .update({ status: "cancelled", cancelled_at: now })
          .eq("id", waitlistId);

        if (error) return jsonError("Failed to cancel entry", 500);

        return jsonOk({ status: "cancelled" });
      }

      default:
        return jsonError("Invalid action. Use: offer, accept, decline, cancel", 400);
    }
  } catch (err) {
    console.error("[clubos/waitlists] PATCH error:", err);
    return jsonError("Internal server error", 500);
  }
}
