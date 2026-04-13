import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth, requireClubRole } from "@/lib/api/helpers";
import { P } from "@/lib/permissions/constants";
import { segmentPreviewRequestSchema } from "@/lib/validations/clubos-communications";
import { evaluateSegment } from "@/lib/clubos/email-sender";

/**
 * POST /api/clubos/segment-preview — Preview which members match a set of filters
 *
 * Returns total count and a sample of up to 10 matching members.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await req.json();
    const { club_id, ...filterData } = body;

    if (!club_id) return jsonError("club_id is required", 400);

    const role = await requireClubRole(auth.user.id, club_id, P.MESSAGING_SEND_BULK);
    if (!role?.allowed) return jsonError("Forbidden", 403);

    const parsed = segmentPreviewRequestSchema.safeParse(filterData);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const admin = createAdminClient();

    // Get full count
    const countResult = await evaluateSegment(admin, club_id, parsed.data.filters, {
      countOnly: true,
    });

    // Get sample of up to 10 members
    const sampleResult = await evaluateSegment(admin, club_id, parsed.data.filters, {
      limit: 10,
    });

    const sample = ((sampleResult.data ?? []) as unknown as Array<{
      id: string;
      user_id: string;
      role: string;
      status: string;
      profiles: { id: string; email: string; display_name: string | null };
    }>).map((m) => {
      const profile = m.profiles as unknown as {
        id: string;
        email: string;
        display_name: string | null;
      };
      return {
        membership_id: m.id,
        display_name: profile.display_name,
        email: profile.email,
        role: m.role,
        status: m.status,
      };
    });

    return jsonOk({
      count: countResult.count ?? sample.length,
      sample,
    });
  } catch (err) {
    console.error("[clubos/segment-preview] Error:", err);
    return jsonError("Internal server error", 500);
  }
}
