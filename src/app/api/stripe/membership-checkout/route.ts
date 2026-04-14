import Stripe from "stripe";
import { jsonOk, jsonError, requireAuth, handleStripeError } from "@/lib/api/helpers";
import { rateLimit, getClientIp } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateCustomer,
  createPaymentIntent,
  stripe,
} from "@/lib/stripe/server";
import { MEMBERSHIP_PROCESSING_FEE_RATE, roundCurrency } from "@/lib/constants/fees";
import { membershipCheckoutSchema } from "@/lib/validations/stripe";
import { requireEnabled } from "@/lib/feature-flags";
import { captureApiError } from "@/lib/observability";

/**
 * POST /api/stripe/membership-checkout
 *
 * Handles membership payment:
 * 1. One-time initiation fee via PaymentIntent
 * 2. Recurring annual dues via Subscription (if duesPriceId provided)
 *
 * Platform fee (5%) is added to both.
 */
export async function POST(request: Request) {
  const killed = await requireEnabled("stripe.membership_checkout");
  if (killed) return killed;

  const limited = rateLimit("stripe-membership", getClientIp(request), 5, 60_000);
  if (limited) return limited;

  const auth = await requireAuth();
  if (!auth) return jsonError("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = membershipCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Invalid request body", 400);
    }

    const { clubId, duesPriceId, membershipType, invitationToken, companyName } = parsed.data;
    const admin = createAdminClient();

    // ── corporate_employee: validate invitation before anything else ──
    let corporateSponsorId: string | undefined;
    let resolvedCompanyName: string | undefined = companyName;

    if (membershipType === "corporate_employee") {
      if (!invitationToken) {
        return jsonError("Invitation token is required for corporate employee memberships", 400);
      }

      const { data: invitation } = await admin
        .from("corporate_invitations")
        .select("id, status, club_id, corporate_member_id, email")
        .eq("token", invitationToken)
        .maybeSingle();

      if (!invitation) {
        return jsonError("Invalid invitation token", 404);
      }
      if (invitation.status !== "pending") {
        return jsonError("This invitation has already been used or has expired", 400);
      }
      if (invitation.club_id !== clubId) {
        return jsonError("Club ID mismatch", 400);
      }

      // Bind the invitation to the email it was sent to. A leaked token
      // otherwise lets any signed-in user consume the sponsor's seat.
      const userEmail = auth.user.email?.toLowerCase() ?? "";
      const invitedEmail = invitation.email?.toLowerCase() ?? "";
      if (!userEmail || !invitedEmail || userEmail !== invitedEmail) {
        return jsonError(
          "This invitation was sent to a different email address. Sign in with the invited address to accept it.",
          403
        );
      }

      // Look up the corporate sponsor's membership
      const { data: sponsorMembership } = await admin
        .from("club_memberships")
        .select("id, company_name")
        .eq("id", invitation.corporate_member_id)
        .maybeSingle();

      if (!sponsorMembership) {
        return jsonError("Corporate sponsor membership not found", 404);
      }

      corporateSponsorId = sponsorMembership.id;
      resolvedCompanyName = sponsorMembership.company_name ?? undefined;
    }

    // ── Get the club's fee structure ──────────────────────────────────
    const { data: club } = await admin
      .from("clubs")
      .select("id, name, initiation_fee, annual_dues, corporate_initiation_fee, corporate_memberships_enabled")
      .eq("id", clubId)
      .maybeSingle();

    if (!club) {
      return jsonError("Club not found", 404);
    }

    if (membershipType === "corporate" && !club.corporate_memberships_enabled) {
      return jsonError("This club does not offer corporate memberships", 400);
    }

    // Check if user already has a membership with this club
    const { data: existingMembership } = await admin
      .from("club_memberships")
      .select("id, status")
      .eq("club_id", clubId)
      .eq("user_id", auth.user.id)
      .in("status", ["active", "pending"])
      .maybeSingle();

    if (existingMembership?.status === "active") {
      return jsonError("You already have an active membership with this club", 409);
    }

    // Get or create Stripe Customer
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, stripe_customer_id")
      .eq("id", auth.user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      customerId = await getOrCreateCustomer(
        auth.user.id,
        auth.user.email ?? "",
        profile?.display_name ?? undefined
      );

      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", auth.user.id);
    }

    // ── Use existing pending membership or create new one ─────────────
    let membershipId: string;

    if (existingMembership?.status === "pending") {
      membershipId = existingMembership.id;

      await admin
        .from("club_memberships")
        .update({
          dues_status: "pending",
          updated_at: new Date().toISOString(),
          ...(membershipType !== "individual" && {
            membership_type: membershipType,
            ...(resolvedCompanyName ? { company_name: resolvedCompanyName } : {}),
            ...(membershipType === "corporate_employee" && corporateSponsorId
              ? { corporate_sponsor_id: corporateSponsorId }
              : {}),
          }),
        })
        .eq("id", existingMembership.id);
    } else {
      const { data: membership, error: membershipError } = await admin
        .from("club_memberships")
        .insert({
          club_id: clubId,
          user_id: auth.user.id,
          role: "member",
          status: "pending",
          dues_status: "pending",
          membership_type: membershipType,
          ...(resolvedCompanyName ? { company_name: resolvedCompanyName } : {}),
          ...(corporateSponsorId ? { corporate_sponsor_id: corporateSponsorId } : {}),
        })
        .select("id")
        .single();

      if (membershipError || !membership) {
        console.error("[membership-checkout] Failed to create membership:", membershipError);
        return jsonError("Failed to create membership", 500);
      }
      membershipId = membership.id;
    }

    const result: {
      membershipId: string;
      initiationClientSecret?: string | null;
      subscriptionClientSecret?: string | null;
      initiationAmount?: number;
      duesAmount?: number;
      processingFee?: number;
    } = { membershipId };

    // ── 1. Initiation fee PaymentIntent ───────────────────────────────
    // Corporate employees skip initiation fee entirely
    let initiationFee: number;
    if (membershipType === "corporate_employee") {
      initiationFee = 0;
    } else if (membershipType === "corporate") {
      initiationFee = club.corporate_initiation_fee ?? 0;
    } else {
      initiationFee = club.initiation_fee ?? 0;
    }

    if (initiationFee > 0) {
      const processingFee = roundCurrency(initiationFee * MEMBERSHIP_PROCESSING_FEE_RATE);
      const totalCents = Math.round((initiationFee + processingFee) * 100);

      const pi = await createPaymentIntent({
        amountCents: totalCents,
        customerId,
        captureMethod: "automatic",
        metadata: {
          type: "membership_initiation",
          membership_type: membershipType,
          club_id: clubId,
          membership_id: membershipId,
          user_id: auth.user.id,
          initiation_fee: String(initiationFee),
          processing_fee: String(processingFee),
        },
      });

      result.initiationClientSecret = pi.client_secret;
      result.initiationAmount = initiationFee;
      result.processingFee = processingFee;
    }

    // ── 2. Recurring dues Subscription ───────────────────────────────
    if (duesPriceId) {
      const subscriptionMetadata: Record<string, string> = {
        type: "membership_dues",
        membership_type: membershipType,
        club_id: clubId,
        membership_id: membershipId,
      };

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: duesPriceId }],
        metadata: subscriptionMetadata,
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
      });

      // Extract the client secret from the subscription's first invoice
      const invoice = subscription.latest_invoice as
        | (Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string | null })
        | null;
      if (invoice) {
        const pi = invoice.payment_intent;
        if (pi && typeof pi !== "string") {
          result.subscriptionClientSecret = pi.client_secret;
        }
      }

      // Store subscription ID on membership
      await admin
        .from("club_memberships")
        .update({ stripe_subscription_id: subscription.id })
        .eq("id", membershipId);

      result.duesAmount = club.annual_dues ?? 0;
    }

    // ── 3. Mark corporate employee invitation as accepted ─────────────
    if (membershipType === "corporate_employee" && invitationToken) {
      const { data: invitation } = await admin
        .from("corporate_invitations")
        .select("id")
        .eq("token", invitationToken)
        .maybeSingle();

      if (invitation) {
        await admin
          .from("corporate_invitations")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("id", invitation.id);
      }
    }

    return jsonOk(result);
  } catch (err) {
    const breakerResponse = handleStripeError(err);
    if (breakerResponse) return breakerResponse;
    captureApiError(err, {
      route: "stripe/membership-checkout",
      userId: auth.user.id,
    });
    return jsonError("Failed to process membership checkout", 500);
  }
}
