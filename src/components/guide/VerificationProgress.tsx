"use client";

import {
  CheckCircle2,
  Circle,
  Loader2,
  FileText,
  CreditCard,
  ShieldCheck,
  UserCheck,
  Globe,
} from "lucide-react";

interface VerificationStep {
  key: string;
  label: string;
  description: string;
  icon: typeof FileText;
  complete: boolean;
  active: boolean;
}

interface VerificationProgressProps {
  steps: {
    profile_complete: boolean;
    fee_paid: boolean;
    background_check_submitted: boolean;
    background_check_clear: boolean;
    verified: boolean;
    live: boolean;
  };
  status: string;
}

export default function VerificationProgress({
  steps,
  status,
}: VerificationProgressProps) {
  const stepList: VerificationStep[] = [
    {
      key: "profile",
      label: "Profile & Documents",
      description: "Complete your profile and upload required credentials",
      icon: FileText,
      complete: steps.profile_complete,
      active: !steps.profile_complete,
    },
    {
      key: "payment",
      label: "Verification Fee",
      description: "Pay the one-time $49 background check fee",
      icon: CreditCard,
      complete: steps.fee_paid,
      active: steps.profile_complete && !steps.fee_paid,
    },
    {
      key: "background",
      label: "Background Check",
      description: "Complete the background check via Checkr",
      icon: ShieldCheck,
      complete: steps.background_check_clear,
      active: steps.fee_paid && !steps.background_check_clear,
    },
    {
      key: "review",
      label: "Admin Review",
      description: "Our team reviews your profile for final approval",
      icon: UserCheck,
      complete: steps.verified,
      active:
        steps.background_check_clear &&
        !steps.verified &&
        status !== "rejected",
    },
    {
      key: "live",
      label: "Go Live",
      description: "Your profile is visible and you can accept bookings",
      icon: Globe,
      complete: steps.live,
      active: steps.verified && !steps.live,
    },
  ];

  return (
    <div className="space-y-1">
      {stepList.map((step, i) => {
        const Icon = step.icon;
        const isLast = i === stepList.length - 1;

        return (
          <div key={step.key} className="flex gap-3">
            {/* Vertical connector line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={`flex size-8 items-center justify-center rounded-full ${
                  step.complete
                    ? "bg-forest text-white"
                    : step.active
                      ? "bg-charcoal/10 text-charcoal"
                      : "bg-offwhite text-text-light"
                }`}
              >
                {step.complete ? (
                  <CheckCircle2 className="size-4" />
                ) : step.active && status === "pending" && step.key === "background" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`my-1 h-6 w-0.5 ${
                    step.complete ? "bg-forest" : "bg-stone-light/30"
                  }`}
                />
              )}
            </div>

            {/* Step content */}
            <div className="pb-4">
              <p
                className={`text-sm font-medium ${
                  step.complete
                    ? "text-forest"
                    : step.active
                      ? "text-text-primary"
                      : "text-text-light"
                }`}
              >
                {step.label}
                {step.complete && (
                  <span className="ml-2 text-xs font-normal text-forest">
                    Complete
                  </span>
                )}
              </p>
              <p className="text-xs text-text-secondary">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
