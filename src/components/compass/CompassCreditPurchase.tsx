"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/shared/StripeProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Sparkles } from "lucide-react";
import {
  CREDIT_PACKS,
  formatPrice,
  type CreditPack,
} from "@/lib/constants/compass-usage";

interface CompassCreditPurchaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  suggestedPack?: string | null;
}

export default function CompassCreditPurchase({
  open,
  onOpenChange,
  onSuccess,
  suggestedPack,
}: CompassCreditPurchaseProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPack = async (pack: CreditPack) => {
    setSelectedPack(pack);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/compass/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packKey: pack.key }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create payment");
      }

      const { clientSecret: cs } = await res.json();
      setClientSecret(cs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSelectedPack(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedPack(null);
    setClientSecret(null);
    setError(null);
    onOpenChange(false);
  };

  const handlePaymentSuccess = () => {
    handleClose();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        aria-label="Purchase Compass credits"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl">
            <Sparkles className="h-5 w-5 text-bronze" />
            Get More Compass Messages
          </DialogTitle>
          <DialogDescription>
            Purchase additional messages for AnglerPass Compass. Credits never
            expire and are used after your monthly allocation runs out.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {!clientSecret ? (
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.key}
                onClick={() => handleSelectPack(pack)}
                disabled={loading}
                className={`relative flex flex-col items-center rounded-xl border-2 p-4 transition-all hover:border-bronze hover:shadow-md ${
                  suggestedPack === pack.key
                    ? "border-bronze bg-bronze/5"
                    : "border-stone-light bg-white"
                } ${loading ? "opacity-50" : ""}`}
              >
                {suggestedPack === pack.key && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-bronze px-2 py-0.5 text-[10px] font-medium text-white">
                    Suggested
                  </span>
                )}
                <span className="text-lg font-semibold text-text-primary">
                  {pack.label}
                </span>
                <span className="mt-1 text-xl font-bold text-bronze">
                  {formatPrice(pack.priceCents)}
                </span>
                <span className="mt-0.5 text-xs text-text-light">
                  {formatPrice(
                    Math.round((pack.priceCents / pack.messages) * 100) / 100
                  )}
                  /msg
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-parchment-light px-4 py-3">
              <div>
                <p className="font-medium text-text-primary">
                  {selectedPack?.label}
                </p>
                <p className="text-sm text-text-secondary">
                  Additional Compass messages
                </p>
              </div>
              <p className="text-lg font-bold text-bronze">
                {selectedPack ? formatPrice(selectedPack.priceCents) : ""}
              </p>
            </div>

            <StripeProvider clientSecret={clientSecret}>
              <CreditPaymentForm
                onSuccess={handlePaymentSuccess}
                onBack={() => {
                  setClientSecret(null);
                  setSelectedPack(null);
                }}
              />
            </StripeProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreditPaymentForm({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/compass`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    setSucceeded(true);
    setTimeout(onSuccess, 1500);
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="font-medium text-text-primary">Credits added!</p>
        <p className="text-sm text-text-secondary">
          You can continue chatting with Compass.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={submitting}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 bg-bronze text-white hover:bg-bronze/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing…
            </>
          ) : (
            "Pay Now"
          )}
        </Button>
      </div>
    </form>
  );
}
