"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/shared/StripeProvider";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/* ── Confirm with saved card ──────────────────────────────────── */

interface ConfirmWithSavedCardProps {
  clientSecret: string;
  paymentMethodId: string;
  totalAmount: number;
  onSuccess: () => void;
  onBack?: () => void;
}

export function ConfirmWithSavedCard({
  clientSecret,
  paymentMethodId,
  totalAmount,
  onSuccess,
  onBack,
}: ConfirmWithSavedCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <StripeProvider clientSecret={clientSecret}>
      <ConfirmWithSavedCardInner
        clientSecret={clientSecret}
        paymentMethodId={paymentMethodId}
        totalAmount={totalAmount}
        onSuccess={onSuccess}
        onBack={onBack}
        confirming={confirming}
        setConfirming={setConfirming}
        error={error}
        setError={setError}
      />
    </StripeProvider>
  );
}

function ConfirmWithSavedCardInner({
  clientSecret,
  paymentMethodId,
  totalAmount,
  onSuccess,
  onBack,
  confirming,
  setConfirming,
  error,
  setError,
}: {
  clientSecret: string;
  paymentMethodId: string;
  totalAmount: number;
  onSuccess: () => void;
  onBack?: () => void;
  confirming: boolean;
  setConfirming: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
}) {
  const stripe = useStripe();

  async function handleConfirm() {
    if (!stripe) return;
    setConfirming(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        payment_method: paymentMethodId,
        return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setConfirming(false);
      return;
    }

    onSuccess();
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!stripe || confirming}
          className="flex-1 bg-bronze text-white hover:bg-bronze/90"
        >
          {confirming ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            `Authorize $${totalAmount.toFixed(2)}`
          )}
        </Button>
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={confirming}>
            Back
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── New card payment form ────────────────────────────────────── */

interface NewCardPaymentFormProps {
  totalAmount: number;
  onSuccess: () => void;
  onBack?: () => void;
}

export function NewCardPaymentForm({
  totalAmount,
  onSuccess,
  onBack,
}: NewCardPaymentFormProps) {
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
        return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
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
          className="flex-1 bg-bronze text-white hover:bg-bronze/90"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            `Authorize $${totalAmount.toFixed(2)}`
          )}
        </Button>
        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={submitting}
          >
            Back
          </Button>
        )}
      </div>
    </form>
  );
}
