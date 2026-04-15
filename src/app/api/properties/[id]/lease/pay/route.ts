import { z } from "zod";
import {
  jsonError,
  jsonOk,
  requireAuth,
  requireClubManager,
  isUuid,
  handleStripeError,
} from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateLeaseBreakdown } from "@/lib/constants/fees";
import { getOrCreateCustomer, stripe } from "@/lib/stripe/server";
import { captureApiError } from "@/lib/observability";

const paySchema = z.object({
  club_id: z.string().refine(isUuid, "Invalid club id"),
  /** Optional: number of months for the term (default 12). Used to compute period_end. */
  term_months: z.number().int().min(1).max(60).default(12),
});

/**
 * POST /api/properties/:id/lease/pay
 *
 * Creates an ACH PaymentIntent so the club can fund the agreed lease amount.
 * Returns the client_secret the browser uses to complete the us_bank_account
 * payment (via Stripe Financial Connections or micro-deposits).
 *
 * The actual state transition (lease_status=active, ledger row insert,
 * transfer to landowner) happens in the webhook handler on
 * payment_intent.succeeded (ACH is async — funds clear 3-5 business days).
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
    const parsed = paySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }

    const admin = createAdminClient();
    const club = await requireClubManager(admin, parsed.data.club_id, auth.user.id);
    if (!club) return jsonError("Forbidden", 403);

    const { data: property } = await admin
      .from("properties")
      .select("id, owner_id, lease_status, lease_amount_cents")
      .eq("id", id)
      .maybeSingle();

    if (!property) return jsonError("Property not found", 404);
    if (property.lease_status !== "agreed") {
      return jsonError(
        `Lease must be in agreed state before payment (current: ${property.lease_status ?? "none"})`,
        409,
      );
    }
    if (!property.lease_amount_cents) {
      return jsonError("Agreed lease amount missing", 409);
    }

    const breakdown = calculateLeaseBreakdown(property.lease_amount_cents);
    const termMonths = parsed.data.term_months;

    // Resolve billing email for the customer.
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", auth.user.id)
      .maybeSingle();
    const email = auth.user.email;
    if (!email) return jsonError("Billing email not found", 400);

    const customerId = await getOrCreateCustomer(
      auth.user.id,
      email,
      profile?.display_name ?? undefined,
    );

    // ACH PaymentIntent — automatic capture, us_bank_account only.
    try {
      const pi = await stripe.paymentIntents.create({
        amount: breakdown.amountCents,
        currency: "usd",
        customer: customerId,
        payment_method_types: ["us_bank_account"],
        capture_method: "automatic",
        metadata: {
          type: "property_lease_payment",
          property_id: id,
          club_id: parsed.data.club_id,
          landowner_id: property.owner_id ?? "",
          platform_fee_cents: String(breakdown.platformFeeCents),
          landowner_net_cents: String(breakdown.landownerNetCents),
          term_months: String(termMonths),
        },
      });

      // Pre-create pending ledger row so admins can see in-flight payments.
      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + termMonths);

      await admin.from("property_lease_payments").insert({
        property_id: id,
        club_id: parsed.data.club_id,
        amount_cents: breakdown.amountCents,
        platform_fee_cents: breakdown.platformFeeCents,
        landowner_net_cents: breakdown.landownerNetCents,
        stripe_payment_intent_id: pi.id,
        status: "processing",
        period_start: periodStart.toISOString().slice(0, 10),
        period_end: periodEnd.toISOString().slice(0, 10),
      });

      await admin.from("audit_log").insert({
        action: "lease.payment_initiated",
        entity_type: "property",
        entity_id: id,
        actor_id: auth.user.id,
        new_data: {
          payment_intent_id: pi.id,
          amount_cents: breakdown.amountCents,
          platform_fee_cents: breakdown.platformFeeCents,
        },
      });

      return jsonOk({
        client_secret: pi.client_secret,
        payment_intent_id: pi.id,
        amount_cents: breakdown.amountCents,
        platform_fee_cents: breakdown.platformFeeCents,
        landowner_net_cents: breakdown.landownerNetCents,
      });
    } catch (err) {
      const handled = handleStripeError(err);
      if (handled) return handled;
      throw err;
    }
  } catch (err) {
    captureApiError(err, { route: "properties/[id]/lease/pay" });
    return jsonError("Internal server error", 500);
  }
}
