import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireAuth } from "@/lib/api/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listPaymentMethods,
  detachPaymentMethod,
  setDefaultPaymentMethod,
} from "@/lib/stripe/server";

/**
 * GET /api/stripe/payment-methods
 *
 * Lists the current user's saved payment methods (cards + bank accounts).
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return jsonOk({ cards: [], bankAccounts: [] });
    }

    const methods = await listPaymentMethods(profile.stripe_customer_id);

    // Transform to a clean shape for the client
    const cards = methods.cards.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? "unknown",
      last4: pm.card?.last4 ?? "0000",
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
      name: pm.billing_details.name ?? "",
    }));

    const bankAccounts = methods.bankAccounts.map((pm) => ({
      id: pm.id,
      bankName: pm.us_bank_account?.bank_name ?? "Bank",
      last4: pm.us_bank_account?.last4 ?? "0000",
      accountType: pm.us_bank_account?.account_type ?? "checking",
      name: pm.billing_details.name ?? "",
    }));

    return jsonOk({ cards, bankAccounts });
  } catch (err) {
    console.error("[stripe/payment-methods] GET error:", err);
    return jsonError("Failed to list payment methods", 500);
  }
}

/**
 * DELETE /api/stripe/payment-methods?id=pm_xxx
 *
 * Detaches a payment method from the customer.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const paymentMethodId = searchParams.get("id");

  if (!paymentMethodId) {
    return jsonError("Missing payment method ID", 400);
  }

  try {
    await detachPaymentMethod(paymentMethodId);
    return jsonOk({ detached: true });
  } catch (err) {
    console.error("[stripe/payment-methods] DELETE error:", err);
    return jsonError("Failed to remove payment method", 500);
  }
}

/**
 * PUT /api/stripe/payment-methods
 *
 * Sets a payment method as the default for the customer.
 * Body: { paymentMethodId: string }
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const { paymentMethodId } = body as { paymentMethodId: string };

    if (!paymentMethodId) {
      return jsonError("Missing paymentMethodId", 400);
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return jsonError("No Stripe customer found", 404);
    }

    await setDefaultPaymentMethod(profile.stripe_customer_id, paymentMethodId);

    return jsonOk({ default: paymentMethodId });
  } catch (err) {
    console.error("[stripe/payment-methods] PUT error:", err);
    return jsonError("Failed to set default payment method", 500);
  }
}
