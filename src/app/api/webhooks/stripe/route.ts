import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHmac, timingSafeEqual } from "crypto";
import { toDateString } from "@/lib/utils";
import { requireEnabled } from "@/lib/feature-flags";
import { captureApiError } from "@/lib/observability";

/**
 * Main Stripe webhook handler for AnglerPass.
 *
 * Handles payment intents (bookings), invoices (membership dues),
 * subscriptions (membership lifecycle), and disputes.
 *
 * Uses raw Stripe API (no SDK) to match existing codebase patterns.
 * All events are idempotent — keyed on Stripe event ID.
 */

// ─── Signature Verification ────────────────────────────────────────

function verifySignature(
  payload: string,
  sigHeader: string,
  secret: string
): boolean {
  const parts = sigHeader.split(",");
  const timestamp = parts
    .find((p) => p.startsWith("t="))
    ?.split("=")[1];
  const signature = parts
    .find((p) => p.startsWith("v1="))
    ?.split("=")[1];

  if (!timestamp || !signature) return false;

  // Reject events older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

// ─── Event Handlers ────────────────────────────────────────────────

async function handleCompassCreditPurchase(
  paymentIntent: Record<string, unknown>
) {
  const admin = createAdminClient();
  const metadata = paymentIntent.metadata as Record<string, string>;
  const userId = metadata.user_id;
  const packKey = metadata.pack_key;
  const messages = parseInt(metadata.messages, 10);

  if (!userId || !packKey || isNaN(messages)) {
    // Don't log the raw metadata object — it contains user identifiers.
    // Log only which required fields were present so we can debug the shape.
    console.error(
      "[stripe-webhook] compass_credit_purchase missing metadata",
      {
        payment_intent_id: paymentIntent.id,
        has_user_id: Boolean(userId),
        has_pack_key: Boolean(packKey),
        has_messages: !isNaN(messages),
      }
    );
    return;
  }

  // Update purchase record — idempotent (skip if already succeeded)
  const { data: purchase } = await admin
    .from("compass_credit_purchases")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntent.id as string)
    .maybeSingle();

  if (purchase?.status === "succeeded") {
    return;
  }

  // Mark purchase as succeeded
  await admin
    .from("compass_credit_purchases")
    .update({ status: "succeeded" })
    .eq("stripe_payment_intent_id", paymentIntent.id as string);

  // Add credits atomically
  const { addCredits } = await import("@/lib/compass/usage");
  await addCredits(userId, messages);

  // Audit log — use typed admin for known tables
  const typedAdmin = createAdminClient();
  await typedAdmin.from("audit_log").insert({
    action: "compass.credit_purchase.succeeded",
    entity_type: "compass_credit_purchase",
    entity_id: purchase?.id ?? (paymentIntent.id as string),
    actor_id: userId,
    new_data: {
      pack_key: packKey,
      messages,
      amount_cents: paymentIntent.amount as number,
    },
  });

}

async function handleLeasePaymentSucceeded(
  paymentIntent: Record<string, unknown>
) {
  const admin = createAdminClient();
  const metadata = paymentIntent.metadata as Record<string, string>;
  const propertyId = metadata.property_id;
  const clubId = metadata.club_id;
  const landownerId = metadata.landowner_id;
  const paymentIntentId = paymentIntent.id as string;

  if (!propertyId || !clubId) {
    console.error("[stripe-webhook] lease payment missing metadata", {
      payment_intent_id: paymentIntentId,
    });
    return;
  }

  // Idempotent: skip if already succeeded
  const { data: existing } = await admin
    .from("property_lease_payments")
    .select("id, status, period_end")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (existing?.status === "succeeded") return;

  const nowIso = new Date().toISOString();

  // Mark payment succeeded
  const { data: updated, error: updateErr } = await admin
    .from("property_lease_payments")
    .update({
      status: "succeeded",
      paid_at: nowIso,
    })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .select("id, period_end, landowner_net_cents")
    .maybeSingle();

  if (updateErr || !updated) {
    console.error("[stripe-webhook] lease payment update failed", updateErr);
    throw updateErr ?? new Error("Lease ledger row missing");
  }

  // Activate the lease on the property
  await admin
    .from("properties")
    .update({
      lease_status: "active",
      lease_paid_through: updated.period_end,
      lease_last_payment_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", propertyId);

  // Transfer landowner net to their Stripe Connect account.
  if (landownerId) {
    const { data: landowner } = await admin
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", landownerId)
      .maybeSingle();

    const destination = landowner?.stripe_connect_account_id;
    if (destination && updated.landowner_net_cents > 0) {
      try {
        const { createTransfer } = await import("@/lib/stripe/server");
        const transfer = await createTransfer(
          {
            amountCents: updated.landowner_net_cents,
            destinationAccountId: destination,
            metadata: {
              type: "property_lease_payment",
              property_id: propertyId,
              payment_intent_id: paymentIntentId,
            },
          },
          { idempotencyKey: `lease-${paymentIntentId}` }
        );

        await admin
          .from("property_lease_payments")
          .update({ stripe_transfer_id: transfer.id })
          .eq("id", updated.id);
      } catch (err) {
        console.error("[stripe-webhook] lease transfer failed", err);
      }
    } else {
      console.warn(
        "[stripe-webhook] lease paid but landowner has no Stripe Connect account",
        { propertyId, landownerId }
      );
    }
  }

  // Notify landowner
  try {
    const { notify } = await import("@/lib/notifications");
    if (landownerId) {
      await notify(admin, {
        userId: landownerId,
        type: "lease_activated",
        title: "Lease payment received",
        body: "Your upfront lease payment has cleared and the funds are on their way to your bank account.",
        link: `/landowner/properties/${propertyId}`,
      });
    }
  } catch (err) {
    console.error("[stripe-webhook] lease notification failed", err);
  }

  await admin.from("audit_log").insert({
    action: "lease.payment_succeeded",
    entity_type: "property",
    entity_id: propertyId,
    new_data: {
      payment_intent_id: paymentIntentId,
      amount_cents: paymentIntent.amount as number,
    },
  });
}

async function handleLeasePaymentFailed(
  paymentIntent: Record<string, unknown>
) {
  const admin = createAdminClient();
  const metadata = paymentIntent.metadata as Record<string, string>;
  const propertyId = metadata.property_id;
  const paymentIntentId = paymentIntent.id as string;
  const failureMessage =
    ((paymentIntent.last_payment_error as Record<string, unknown>)?.message as
      | string
      | undefined) ?? null;

  await admin
    .from("property_lease_payments")
    .update({
      status: "failed",
      failure_reason: failureMessage,
    })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (propertyId) {
    // Revert to agreed so the club can retry
    await admin
      .from("properties")
      .update({ lease_status: "agreed", updated_at: new Date().toISOString() })
      .eq("id", propertyId);
  }

  await admin.from("audit_log").insert({
    action: "lease.payment_failed",
    entity_type: "property",
    entity_id: propertyId ?? paymentIntentId,
    new_data: { payment_intent_id: paymentIntentId, reason: failureMessage },
  });
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Record<string, unknown>
) {
  const admin = createAdminClient();
  const metadata = paymentIntent.metadata as Record<string, string>;

  // Route to compass credit handler if applicable
  if (metadata?.type === "compass_credit_purchase") {
    return handleCompassCreditPurchase(paymentIntent);
  }

  if (metadata?.type === "property_lease_payment") {
    return handleLeasePaymentSucceeded(paymentIntent);
  }

  const bookingId = metadata?.booking_id;

  if (!bookingId) {
    return;
  }

  const { error } = await admin
    .from("bookings")
    .update({
      payment_status: "succeeded",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("stripe_payment_intent_id", paymentIntent.id as string);

  if (error) {
    console.error(
      "[stripe-webhook] Failed to update booking payment status:",
      error
    );
    throw error;
  }

  // Log to audit_log
  await admin.from("audit_log").insert({
    action: "stripe.payment_intent.succeeded",
    entity_type: "booking",
    entity_id: bookingId,
    new_data: {
      payment_intent_id: paymentIntent.id as string,
      amount: paymentIntent.amount as number,
    },
  });

}

async function handlePaymentIntentFailed(
  paymentIntent: Record<string, unknown>
) {
  const admin = createAdminClient();
  const metadata = paymentIntent.metadata as Record<string, string>;
  if (metadata?.type === "property_lease_payment") {
    return handleLeasePaymentFailed(paymentIntent);
  }
  const bookingId = metadata?.booking_id;

  if (!bookingId) return;

  const { error } = await admin
    .from("bookings")
    .update({
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("stripe_payment_intent_id", paymentIntent.id as string);

  if (error) {
    console.error(
      "[stripe-webhook] Failed to update booking payment failure:",
      error
    );
  }

  // Notify angler
  const { data: booking } = await admin
    .from("bookings")
    .select("angler_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (booking?.angler_id) {
    const { notify } = await import("@/lib/notifications");
    await notify(admin, {
      userId: booking.angler_id,
      type: "booking_cancelled",
      title: "Payment failed",
      body: "Your payment for a booking could not be processed. Please try again or use a different payment method.",
      link: `/angler/bookings/${bookingId}`,
    });
  }

  await admin.from("audit_log").insert({
    action: "stripe.payment_intent.payment_failed",
    entity_type: "booking",
    entity_id: bookingId,
    new_data: {
      payment_intent_id: paymentIntent.id as string,
      failure_message:
        ((paymentIntent.last_payment_error as Record<string, unknown>)
          ?.message as string) ?? null,
    },
  });

}

async function handleInvoicePaid(invoice: Record<string, unknown>) {
  const admin = createAdminClient();
  const subscriptionId = invoice.subscription as string | null;

  if (!subscriptionId) return;

  // Find the membership with this subscription
  const { data: membership } = await admin
    .from("club_memberships")
    .select("id, club_id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!membership) {
    return;
  }

  // Extract period end from invoice line items
  const lines = invoice.lines as { data?: Array<{ period?: { end?: number } }> } | undefined;
  const periodEndTs = lines?.data?.[0]?.period?.end ?? null;

  await admin
    .from("club_memberships")
    .update({
      dues_status: "active",
      dues_paid_through: periodEndTs
        ? toDateString(new Date(periodEndTs * 1000))
        : null,
      grace_period_ends: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id);

  // Record payment
  const amountPaid = (invoice.amount_paid as number) ?? 0;
  const periodEndDate = periodEndTs
    ? toDateString(new Date(periodEndTs * 1000))
    : null;
  const periodStartDate = periodEndTs
    ? toDateString(new Date((periodEndTs - 365 * 86400) * 1000))
    : null;

  await admin.from("membership_payments").insert({
    club_id: membership.club_id!,
    user_id: membership.user_id!,
    membership_id: membership.id!,
    type: "annual_dues" as const,
    club_amount: amountPaid / 100,
    processing_fee: 0,
    total_charged: amountPaid / 100,
    club_payout: amountPaid / 100,
    stripe_subscription_id: subscriptionId ?? undefined,
    stripe_invoice_id: invoice.id as string,
    status: "succeeded" as const,
    period_start: periodStartDate,
    period_end: periodEndDate,
  });

  await admin.from("audit_log").insert({
    action: "stripe.invoice.paid",
    entity_type: "club_membership",
    entity_id: membership.id,
    new_data: {
      invoice_id: invoice.id as string,
      subscription_id: subscriptionId ?? "",
      amount_paid: amountPaid,
    },
  });

}

async function handleInvoicePaymentFailed(
  invoice: Record<string, unknown>
) {
  const admin = createAdminClient();
  const subscriptionId = invoice.subscription as string | null;

  if (!subscriptionId) return;

  const { data: membership } = await admin
    .from("club_memberships")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!membership) return;

  // Start grace period (7 days)
  const gracePeriodEnds = new Date();
  gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 7);

  await admin
    .from("club_memberships")
    .update({
      dues_status: "grace_period",
      grace_period_ends: toDateString(gracePeriodEnds),
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id);

  // Notify member
  const { notify } = await import("@/lib/notifications");
  await notify(admin, {
    userId: membership.user_id!,
    type: "membership_dues_failed",
    title: "Dues payment failed",
    body: "Your annual membership dues payment failed. Please update your payment method within 7 days to avoid losing your membership.",
    link: "/angler/membership",
  });

  await admin.from("audit_log").insert({
    action: "stripe.invoice.payment_failed",
    entity_type: "club_membership",
    entity_id: membership.id,
    new_data: {
      invoice_id: invoice.id as string,
      subscription_id: subscriptionId ?? "",
      attempt_count: (invoice.attempt_count as number) ?? 0,
    },
  });

}

async function handleSubscriptionCreated(
  subscription: Record<string, unknown>
) {
  const admin = createAdminClient();
  const metadata = subscription.metadata as Record<string, string> | undefined;
  const membershipId = metadata?.membership_id;

  if (!membershipId) return;

  await admin
    .from("club_memberships")
    .update({
      stripe_subscription_id: subscription.id as string,
      dues_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId);

  await admin.from("audit_log").insert({
    action: "stripe.customer.subscription.created",
    entity_type: "club_membership",
    entity_id: membershipId,
    new_data: {
      subscription_id: subscription.id as string,
      status: subscription.status as string,
    },
  });

}

async function handleSubscriptionUpdated(
  subscription: Record<string, unknown>
) {
  const admin = createAdminClient();
  const subscriptionId = subscription.id as string;

  const { data: membership } = await admin
    .from("club_memberships")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!membership) return;

  const status = subscription.status as string;
  let duesStatus: string;

  switch (status) {
    case "active":
      duesStatus = "active";
      break;
    case "past_due":
      duesStatus = "past_due";
      break;
    case "canceled":
    case "unpaid":
      duesStatus = "lapsed";
      break;
    default:
      duesStatus = "active";
  }

  await admin
    .from("club_memberships")
    .update({
      dues_status: duesStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id);

  await admin.from("audit_log").insert({
    action: "stripe.customer.subscription.updated",
    entity_type: "club_membership",
    entity_id: membership.id,
    new_data: {
      subscription_id: subscriptionId,
      status,
      dues_status: duesStatus,
    },
  });

}

async function handleSubscriptionDeleted(
  subscription: Record<string, unknown>
) {
  const admin = createAdminClient();
  const subscriptionId = subscription.id as string;

  const { data: membership } = await admin
    .from("club_memberships")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!membership) return;

  await admin
    .from("club_memberships")
    .update({
      dues_status: "lapsed",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id);

  // Notify member
  const { notify } = await import("@/lib/notifications");
  await notify(admin, {
    userId: membership.user_id!,
    type: "membership_cancelled",
    title: "Membership cancelled",
    body: "Your club membership has been cancelled. You can rejoin at any time.",
    link: "/angler/membership",
  });

  await admin.from("audit_log").insert({
    action: "stripe.customer.subscription.deleted",
    entity_type: "club_membership",
    entity_id: membership.id,
    new_data: { subscription_id: subscriptionId },
  });

}

// ─── Payout Handlers (Finance Ops Layer) ──────────────────────────

async function handlePayoutCreated(payoutObj: Record<string, unknown>) {
  const { ingestPayout } = await import("@/lib/finance/stripe-payouts");
  await ingestPayout(payoutObj);
}

async function handlePayoutPaid(payoutObj: Record<string, unknown>) {
  const { markPayoutPaid } = await import("@/lib/finance/stripe-payouts");
  await markPayoutPaid(payoutObj);
}

async function handlePayoutFailed(payoutObj: Record<string, unknown>) {
  const { markPayoutFailed } = await import("@/lib/finance/stripe-payouts");
  await markPayoutFailed(payoutObj);
}

async function handleChargeDisputeCreated(
  dispute: Record<string, unknown>
) {
  const admin = createAdminClient();

  // Log dispute for admin review
  await admin.from("audit_log").insert({
    action: "stripe.charge.dispute.created",
    entity_type: "dispute",
    entity_id: dispute.id as string,
    new_data: {
      charge_id: dispute.charge as string,
      amount: dispute.amount as number,
      reason: dispute.reason as string,
      status: dispute.status as string,
    },
  });

  console.info(
    `[stripe-webhook] dispute.created: ${dispute.id} reason=${dispute.reason} amount=${dispute.amount}`
  );
}

// ─── Main Handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const killed = await requireEnabled("webhooks.stripe");
  if (killed) return killed;

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const sigHeader = request.headers.get("stripe-signature");
  if (!sigHeader) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  const body = await request.text();

  if (!verifySignature(body, sigHeader, secret)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const event = JSON.parse(body);

  // Idempotency check
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    console.info(`[stripe-webhook] Duplicate event ${event.id}, skipping`);
    return NextResponse.json({ received: true });
  }

  try {
    const obj = event.data.object;

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(obj);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(obj);
        break;
      case "invoice.paid":
        await handleInvoicePaid(obj);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(obj);
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(obj);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(obj);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(obj);
        break;
      case "charge.dispute.created":
        await handleChargeDisputeCreated(obj);
        break;
      case "payout.created":
        await handlePayoutCreated(obj);
        break;
      case "payout.paid":
        await handlePayoutPaid(obj);
        break;
      case "payout.failed":
        await handlePayoutFailed(obj);
        break;
      default:
        console.info(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await admin.from("stripe_webhook_events").insert({
      id: event.id,
      type: event.type,
      data: { object_id: obj.id },
    });
  } catch (err) {
    captureApiError(err, {
      route: "webhooks/stripe",
      extra: { event_type: event.type, event_id: event.id },
    });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
