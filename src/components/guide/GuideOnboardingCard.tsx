"use client";

import {
  NoProfileStep,
  ProfileIncompleteStep,
  ReadyToVerifyStep,
  PendingStep,
  VerifiedStep,
  PayoutNeededStep,
  RejectedStep,
  SuspendedStep,
} from "./GuideOnboardingSteps";

interface GuideOnboardingCardProps {
  state:
    | "no_profile"
    | "profile_incomplete"
    | "ready_to_verify"
    | "pending"
    | "verified"
    | "payout_needed"
    | "rejected"
    | "suspended";
  profile?: {
    display_name?: string;
    rejection_reason?: string;
    suspended_reason?: string;
    suspension_type?: string;
  };
  checklist?: {
    has_profile: boolean;
    has_docs: boolean;
    fee_paid: boolean;
  };
}

export default function GuideOnboardingCard({
  state,
  profile,
  checklist,
}: GuideOnboardingCardProps) {
  switch (state) {
    case "no_profile":
      return <NoProfileStep />;
    case "profile_incomplete":
      return <ProfileIncompleteStep profile={profile} checklist={checklist} />;
    case "ready_to_verify":
      return <ReadyToVerifyStep />;
    case "pending":
      return <PendingStep />;
    case "verified":
      return <VerifiedStep />;
    case "payout_needed":
      return <PayoutNeededStep />;
    case "rejected":
      return <RejectedStep profile={profile} />;
    case "suspended":
      return <SuspendedStep profile={profile} />;
    default:
      return null;
  }
}
