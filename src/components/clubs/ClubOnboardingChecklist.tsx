"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  CreditCard,
  Users as UsersIcon,
  MapPin,
  FileText,
  Banknote,
} from "lucide-react";
import PayoutSetup from "@/components/shared/PayoutSetup";
import ClubSubscriptionForm from "@/components/clubs/ClubSubscriptionForm";
import type { ClubTier } from "@/lib/constants/stripe-prices";

interface ClubOnboardingChecklistProps {
  club: {
    id: string;
    name: string;
    subscription_tier: string | null;
  };
  checklist: {
    club_created: boolean;
    has_description: boolean;
    has_subscription: boolean;
    has_payout: boolean;
    has_members: boolean;
    has_properties: boolean;
  };
  onComplete?: () => void;
}

export default function ClubOnboardingChecklist({
  club,
  checklist,
  onComplete,
}: ClubOnboardingChecklistProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(
    !checklist.has_description
      ? "description"
      : !checklist.has_subscription
        ? "subscription"
        : !checklist.has_payout
          ? "payout"
          : null
  );

  const steps = [
    {
      id: "club",
      label: "Create your club",
      description: "Club profile created",
      done: true,
      icon: CheckCircle2,
    },
    {
      id: "description",
      label: "Add club details",
      description: "Add a description so members know what your club is about",
      done: checklist.has_description,
      icon: FileText,
      href: "/club/settings",
      cta: "Edit Club Profile",
    },
    {
      id: "subscription",
      label: "Choose a subscription plan",
      description: "Select the plan that fits your club size and needs",
      done: checklist.has_subscription,
      icon: CreditCard,
      expandable: true,
    },
    {
      id: "payout",
      label: "Connect payout account",
      description:
        "Set up Stripe to receive commission earnings from member bookings",
      done: checklist.has_payout,
      icon: Banknote,
      expandable: true,
    },
    {
      id: "members",
      label: "Invite your first members",
      description: "Send invitations to anglers to join your club",
      done: checklist.has_members,
      icon: UsersIcon,
      href: "/club/members",
      cta: "Invite Members",
      optional: true,
    },
    {
      id: "properties",
      label: "Connect with a property",
      description:
        "Associate with a landowner's property so members can book access",
      done: checklist.has_properties,
      icon: MapPin,
      href: "/club/properties",
      cta: "View Properties",
      optional: true,
    },
  ];

  const requiredSteps = steps.filter((s) => !s.optional);
  const completedRequired = requiredSteps.filter((s) => s.done).length;
  const allComplete = steps.filter((s) => s.done).length;

  return (
    <Card className="border-river/20 bg-river/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UsersIcon className="size-5 text-river" />
          Set Up {club.name}
        </CardTitle>
        <CardDescription>
          {completedRequired} of {requiredSteps.length} required steps complete
          — finish setup to start managing your club on AnglerPass.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-river/10">
          <div
            className="h-full rounded-full bg-river transition-all duration-500"
            style={{
              width: `${(completedRequired / requiredSteps.length) * 100}%`,
            }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const isExpanded = expandedStep === step.id;
            const StepIcon = step.icon;

            return (
              <div key={step.id}>
                <button
                  onClick={() => {
                    if (step.href && !step.done) {
                      // Navigate for link-based steps
                      return;
                    }
                    if (step.expandable && !step.done) {
                      setExpandedStep(isExpanded ? null : step.id);
                    }
                  }}
                  className={`flex w-full items-start gap-3 rounded-lg border bg-white px-4 py-3 text-left transition-colors ${
                    step.done
                      ? "border-forest/10"
                      : "border-stone-light/20 hover:bg-offwhite/50"
                  }`}
                >
                  <div className="mt-0.5">
                    {step.done ? (
                      <CheckCircle2 className="size-5 text-forest" />
                    ) : (
                      <div className="flex size-5 items-center justify-center rounded-full border-2 border-stone-light/40">
                        <StepIcon className="size-3 text-text-light" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm font-medium ${
                          step.done
                            ? "text-text-light line-through"
                            : "text-text-primary"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.optional && !step.done && (
                        <span className="rounded-full bg-stone-light/20 px-2 py-0.5 text-[10px] font-medium text-text-light">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-light">
                      {step.description}
                    </p>
                  </div>
                  {!step.done && step.href && (
                    <Link href={step.href} className="shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 border-river/30 text-xs text-river hover:bg-river/5"
                      >
                        {step.cta}
                        <ArrowRight className="ml-1 size-3" />
                      </Button>
                    </Link>
                  )}
                  {!step.done && step.expandable && (
                    <ArrowRight
                      className={`size-4 shrink-0 text-text-light transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && step.id === "subscription" && !step.done && (
                  <div className="mt-2 rounded-lg border border-stone-light/20 bg-white p-4">
                    <ClubSubscriptionForm
                      clubId={club.id}
                      currentTier={(club.subscription_tier as ClubTier) ?? null}
                      onSuccess={() => {
                        setExpandedStep("payout");
                        onComplete?.();
                      }}
                    />
                  </div>
                )}

                {isExpanded && step.id === "payout" && !step.done && (
                  <div className="mt-2">
                    <PayoutSetup type="club" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
