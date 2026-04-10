import { NextRequest } from "next/server";
import { requireAdmin, jsonOk, jsonCreated, jsonError } from "@/lib/api/helpers";
import { createStepSchema } from "@/lib/validations/campaigns";

/**
 * GET /api/admin/campaigns/[id]/steps
 *
 * List all steps for a campaign, ordered by step_order.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  const { data: steps, error } = await auth.admin.from("campaign_steps")
    .select("*")
    .eq("campaign_id", id)
    .order("step_order", { ascending: true });

  if (error) {
    return jsonError(`Failed to fetch steps: ${error.message}`, 500);
  }

  return jsonOk({ steps: steps ?? [] });
}

/**
 * POST /api/admin/campaigns/[id]/steps
 *
 * Add a step to a campaign. Campaign must be draft or paused.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth) return jsonError("Unauthorized", 401);

  const { id } = await params;

  // Verify campaign exists and is editable
  const { data: campaign } = await auth.admin.from("campaigns")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) return jsonError("Campaign not found", 404);

  const status = (campaign as Record<string, unknown>).status;
  if (status !== "draft" && status !== "paused") {
    return jsonError("Only draft or paused campaigns can have steps added", 409);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const result = createStepSchema.safeParse(body);
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const { data: step, error } = await auth.admin.from("campaign_steps")
    .insert({
      ...result.data,
      campaign_id: id,
    })
    .select("*")
    .single();

  if (error) {
    return jsonError(`Failed to create step: ${error.message}`, 500);
  }

  return jsonCreated({ step });
}
