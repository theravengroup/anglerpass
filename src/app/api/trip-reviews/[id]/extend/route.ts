import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { requestExtension } from "@/lib/reviews";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Request a 7-day extension on the review window
export async function POST(_request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const admin = createAdminClient();

  const result = await requestExtension(admin, id, auth.user.id);

  if (!result.success) {
    return jsonError(result.error ?? "Failed to request extension", 400);
  }

  return jsonOk({
    success: true,
    extension_expires_at: result.newDeadline?.toISOString(),
  });
}
