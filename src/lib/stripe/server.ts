import "server-only";

import Stripe from "stripe";

/**
 * Server-side Stripe instance (lazy singleton).
 * Only use in API routes and server actions — never import on the client.
 */
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

/** Convenience alias — most callers use `stripe.xxx()` directly. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripeServer(), prop, receiver);
  },
});

// ─── Customer Helpers ──────────────────────────────────────────────

/** Get or create a Stripe Customer for a user. */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Search for existing customer by metadata
  const existing = await stripe.customers.list({
    limit: 1,
    email,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  return customer.id;
}

// ─── SetupIntent (save payment method without charging) ────────────

export async function createSetupIntent(customerId: string) {
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card", "us_bank_account"],
  });
}

// ─── PaymentIntent (authorize / capture) ───────────────────────────

export async function createPaymentIntent(opts: {
  amountCents: number;
  customerId: string;
  metadata: Record<string, string>;
  captureMethod?: "manual" | "automatic";
  paymentMethodId?: string;
  transferGroup?: string;
}) {
  return stripe.paymentIntents.create({
    amount: opts.amountCents,
    currency: "usd",
    customer: opts.customerId,
    capture_method: opts.captureMethod ?? "manual",
    metadata: opts.metadata,
    payment_method: opts.paymentMethodId ?? undefined,
    transfer_group: opts.transferGroup ?? undefined,
  });
}

export async function capturePaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId);
}

// ─── Payment Methods ───────────────────────────────────────────────

export async function listPaymentMethods(customerId: string) {
  const [cards, bankAccounts] = await Promise.all([
    stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    }),
    stripe.paymentMethods.list({
      customer: customerId,
      type: "us_bank_account",
    }),
  ]);

  return {
    cards: cards.data,
    bankAccounts: bankAccounts.data,
  };
}

export async function detachPaymentMethod(paymentMethodId: string) {
  return stripe.paymentMethods.detach(paymentMethodId);
}

export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  return stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
}

// ─── Subscriptions ─────────────────────────────────────────────────

export async function createSubscription(opts: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
}) {
  return stripe.subscriptions.create({
    customer: opts.customerId,
    items: [{ price: opts.priceId }],
    metadata: opts.metadata ?? {},
    default_payment_method: opts.paymentMethodId ?? undefined,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    expand: ["latest_invoice.payment_intent"],
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

// ─── Connect Transfers ─────────────────────────────────────────────

export async function createTransfer(
  opts: {
    amountCents: number;
    destinationAccountId: string;
    transferGroup?: string;
    metadata?: Record<string, string>;
  },
  requestOptions?: { idempotencyKey?: string }
) {
  return stripe.transfers.create(
    {
      amount: opts.amountCents,
      currency: "usd",
      destination: opts.destinationAccountId,
      transfer_group: opts.transferGroup ?? undefined,
      metadata: opts.metadata ?? {},
    },
    requestOptions?.idempotencyKey
      ? { idempotencyKey: requestOptions.idempotencyKey }
      : undefined
  );
}

// ─── Connect Account Helpers ───────────────────────────────────────

export async function createConnectAccount(email: string) {
  return stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

export async function createAccountLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  return stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
}

export async function getConnectAccount(accountId: string) {
  return stripe.accounts.retrieve(accountId);
}
