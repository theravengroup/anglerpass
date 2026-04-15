import { jsonError, jsonOk, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { leaseProposalSchema } from "@/lib/validations/properties";
import { captureApiError } from "@/lib/observability";

/**
 * POST /api/properties/:id/lease/propose
 *
 * Landowner proposes an annual upfront-lease amount. Switches the property
 * into pricing_mode=upfront_lease with lease_status='proposed'.
 *
 * Flow:
 *   landowner propose → club respond (accept/counter/decline)
 *                     → (if accepted) club pay via ACH
 *                     → webhook marks lease active
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (!auth) return jsonError("Unauthorized", 401);

    const body = await request.json();
    const parsed = leaseProposalSchema.safeParse({ ...body, property_id: id });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();
    const { data: property } = await admin
      .from("properties")
      .select("id, owner_id, lease_status")
      .eq("id", id)
      .maybeSingle();

    if (!property || property.owner_id !== auth.user.id) {
      return jsonError("Forbidden", 403);
    }

    if (property.lease_status === "active") {
      return jsonError(
        "Lease is already active. Wait for renewal to propose a new amount.",
        409,
      );
    }

    const amountCents = Math.round(parsed.data.amount_usd * 100);

    const { error } = await admin
      .from("properties")
      .update({
        pricing_mode: "upfront_lease",
        lease_proposed_amount_cents: amountCents,
        lease_status: "proposed",
        lease_negotiation_note: parsed.data.note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[lease/propose] update error", error);
      return jsonError("Failed to record lease proposal", 500);
    }

    await admin.from("audit_log").insert({
      action: "lease.proposed",
      entity_type: "property",
      entity_id: id,
      actor_id: auth.user.id,
      new_data: {
        amount_cents: amountCents,
        term_months: parsed.data.term_months,
      },
    });

    return jsonOk({
      property_id: id,
      lease_status: "proposed",
      proposed_amount_cents: amountCents,
    });
  } catch (err) {
    captureApiError(err, { route: "properties/[id]/lease/propose" });
    return jsonError("Internal server error", 500);
  }
}
