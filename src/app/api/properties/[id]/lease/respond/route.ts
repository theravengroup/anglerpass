import { z } from "zod";
import { jsonError, jsonOk, requireAuth, requireClubManager, isUuid } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEASE_MIN_USD, LEASE_MAX_USD } from "@/lib/constants/fees";
import { captureApiError } from "@/lib/observability";

const respondSchema = z.object({
  club_id: z.string().refine(isUuid, "Invalid club id"),
  action: z.enum(["accept", "counter", "decline"]),
  counter_amount_usd: z
    .number()
    .int()
    .min(LEASE_MIN_USD)
    .max(LEASE_MAX_USD)
    .optional(),
  note: z.string().max(1000).optional(),
}).superRefine((val, ctx) => {
  if (val.action === "counter" && val.counter_amount_usd == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["counter_amount_usd"],
      message: "Counter amount required when action=counter",
    });
  }
});

/**
 * POST /api/properties/:id/lease/respond
 *
 * Club responds to a landowner's lease proposal.
 *   - accept  → lease_status='agreed', lease_amount_cents locked in
 *               (payment happens separately via /lease/pay)
 *   - counter → lease_status='under_negotiation', updates proposed amount
 *   - decline → clears lease_status, reverts to whatever the property's
 *               classification-based pricing was (or remains unset)
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
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();

    const club = await requireClubManager(admin, parsed.data.club_id, auth.user.id);
    if (!club) return jsonError("Forbidden", 403);

    const { data: property } = await admin
      .from("properties")
      .select("id, lease_status, lease_proposed_amount_cents")
      .eq("id", id)
      .maybeSingle();
    if (!property) return jsonError("Property not found", 404);

    if (!property.lease_status || property.lease_status === "active") {
      return jsonError("No open lease proposal to respond to", 409);
    }

    // Verify this club actually has access to the property
    const { data: access } = await admin
      .from("club_property_access")
      .select("id, status")
      .eq("club_id", parsed.data.club_id)
      .eq("property_id", id)
      .maybeSingle();

    if (!access || access.status !== "approved") {
      return jsonError("Club does not have access to this property", 403);
    }

    const now = new Date().toISOString();

    if (parsed.data.action === "accept") {
      const agreedAmount = property.lease_proposed_amount_cents;
      if (!agreedAmount) {
        return jsonError("No proposed amount to accept", 409);
      }
      await admin
        .from("properties")
        .update({
          lease_status: "agreed",
          lease_amount_cents: agreedAmount,
          updated_at: now,
        })
        .eq("id", id);
    } else if (parsed.data.action === "counter") {
      const counterCents = Math.round((parsed.data.counter_amount_usd ?? 0) * 100);
      await admin
        .from("properties")
        .update({
          lease_status: "under_negotiation",
          lease_proposed_amount_cents: counterCents,
          lease_negotiation_note: parsed.data.note ?? null,
          updated_at: now,
        })
        .eq("id", id);
    } else {
      await admin
        .from("properties")
        .update({
          lease_status: null,
          lease_proposed_amount_cents: null,
          lease_amount_cents: null,
          lease_negotiation_note: parsed.data.note ?? null,
          updated_at: now,
        })
        .eq("id", id);
    }

    await admin.from("audit_log").insert({
      action: `lease.${parsed.data.action}`,
      entity_type: "property",
      entity_id: id,
      actor_id: auth.user.id,
      new_data: {
        club_id: parsed.data.club_id,
        counter_amount_cents: parsed.data.counter_amount_usd
          ? Math.round(parsed.data.counter_amount_usd * 100)
          : null,
      },
    });

    return jsonOk({ property_id: id, action: parsed.data.action });
  } catch (err) {
    captureApiError(err, { route: "properties/[id]/lease/respond" });
    return jsonError("Internal server error", 500);
  }
}
