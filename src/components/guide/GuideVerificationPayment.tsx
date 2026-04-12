"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/shared/StripeProvider";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { GUIDE_VERIFICATION_FEE_DISPLAY } from "@/lib/constants/fees";

interface GuideVerificationPaymentProps {
  /** Called after payment is confirmed successfully */
  onSuccess: () => void;
}

export default function GuideVerificationPayment({
  onSuccess,
}: GuideVerificationPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function initPayment() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/guides/verification", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start verification");
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-charcoal/20 bg-charcoal/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-charcoal/10">
              <ShieldCheck className="size-5 text-charcoal" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                One-Time Verification Fee
              </p>
              <p className="text-xs text-text-secondary">
                Covers background check via Checkr. Processed&nbsp;securely
                by&nbsp;Stripe.
              </p>
            </div>
            <span className="text-lg font-bold text-charcoal">
              {GUIDE_VERIFICATION_FEE_DISPLAY}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <Button
          onClick={initPayment}
          disabled={loading}
          className="w-full bg-charcoal text-white hover:bg-charcoal/90"
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 size-4" />
          )}
          Pay {GUIDE_VERIFICATION_FEE_DISPLAY} &amp; Start Verification
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-charcoal/20 bg-charcoal/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            Verification Fee
          </span>
          <span className="text-lg font-semibold text-charcoal">
            {GUIDE_VERIFICATION_FEE_DISPLAY}
          </span>
        </div>
      </div>

      <StripeProvider clientSecret={clientSecret}>
        <VerificationPaymentInner onSuccess={onSuccess} />
      </StripeProvider>

      <div className="flex items-center gap-2 text-xs text-text-light">
        <Lock className="size-3" />
        <span>
          Secured by Stripe. Your payment details never touch our&nbsp;servers.
        </span>
      </div>
    </div>
  );
}

function VerificationPaymentInner({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/guide/verification?payment=success`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    setSucceeded(true);
    setTimeout(onSuccess, 1200);
  }

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="size-6 text-green-600" />
        </div>
        <p className="font-medium text-text-primary">Payment received!</p>
        <p className="text-center text-sm text-text-secondary">
          Your background check will begin shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-charcoal text-white hover:bg-charcoal/90"
      >
        {submitting ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 size-4" />
        )}
        {submitting ? "Processing..." : `Pay ${GUIDE_VERIFICATION_FEE_DISPLAY}`}
      </Button>
    </form>
  );
}
