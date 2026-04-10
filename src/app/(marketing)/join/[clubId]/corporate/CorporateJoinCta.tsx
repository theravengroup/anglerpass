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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MEMBERSHIP_PROCESSING_FEE_RATE, roundCurrency } from "@/lib/constants/fees";

interface CorporateJoinCtaProps {
  clubId: string;
  clubName: string;
  corporateInitiationFee: number | null;
  annualDues: number | null;
  duesPriceId: string | null;
}

type Step = "form" | "payment" | "success";

export default function CorporateJoinCta({
  clubId,
  clubName,
  corporateInitiationFee,
  annualDues,
  duesPriceId,
}: CorporateJoinCtaProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [membershipId, setMembershipId] = useState<string | null>(null);

  const initiationFee = corporateInitiationFee ?? 0;
  const dues = annualDues ?? 0;
  const processingFee =
    roundCurrency((initiationFee + dues) * MEMBERSHIP_PROCESSING_FEE_RATE);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session?.user);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Please enter your company name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create the corporate membership record
      const joinRes = await fetch(`/api/clubs/${clubId}/corporate-join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name: companyName.trim() }),
      });

      if (!joinRes.ok) {
        const data = await joinRes.json();
        throw new Error(data.error ?? "Failed to create membership");
      }

      // Step 2: Set up payment
      const checkoutRes = await fetch("/api/stripe/membership-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          membershipType: "corporate",
          companyName: companyName.trim(),
          duesPriceId: duesPriceId ?? undefined,
        }),
      });

      if (!checkoutRes.ok) {
        const data = await checkoutRes.json();
        throw new Error(data.error ?? "Failed to start payment");
      }

      const checkoutData = await checkoutRes.json();
      setMembershipId(checkoutData.membershipId);

      // Prefer initiation secret, then subscription secret
      const secret =
        checkoutData.initiationClientSecret ?? checkoutData.subscriptionClientSecret;

      if (secret) {
        setClientSecret(secret);
        setStep("payment");
      } else {
        // No payment required (free club)
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
          Ready to join {clubName} as a corporate member?
        </h2>
        <p className="text-sm text-text-secondary">
          Sign in to your AnglerPass account to complete your corporate membership.
        </p>
        <Button
          asChild
          className="bg-forest text-white hover:bg-forest-deep"
        >
          <a href={`/login?redirect=/join/${clubId}/corporate`}>
            Sign In to Join
          </a>
        </Button>
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
          Your corporate membership is being processed. You can invite employees
          from your angler dashboard.
        </p>
        <Button
          onClick={() => router.push("/angler?corporate_joined=true")}
          className="bg-forest text-white hover:bg-forest-deep"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // Payment step
  if (step === "payment" && clientSecret) {
    const totalDue = initiationFee + dues + processingFee;
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              Corporate Membership — {clubName}
            </span>
            {totalDue > 0 && (
              <span className="text-lg font-semibold text-forest">
                ${totalDue.toFixed(2)}
              </span>
            )}
          </div>
          {companyName && (
            <p className="mt-1 text-xs text-text-light">{companyName}</p>
          )}
        </div>

        <StripeProvider clientSecret={clientSecret}>
          <CorporatePaymentInner
            totalAmount={totalDue}
            membershipId={membershipId}
            onSuccess={() => setStep("success")}
            onBack={() => {
              setStep("form");
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

  // Form step (company name input)
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-forest">
        Join {clubName} as a corporate member
      </h2>

      <div className="space-y-2">
        <Label htmlFor="company-name">Company Name</Label>
        <Input
          id="company-name"
          type="text"
          placeholder="Acme Corporation"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-xs text-text-light">
          This will appear on your membership and employee invitations.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !companyName.trim()}
        className="w-full bg-forest text-white hover:bg-forest-deep"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Continue to Payment"
        )}
      </Button>
    </form>
  );
}

// ─── Inner payment form (must be inside StripeProvider) ─────────────

function CorporatePaymentInner({
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
        return_url: `${window.location.origin}/angler?corporate_joined=true`,
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
