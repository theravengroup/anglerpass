"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  Loader2,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import { anglerPassConnectTheme } from "@/lib/stripe/elements-theme";

interface PayoutSetupProps {
  type: "guide" | "landowner" | "club";
  className?: string;
}

const TYPE_CONFIG = {
  guide: {
    color: "charcoal",
    label: "Independent Guide",
    description:
      "Connect your bank account to receive earnings from guided trips. This is required before you can accept bookings.",
  },
  landowner: {
    color: "forest",
    label: "Landowner",
    description:
      "Connect your bank account to receive rod fee earnings from bookings. This is required before your properties can accept paid bookings.",
  },
  club: {
    color: "river",
    label: "Club",
    description:
      "Connect your bank account to receive club commission earnings. This is required before your club can process bookings.",
  },
} as const;

// Tailwind color mappings for each type
const COLOR_CLASSES = {
  guide: {
    icon: "text-charcoal",
    iconBg: "bg-charcoal/10",
    border: "border-charcoal/20",
    bg: "bg-charcoal/5",
    button: "bg-charcoal text-white hover:bg-charcoal/90",
    badge: "bg-charcoal/10 text-charcoal",
    successBorder: "border-green-600/20",
    successBg: "bg-green-50",
  },
  landowner: {
    icon: "text-forest",
    iconBg: "bg-forest/10",
    border: "border-forest/20",
    bg: "bg-forest/5",
    button: "bg-forest text-white hover:bg-forest/90",
    badge: "bg-forest/10 text-forest",
    successBorder: "border-green-600/20",
    successBg: "bg-green-50",
  },
  club: {
    icon: "text-river",
    iconBg: "bg-river/10",
    border: "border-river/20",
    bg: "bg-river/5",
    button: "bg-river text-white hover:bg-river/90",
    badge: "bg-river/10 text-river",
    successBorder: "border-green-600/20",
    successBg: "bg-green-50",
  },
};

export default function PayoutSetup({ type, className }: PayoutSetupProps) {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = TYPE_CONFIG[type];
  const colors = COLOR_CLASSES[type];

  // Check onboarding status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/stripe/connect?type=${type}`);
        if (res.ok) {
          const data = await res.json();
          setOnboarded(data.onboarded);
          setHasAccount(data.hasAccount);
        } else {
          setError("Failed to check payout status.");
        }
      } catch {
        setError("Failed to check payout status.");
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [type]);

  // Initialize Connect instance for embedded onboarding
  const connectInstance = useMemo(() => {
    if (!showOnboarding) return null;

    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) return null;

    return loadConnectAndInitialize({
      publishableKey,
      fetchClientSecret: async () => {
        const res = await fetch("/api/stripe/account-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to create account session");
        }

        const { clientSecret } = await res.json();
        return clientSecret;
      },
      appearance: anglerPassConnectTheme,
    });
  }, [showOnboarding, type]);

  async function startOnboarding() {
    setCreatingAccount(true);
    setError(null);

    try {
      // Ensure a Connect account exists
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to start payout setup.");
        setCreatingAccount(false);
        return;
      }

      setHasAccount(true);
      setShowOnboarding(true);
    } catch {
      setError("Failed to start payout setup.");
    } finally {
      setCreatingAccount(false);
    }
  }

  function handleOnboardingExit() {
    // Re-check status after user completes or exits onboarding
    setShowOnboarding(false);
    setLoading(true);
    fetch(`/api/stripe/connect?type=${type}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setOnboarded(data.onboarded);
          setHasAccount(data.hasAccount);
        }
      })
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <Card className={cn("border-stone-light/20", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className={cn("size-5 animate-spin", colors.icon)} />
        </CardContent>
      </Card>
    );
  }

  if (onboarded) {
    return (
      <Card className={cn(colors.successBorder, colors.successBg, className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
              <Check className="size-5 text-green-600" />
            </div>
            Payouts Connected
          </CardTitle>
          <CardDescription>
            Your {config.label.toLowerCase()} payout account is set up and ready
            to receive payments via&nbsp;Stripe.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Embedded onboarding flow
  if (showOnboarding && connectInstance) {
    return (
      <Card className={cn("border-stone-light/20", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full",
                colors.iconBg
              )}
            >
              <CreditCard className={cn("size-5", colors.icon)} />
            </div>
            Complete Payout Setup
          </CardTitle>
          <CardDescription>
            Fill in the details below to connect your bank account. All
            information is processed securely by&nbsp;Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectComponentsProvider connectInstance={connectInstance}>
            <ConnectAccountOnboarding
              onExit={handleOnboardingExit}
              onStepChange={(stepChange) => {
                // Track progress for analytics (future use)
                console.log("[PayoutSetup] Onboarding step:", stepChange.step);
              }}
              onLoadError={({ error: loadError }) => {
                console.error(
                  "[PayoutSetup] Onboarding load error:",
                  loadError
                );
                setError(
                  "Failed to load the onboarding form. Please try again."
                );
                setShowOnboarding(false);
              }}
            />
          </ConnectComponentsProvider>
        </CardContent>
      </Card>
    );
  }

  // Initial state — prompt to start onboarding
  return (
    <Card
      className={cn(
        "border-stone-light/20",
        !onboarded && !hasAccount && "border-amber-500/30 bg-amber-50/30",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-full",
              !hasAccount ? "bg-amber-100" : colors.iconBg
            )}
          >
            {!hasAccount ? (
              <AlertCircle className="size-5 text-amber-600" />
            ) : (
              <CreditCard className={cn("size-5", colors.icon)} />
            )}
          </div>
          {!hasAccount ? "Payout Setup Required" : "Payout Setup"}
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn("rounded-lg border p-4", colors.border, colors.bg)}>
          <p className="text-sm text-text-secondary">
            {hasAccount
              ? "Your Stripe account was started but onboarding is not complete. Click below to finish setup."
              : "Connect a Stripe account to receive payouts directly to your bank. Setup takes about 5 minutes and requires your bank details and identity verification."}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <Button
          onClick={startOnboarding}
          disabled={creatingAccount}
          className={cn("w-full", colors.button)}
        >
          {creatingAccount && (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          )}
          {creatingAccount
            ? "Setting up..."
            : hasAccount
              ? "Continue Payout Setup"
              : "Set Up Payouts"}
        </Button>
      </CardContent>
    </Card>
  );
}
