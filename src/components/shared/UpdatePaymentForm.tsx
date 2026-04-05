"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/shared/StripeProvider";
import { Button } from "@/components/ui/button";

interface UpdatePaymentFormProps {
  /** Called after the payment method is successfully saved */
  onSuccess?: () => void;
  /** Called when the user cancels */
  onCancel?: () => void;
  /** Button label (defaults to "Save Payment Method") */
  submitLabel?: string;
}

function PaymentFormInner({
  onSuccess,
  onCancel,
  submitLabel = "Save Payment Method",
}: UpdatePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?payment_saved=true`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    // Success — payment method is saved to the customer
    setSubmitting(false);
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1"
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

/**
 * Standalone payment method form that:
 * 1. Fetches a SetupIntent client_secret from our API
 * 2. Renders a Stripe PaymentElement (cards + bank accounts)
 * 3. Confirms the SetupIntent to save the method on the customer
 *
 * Must be used inside a page/modal — not inside another StripeProvider.
 */
export function UpdatePaymentForm(props: UpdatePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  async function initSetupIntent() {
    setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch("/api/stripe/setup-intent", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to initialize");
      }
      const data = await res.json();
      setClientSecret(data.clientSecret);
      setVisible(true);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setVisible(false);
    setClientSecret(null);
    props.onCancel?.();
  }

  function handleSuccess() {
    setVisible(false);
    setClientSecret(null);
    props.onSuccess?.();
  }

  if (!visible) {
    return (
      <div>
        <Button
          onClick={initSetupIntent}
          disabled={loading}
          variant="outline"
          className="border-forest/20 text-forest hover:bg-forest/5"
        >
          {loading ? "Loading..." : "Add Payment Method"}
        </Button>
        {fetchError && (
          <p className="mt-2 text-sm text-destructive" role="alert" aria-live="polite">
            {fetchError}
          </p>
        )}
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <StripeProvider clientSecret={clientSecret}>
        <PaymentFormInner
          {...props}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </StripeProvider>
    </div>
  );
}
