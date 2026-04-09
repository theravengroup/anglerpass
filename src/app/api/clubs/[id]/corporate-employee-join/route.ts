import { jsonError, jsonOk, requireAuth} from "@/lib/api/helpers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/notifications";

const bodySchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const auth = await requireAuth();

    if (!auth) return jsonError("Unauthorized", 401);

    const { user } = auth;

    const body = await request.json();
    const result = bodySchema.safeParse(body);

    if (!result.success) {
      return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const { token } = result.data;
    const admin = createAdminClient();

    // Look up invitation by token
    const { data: invitation, error: invErr } = await admin
      .from("corporate_invitations")
      .select("id, email, status, club_id, corporate_member_id, invited_at")
      .eq("token", token)
      .single();

    if (invErr || !invitation) {
      return jsonError("Invalid invitation token", 404);
    }

    // Check expiration (30 days) before checking status
    if (invitation.invited_at) {
      const invitedAt = new Date(invitation.invited_at);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (invitedAt < thirtyDaysAgo) {
        // Mark as expired
        await admin
          .from("corporate_invitations")
          .update({ status: "expired" })
          .eq("id", invitation.id);
        return jsonError("This invitation has expired. Please contact your corporate sponsor for a new invitation.", 410);
      }
    }

    // Verify status is pending
    if (invitation.status !== "pending") {
      return jsonError("This invitation has already been used or has expired", 400);
    }

    // Verify email matches the logged-in user
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return jsonError("This invitation was sent to a different email address. Please sign in with the correct account.", 403);
    }

    // Verify club_id matches
    if (invitation.club_id !== clubId) {
      return jsonError("Club ID mismatch", 400);
    }

    // Check if user already has a membership in this club
    const { data: existingMembership } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMembership) {
      return jsonError("You already have a membership in this club", 409);
    }

    // Get corporate member info
    const { data: corporateMembership } = await admin
      .from("club_memberships")
      .select("id, company_name, user_id")
      .eq("id", invitation.corporate_member_id)
      .single();

    if (!corporateMembership) {
      return jsonError("Corporate membership not found", 404);
    }

    // Create the employee membership (pending until payment completes)
    const { data: membership, error: insertErr } = await admin
      .from("club_memberships")
      .insert({
        club_id: clubId,
        user_id: user.id,
        role: "member",
        status: "pending",
        dues_status: "pending",
        membership_type: "corporate_employee",
        company_name: corporateMembership.company_name,
        corporate_sponsor_id: corporateMembership.id,
        invited_email: invitation.email,
        invited_at: invitation.invited_at ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[corporate-employee-join] Insert error:", insertErr);
      return jsonError("Failed to create membership", 500);
    }

    // Update invitation status
    const { error: updateErr } = await admin
      .from("corporate_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (updateErr) {
      console.error(
        "[corporate-employee-join] Update invitation error:",
        updateErr
      );
      // Non-fatal: membership was created, just log the error
    }

    // Notify the corporate sponsor
    if (corporateMembership.user_id) {
      const { data: club } = await admin
        .from("clubs")
        .select("name")
        .eq("id", clubId)
        .single();

      const { data: employeeProfile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const employeeName =
        employeeProfile?.display_name ?? user.email ?? "An employee";
      const clubName = club?.name ?? "your club";

      await notify(admin, {
        userId: corporateMembership.user_id,
        type: "member_approved",
        title: `${employeeName} joined ${clubName}`,
        body: `${employeeName} has accepted your corporate invitation and joined ${clubName} as a corporate employee member.`,
        link: "/angler",
        metadata: {
          club_id: clubId,
          membership_id: membership.id,
        },
      });
    }

    return jsonOk({ membership });
  } catch (err) {
    console.error("[corporate-employee-join] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
