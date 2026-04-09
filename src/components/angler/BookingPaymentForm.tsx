"use client";

import { useState } from "react";
import { StripeProvider } from "@/components/shared/StripeProvider";
import { Button } from "@/components/ui/button";
import { CardDisplay } from "@/components/shared/CardDisplay";
import { Loader2, CreditCard, Lock } from "lucide-react";
import type { FeeBreakdown } from "@/lib/constants/fees";
import { ConfirmWithSavedCard, NewCardPaymentForm } from "./PaymentSubForms";

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
}

interface BookingPaymentFormProps {
  bookingId: string;
  fees: FeeBreakdown;
  /** Called after payment is successfully authorized */
  onSuccess: () => void;
  /** Called when the user wants to go back */
  onBack?: () => void;
  /** Pre-created PaymentIntent client secret. Skips internal PI creation. */
  initialClientSecret?: string;
}

/**
 * Inline payment form for booking checkout.
 *
 * Flow:
 * 1. Creates a PaymentIntent (manual capture) via our API
 * 2. Shows saved cards OR Stripe PaymentElement for new card
 * 3. Confirms the PaymentIntent (places an authorization hold)
 * 4. Calls onSuccess — booking is confirmed with payment held
 */
export default function BookingPaymentForm({
  bookingId,
  fees,
  onSuccess,
  onBack,
  initialClientSecret,
}: BookingPaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(
    initialClientSecret ?? null
  );
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCents = Math.round(fees.totalAmount * 100);
  const platformFeeCents = Math.round(fees.platformFee * 100);

  async function initPayment() {
    setLoading(true);
    setError(null);

    try {
      // Fetch saved payment methods
      const methodsRes = await fetch("/api/stripe/payment-methods");
      if (methodsRes.ok) {
        const methods = await methodsRes.json();
        setSavedCards(methods.cards ?? []);
      }

      // Skip PaymentIntent creation if a client secret was provided
      if (!initialClientSecret) {
        const piRes = await fetch("/api/stripe/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            amountCents: totalCents,
            platformFeeCents,
          }),
        });

        if (!piRes.ok) {
          const data = await piRes.json();
          throw new Error(data.error ?? "Failed to initialize payment");
        }

        const { clientSecret: secret } = await piRes.json();
        setClientSecret(secret);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }

  // Auto-initialize on mount
  if (!initialized && !loading) {
    initPayment();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 className="size-6 animate-spin text-bronze" />
        <p className="text-sm text-text-secondary">Setting up payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={initPayment}>
            Try Again
          </Button>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              Go Back
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!clientSecret) return null;

  return (
    <div className="space-y-4">
      {/* Payment summary */}
      <div className="rounded-lg border border-bronze/20 bg-bronze/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">
            Authorization Hold
          </span>
          <span className="text-lg font-semibold text-bronze">
            ${fees.totalAmount.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-light">
          Your card will be authorized but not charged until after your trip.
        </p>
      </div>

      {/* Saved cards selection */}
      {savedCards.length > 0 && !useNewCard && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-primary">
            Saved Payment Methods
          </p>
          <div className="space-y-2">
            {savedCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedCardId === card.id
                    ? "border-bronze bg-bronze/5"
                    : "border-border hover:border-bronze/30"
                }`}
              >
                <CardDisplay
                  name={card.name}
                  last4={card.last4}
                  expMonth={card.expMonth}
                  expYear={card.expYear}
                  brand={card.brand as "visa" | "mastercard" | "amex" | "discover" | "unknown"}
                  theme="angler"
                  className="max-w-[160px]"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">
                    {card.brand} •••• {card.last4}
                  </p>
                  <p className="text-xs text-text-light">
                    Expires {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setUseNewCard(true);
              setSelectedCardId(null);
            }}
            className="flex items-center gap-2 text-sm text-bronze hover:text-bronze-light"
          >
            <CreditCard className="size-4" />
            Use a different payment method
          </button>

          {selectedCardId && (
            <ConfirmWithSavedCard
              clientSecret={clientSecret}
              paymentMethodId={selectedCardId}
              totalAmount={fees.totalAmount}
              onSuccess={onSuccess}
              onBack={onBack}
            />
          )}
        </div>
      )}

      {/* New card via Stripe Elements */}
      {(savedCards.length === 0 || useNewCard) && (
        <StripeProvider clientSecret={clientSecret}>
          <NewCardPaymentForm
            totalAmount={fees.totalAmount}
            onSuccess={onSuccess}
            onBack={() => {
              if (savedCards.length > 0) {
                setUseNewCard(false);
              } else {
                onBack?.();
              }
            }}
          />
        </StripeProvider>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-text-light">
        <Lock className="size-3" />
        <span>Secured by Stripe. Your card details never touch our servers.</span>
      </div>
    </div>
  );
}
