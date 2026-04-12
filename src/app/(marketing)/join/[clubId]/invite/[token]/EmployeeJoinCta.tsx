"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/shared/StripeProvider";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MEMBERSHIP_PROCESSING_FEE_RATE, roundCurrency } from "@/lib/constants/fees";

interface EmployeeJoinCtaProps {
  clubId: string;
  clubName: string;
  token: string;
  annualDues: number | null;
  duesPriceId: string | null;
}

type Step = "confirm" | "payment" | "success";

export default function EmployeeJoinCta({
  clubId,
  clubName,
  token,
  annualDues,
  duesPriceId,
}: EmployeeJoinCtaProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>("confirm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);

  const dues = annualDues ?? 0;
  const processingFee = roundCurrency(dues * MEMBERSHIP_PROCESSING_FEE_RATE);
  const totalDue = dues + processingFee;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user);
    });
  }, []);

  async function handleAccept() {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Accept the invitation and create membership record
      const joinRes = await fetch(`/api/clubs/${clubId}/corporate-employee-join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!joinRes.ok) {
        const data = await joinRes.json();
        throw new Error(data.error ?? "Failed to accept invitation");
      }

      const joinData = await joinRes.json();
      const createdMembershipId: string = joinData.membership?.id;

      // Step 2: Set up dues subscription
      const checkoutRes = await fetch("/api/stripe/membership-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          membershipType: "corporate_employee",
          invitationToken: token,
          duesPriceId: duesPriceId ?? undefined,
        }),
      });

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json();
        throw new Error(data.error ?? "Failed to start payment");
      }

      const checkoutData = await checkoutRes.json();
      setMembershipId(createdMembershipId ?? checkoutData.membershipId);

      const secret = checkoutData.subscriptionClientSecret;

      if (secret) {
        setClientSecret(secret);
        setStep("payment");
      } else {
        // No dues configured — membership is free
        setStep("success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auth check loading
  if (isLoggedIn === null) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="size-5 animate-spin text-text-light" />
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="font-heading text-xl font-semibold text-forest">
          You&rsquo;ve been invited to join {clubName}
        </h2>
        <p className="text-sm text-text-secondary">
          Create an account or sign in to accept this corporate employee
          invitation and complete your membership.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="w-full bg-forest text-white hover:bg-forest-deep sm:w-auto"
          >
            <a href={`/signup?redirect=/join/${clubId}/invite/${token}`}>
              Create Account to Join
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto"
          >
            <a href={`/login?redirect=/join/${clubId}/invite/${token}`}>
              Sign In
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Success
  if (step === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-10 text-forest" />
        <h3 className="text-base font-medium text-text-primary">
          Welcome to {clubName}!
        </h3>
        <p className="text-sm text-text-secondary">
          Your corporate employee membership is now active.
          You can start browsing properties.
        </p>
        <Button
          onClick={() => router.push("/angler")}
          className="bg-forest text-white hover:bg-forest-deep"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Payment step
  if (step === "payment" && clientSecret) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              Annual Dues — {clubName}
            </span>
            {totalDue > 0 && (
              <span className="text-lg font-semibold text-forest">
                ${totalDue.toFixed(2)}/yr
              </span>
            )}
          </div>
        </div>

        <StripeProvider clientSecret={clientSecret}>
          <EmployeePaymentInner
            totalAmount={totalDue}
            membershipId={membershipId}
            onSuccess={() => setStep("success")}
            onBack={() => {
              setStep("confirm");
              setClientSecret(null);
            }}
          />
        </StripeProvider>

        <div className="flex items-center gap-2 text-xs text-text-light">
          <Lock className="size-3 shrink-0" />
          <span>Secured by Stripe. Your payment details never touch our servers.</span>
        </div>
      </div>
    );
  }

  // Confirm step
  return (
    <div className="space-y-4 text-center">
      <h2 className="font-heading text-xl font-semibold text-forest">
        Accept Invitation &amp; Pay Dues
      </h2>
      {dues > 0 && (
        <p className="text-sm text-text-secondary">
          You will be charged{" "}
          <span className="font-medium text-text-primary">
            ${totalDue.toFixed(2)}/year
          </span>{" "}
          for annual dues (includes a 5% platform fee). Your initiation fee
          has been covered by your corporate sponsor.
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <Button
        onClick={handleAccept}
        disabled={loading}
        className="w-full bg-forest text-white hover:bg-forest-deep sm:w-auto"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Accept Invitation & Pay Dues"
        )}
      </Button>
    </div>
  );
}

// ─── Inner payment form (must be inside StripeProvider) ─────────────

function EmployeePaymentInner({
  totalAmount,
  membershipId: _membershipId,
  onSuccess,
  onBack,
}: {
  totalAmount: number;
  membershipId: string | null;
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
        return_url: `${window.location.origin}/angler`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
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
          className="flex-1 bg-forest text-white hover:bg-forest-deep"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : totalAmount > 0 ? (
            `Pay $${totalAmount.toFixed(2)}`
          ) : (
            "Activate Membership"
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
