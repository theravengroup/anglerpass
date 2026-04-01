"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, CreditCard, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PayoutSetupProps {
  type: "guide" | "landowner" | "club";
  className?: string;
}

const TYPE_CONFIG = {
  guide: {
    color: "charcoal",
    label: "Guide",
    description: "Set up payouts to receive earnings from guided trips.",
  },
  landowner: {
    color: "forest",
    label: "Landowner",
    description: "Set up payouts to receive rod fee earnings from bookings.",
  },
  club: {
    color: "river",
    label: "Club",
    description: "Set up payouts to receive club commission earnings.",
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
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = TYPE_CONFIG[type];
  const colors = COLOR_CLASSES[type];

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

  const startOnboarding = async () => {
    setRedirecting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to start payout setup.");
        setRedirecting(false);
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Failed to start payout setup.");
      setRedirecting(false);
    }
  };

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
            to receive payments via Stripe.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
          Payout Setup
        </CardTitle>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn("rounded-lg border p-4", colors.border, colors.bg)}>
          <p className="text-sm text-text-secondary">
            {hasAccount
              ? "Your Stripe account was started but onboarding is not complete. Click below to finish setup."
              : "Connect a Stripe account to receive payouts directly to your bank. Setup takes about 5 minutes."}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button
          onClick={startOnboarding}
          disabled={redirecting}
          className={cn("w-full", colors.button)}
        >
          {redirecting ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <ExternalLink className="mr-1.5 size-4" />
          )}
          {redirecting
            ? "Redirecting to Stripe..."
            : hasAccount
              ? "Continue Stripe Setup"
              : "Set Up Payouts"}
        </Button>
      </CardContent>
    </Card>
  );
}
