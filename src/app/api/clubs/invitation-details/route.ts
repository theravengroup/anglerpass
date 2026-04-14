import { jsonError, jsonOk } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

// GET: Fetch invitation details by token (public — used during signup flow)
export async function GET(request: Request) {
  const limited = rateLimit("invitation-lookup", getClientIp(request), 60, 60_000);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return jsonError("Token is required", 400);
    }

    const admin = createAdminClient();

    const { data: invitation, error } = await admin
      .from("club_invitations")
      .select("club_name, status, properties(name)")
      .eq("token", token)
      .maybeSingle();

    if (error || !invitation) {
      return jsonError("Invitation not found", 404);
    }

    if (invitation.status !== "sent") {
      return jsonError("This invitation has already been used", 410);
    }

    return jsonOk({
      club_name: invitation.club_name,
      property_name:
        (invitation.properties as { name: string } | null)?.name ?? null,
    });
  } catch (err) {
    console.error("[clubs/invitation-details] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
