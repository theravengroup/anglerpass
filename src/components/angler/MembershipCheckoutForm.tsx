"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/shared/StripeProvider";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { MEMBERSHIP_PROCESSING_FEE_RATE } from "@/lib/constants/fees";

interface MembershipCheckoutFormProps {
  club: {
    id: string;
    name: string;
    initiation_fee: number | null;
    annual_dues: number | null;
  };
  /** Stripe Price ID for recurring dues (if the club has one configured) */
  duesPriceId?: string;
  /** Called after payment is confirmed */
  onSuccess?: (membershipId: string) => void;
}

type CheckoutStep = "review" | "payment" | "success";

export default function MembershipCheckoutForm({
  club,
  duesPriceId,
  onSuccess,
}: MembershipCheckoutFormProps) {
  const [step, setStep] = useState<CheckoutStep>("review");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiationFee = club.initiation_fee ?? 0;
  const annualDues = club.annual_dues ?? 0;
  const processingFee =
    Math.round((initiationFee + annualDues) * MEMBERSHIP_PROCESSING_FEE_RATE * 100) / 100;
  const totalDueToday = initiationFee + annualDues + processingFee;

  async function handleProceedToPayment() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/membership-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: club.id,
          duesPriceId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to start checkout");
      }

      const data = await res.json();
      setMembershipId(data.membershipId);

      // Use the initiation client secret first, or the subscription one
      const secret = data.initiationClientSecret ?? data.subscriptionClientSecret;

      if (secret) {
        setClientSecret(secret);
        setStep("payment");
      } else {
        // No payment needed (free club)
        setStep("success");
        onSuccess?.(data.membershipId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 className="size-10 text-forest" />
        <h3 className="text-base font-medium text-text-primary">
          Welcome to {club.name}!
        </h3>
        <p className="text-center text-sm text-text-secondary">
          Your membership is now active. You can start browsing properties.
        </p>
      </div>
    );
  }

  if (step === "payment" && clientSecret) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              Membership Payment
            </span>
            <span className="text-lg font-semibold text-forest">
              ${totalDueToday.toFixed(2)}
            </span>
          </div>
        </div>

        <StripeProvider clientSecret={clientSecret}>
          <MembershipPaymentInner
            totalAmount={totalDueToday}
            onSuccess={() => {
              setStep("success");
              if (membershipId) onSuccess?.(membershipId);
            }}
            onBack={() => {
              setStep("review");
              setClientSecret(null);
            }}
          />
        </StripeProvider>

        <div className="flex items-center gap-2 text-xs text-text-light">
          <Lock className="size-3" />
          <span>Secured by Stripe. Your payment details never touch our servers.</span>
        </div>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-text-primary">
        Join {club.name}
      </h3>

      <div className="space-y-2 rounded-lg border border-border bg-offwhite/50 p-4">
        {initiationFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Initiation Fee</span>
            <span className="font-medium">${initiationFee.toFixed(2)}</span>
          </div>
        )}
        {annualDues > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Annual Dues</span>
            <span className="font-medium">${annualDues.toFixed(2)}/yr</span>
          </div>
        )}
        {processingFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-light">
              Processing Fee ({(MEMBERSHIP_PROCESSING_FEE_RATE * 100).toFixed(1)}%)
            </span>
            <span className="text-text-light">${processingFee.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2">
          <div className="flex justify-between text-sm font-semibold">
            <span>Due Today</span>
            <span className="text-forest">${totalDueToday.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {annualDues > 0 && (
        <p className="text-xs text-text-light">
          Annual dues of ${annualDues.toFixed(2)} will renew automatically each year.
          You can cancel anytime from your membership settings.
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <Button
        onClick={handleProceedToPayment}
        disabled={loading}
        className="w-full bg-forest text-white hover:bg-forest/90"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          `Join for $${totalDueToday.toFixed(2)}`
        )}
      </Button>
    </div>
  );
}

// ─── Inner payment form (inside StripeProvider) ────────────────────

function MembershipPaymentInner({
  totalAmount,
  onSuccess,
  onBack,
}: {
  totalAmount: number;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?membership=success`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 bg-forest text-white hover:bg-forest/90"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            `Pay $${totalAmount.toFixed(2)}`
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </Button>
      </div>
    </form>
  );
}
