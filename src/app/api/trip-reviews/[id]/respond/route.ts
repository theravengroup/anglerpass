import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import {
  reviewResponseSchema,
  reviewResponseUpdateSchema,
} from "@/lib/validations/reviews";
import {
  validateResponseRights,
  createReviewResponse,
  updateReviewResponse,
} from "@/lib/reviews";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: Create a response to a review (landowner or club_admin)
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json();
  const parsed = reviewResponseSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const admin = createAdminClient();

  // Rule 10: Validate response rights (one per review, must be associated)
  const rights = await validateResponseRights(admin, id, auth.user.id);
  if (!rights.authorized) {
    return jsonError(rights.error ?? "Not authorized to respond", 403);
  }

  const result = await createReviewResponse(
    admin,
    id,
    auth.user.id,
    rights.role!,
    parsed.data.response_text
  );

  if (!result.success) {
    return jsonError(result.error ?? "Failed to create response", 500);
  }

  return jsonOk({
    success: true,
    response_id: result.responseId,
  });
}

// PATCH: Edit a response (within 24-hour window)
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id: reviewId } = await params;
  const body = await request.json();
  const parsed = reviewResponseUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid input",
      400
    );
  }

  const admin = createAdminClient();

  // Find the response for this review
  const { data: response, error } = await admin
    .from("review_responses")
    .select("id")
    .eq("review_id", reviewId)
    .eq("responder_user_id", auth.user.id)
    .maybeSingle();

  if (error || !response) {
    return jsonError("Response not found or you are not the responder", 404);
  }

  const result = await updateReviewResponse(
    admin,
    response.id,
    auth.user.id,
    parsed.data.response_text
  );

  if (!result.success) {
    return jsonError(result.error ?? "Failed to update response", 400);
  }

  return jsonOk({ success: true });
}
