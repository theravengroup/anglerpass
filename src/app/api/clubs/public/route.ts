import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";

// GET: Fetch public club data by ID (no auth required)
export async function GET(request: NextRequest) {
  const limited = rateLimit("clubs-public", getClientIp(request), 30, 60_000);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return jsonError("Club ID is required", 400);
    }

    const admin = createAdminClient();

    // Only return public-safe fields
    const { data: club, error } = await admin
      .from("clubs")
      .select(
        "id, name, description, location, initiation_fee, annual_dues, membership_application_required"
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !club) {
      return jsonError("Club not found", 404);
    }

    // Get active member count for social proof
    const { count: memberCount } = await admin
      .from("club_memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", id)
      .eq("status", "active");

    return jsonOk({
      club,
      memberCount: memberCount ?? 0,
    });
  } catch (err) {
    console.error("[clubs/public] Unexpected error:", err);
    return jsonError("Internal server error", 500);
  }
}
