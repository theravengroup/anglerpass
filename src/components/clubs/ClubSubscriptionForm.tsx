"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/shared/StripeProvider";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CheckCircle2, Zap } from "lucide-react";
import {
  STRIPE_PRICE_IDS,
  CLUB_TIER_CONFIG,
  type ClubTier,
} from "@/lib/constants/stripe-prices";

interface ClubSubscriptionFormProps {
  clubId: string;
  currentTier?: ClubTier | null;
  /** Called after subscription is confirmed */
  onSuccess?: (tier: ClubTier) => void;
}

export default function ClubSubscriptionForm({
  clubId,
  currentTier,
  onSuccess,
}: ClubSubscriptionFormProps) {
  const tiers = Object.fromEntries(
    Object.entries(CLUB_TIER_CONFIG).map(([tier, config]) => [
      tier,
      { ...config, priceId: STRIPE_PRICE_IDS[tier as ClubTier] },
    ])
  ) as Record<ClubTier, { name: string; price: number; priceId: string; features: string[] }>;
  const [selectedTier, setSelectedTier] = useState<ClubTier | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSelectTier(tier: ClubTier) {
    setSelectedTier(tier);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/club-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          priceId: tiers[tier].priceId,
          tier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create subscription");
      }

      const data = await res.json();

      if (data.upgraded) {
        // Tier changed on existing subscription, no payment needed
        setSuccess(true);
        onSuccess?.(tier);
        return;
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        // Already active
        setSuccess(true);
        onSuccess?.(tier);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSelectedTier(null);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <CheckCircle2 className="size-10 text-river" />
        <h3 className="text-base font-medium text-text-primary">
          Subscription {currentTier ? "Updated" : "Active"}!
        </h3>
        <p className="text-center text-sm text-text-secondary">
          Your club is now on the{" "}
          <span className="font-medium capitalize">{selectedTier}</span> plan.
        </p>
      </div>
    );
  }

  if (clientSecret && selectedTier) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-river/20 bg-river/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium capitalize text-text-primary">
                {tiers[selectedTier].name} Plan
              </span>
              <p className="text-xs text-text-light">Billed monthly</p>
            </div>
            <span className="text-lg font-semibold text-river">
              ${tiers[selectedTier].price}/mo
            </span>
          </div>
        </div>

        <StripeProvider clientSecret={clientSecret}>
          <SubscriptionPaymentInner
            amount={tiers[selectedTier].price}
            onSuccess={() => {
              setSuccess(true);
              onSuccess?.(selectedTier);
            }}
            onBack={() => {
              setClientSecret(null);
              setSelectedTier(null);
            }}
          />
        </StripeProvider>

        <div className="flex items-center gap-2 text-xs text-text-light">
          <Lock className="size-3" />
          <span>Secured by Stripe. Cancel anytime.</span>
        </div>
      </div>
    );
  }

  // Tier selection
  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <div className="grid gap-3">
        {(Object.entries(tiers) as [ClubTier, { name: string; price: number; priceId: string; features: string[] }][]).map(([tier, config]) => {
          const isCurrent = tier === currentTier;

          return (
            <button
              key={tier}
              type="button"
              onClick={() => !isCurrent && handleSelectTier(tier)}
              disabled={loading || isCurrent}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                isCurrent
                  ? "border-river/30 bg-river/5"
                  : "border-border hover:border-river/40 hover:bg-river/5"
              } ${loading ? "opacity-50" : ""}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    {config.name}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-river/10 px-2 py-0.5 text-xs font-medium text-river">
                      Current
                    </span>
                  )}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {config.features.slice(0, 3).map((f) => (
                    <li key={f} className="text-xs text-text-secondary">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="ml-4 text-right">
                <span className="text-lg font-bold text-river">
                  ${config.price}
                </span>
                <span className="text-xs text-text-light">/mo</span>
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="size-4 animate-spin text-river" />
          <span className="text-sm text-text-secondary">Setting up subscription...</span>
        </div>
      )}
    </div>
  );
}

// ─── Inner payment form ────────────────────────────────────────────

function SubscriptionPaymentInner({
  amount,
  onSuccess,
  onBack,
}: {
  amount: number;
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
        return_url: `${window.location.origin}${window.location.pathname}?subscription=success`,
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
          className="flex-1 bg-river text-white hover:bg-river/90"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Zap className="size-4" />
              Subscribe — ${amount}/mo
            </>
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
