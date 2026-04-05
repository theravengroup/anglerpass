import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { notifyMemberApproved } from "@/lib/notifications";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

const reviewSchema = z.object({
  action: z.enum(["approve", "decline"]),
  declined_reason: z.string().max(500).optional(),
});

async function verifyClubManager(
  admin: SupabaseClient,
  clubId: string,
  userId: string
): Promise<{ club: { owner_id: string; name: string }; isOwner: boolean } | null> {
  const { data: club } = await admin
    .from("clubs")
    .select("owner_id, name")
    .eq("id", clubId)
    .single();

  if (!club) return null;

  if (club.owner_id === userId) return { club, isOwner: true };

  const { data: staffMembership } = await admin
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("role", "staff")
    .eq("status", "active")
    .maybeSingle();

  if (staffMembership) return { club, isOwner: false };

  return null;
}

/**
 * PATCH /api/clubs/[id]/applications/[applicationId]
 *
 * Approve or decline a membership application.
 *
 * On approve:
 *   1. Update application status to "approved"
 *   2. Create club_membership with status "active" and joined_at
 *   3. Notify the applicant
 *
 * On decline:
 *   1. Update application status to "declined" with reason
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  const limited = rateLimit("club-application", getClientIp(request), 10, 60_000);
  if (limited) return limited;

  try {
    const { id, applicationId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", 401);
    }

    const admin = createAdminClient();
    const auth = await verifyClubManager(admin, id, user.id);
    if (!auth) {
      return jsonError("Forbidden", 403);
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    // Fetch the application
    const { data: application } = await admin
      .from("membership_applications")
      .select("id, club_id, user_id, status")
      .eq("id", applicationId)
      .eq("club_id", id)
      .single();

    if (!application) {
      return jsonError("Application not found", 404);
    }

    if (application.status !== "pending") {
      return jsonError(`Application already ${application.status}`, 409);
    }

    const now = new Date().toISOString();

    if (parsed.data.action === "approve") {
      // Update application
      await admin
        .from("membership_applications")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: now,
          updated_at: now,
        })
        .eq("id", applicationId);

      // Check if membership already exists (from old join flow)
      const { data: existingMembership } = await admin
        .from("club_memberships")
        .select("id, status")
        .eq("club_id", id)
        .eq("user_id", application.user_id)
        .maybeSingle();

      if (existingMembership) {
        // Update existing membership to active
        await admin
          .from("club_memberships")
          .update({
            status: "active",
            joined_at: now,
            updated_at: now,
          })
          .eq("id", existingMembership.id);
      } else {
        // Create new membership
        await admin.from("club_memberships").insert({
          club_id: id,
          user_id: application.user_id,
          role: "member",
          status: "active",
          joined_at: now,
        });
      }

      // Notify the applicant
      notifyMemberApproved(admin, {
        userId: application.user_id,
        clubName: auth.club.name,
        clubId: id,
      }).catch((err) =>
        console.error("[clubs/applications] Notification error:", err)
      );

      return jsonOk({
        application: { id: applicationId, status: "approved" },
      });
    }

    // Decline
    await admin
      .from("membership_applications")
      .update({
        status: "declined",
        reviewed_by: user.id,
        reviewed_at: now,
        declined_reason: parsed.data.declined_reason ?? null,
        updated_at: now,
      })
      .eq("id", applicationId);

    // Also decline any pending club_membership record
    const { data: existingMembership } = await admin
      .from("club_memberships")
      .select("id")
      .eq("club_id", id)
      .eq("user_id", application.user_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingMembership) {
      await admin
        .from("club_memberships")
        .update({
          status: "declined",
          removal_reason: parsed.data.declined_reason ?? null,
          updated_at: now,
        })
        .eq("id", existingMembership.id);
    }

    return jsonOk({
      application: { id: applicationId, status: "declined" },
    });
  } catch (err) {
    console.error("[clubs/applications] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
