"use client";

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
  UserCircle,
  FileText,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  XCircle,
  Ban,
} from "lucide-react";
import PayoutSetup from "@/components/shared/PayoutSetup";

interface StepProfile {
  display_name?: string;
  rejection_reason?: string;
  suspended_reason?: string;
  suspension_type?: string;
}

interface StepChecklist {
  has_profile: boolean;
  has_docs: boolean;
  fee_paid: boolean;
}

export function NoProfileStep() {
  return (
    <Card className="border-charcoal/20 bg-charcoal/5">
      <CardContent className="py-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-charcoal/10">
            <UserCircle className="size-8 text-charcoal" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-text-primary">
            Create Your Guide Profile
          </h3>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Get started by setting up your guide profile. You&rsquo;ll add
            your bio, techniques, pricing, and credentials — then go through a
            quick verification process.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link href="/guide/profile">
              <Button className="bg-charcoal text-white hover:bg-charcoal/90">
                Create Profile
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
            <p className="text-xs text-text-light">Takes about 10 minutes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileIncompleteStep({
  profile,
  checklist,
}: {
  profile?: StepProfile;
  checklist?: StepChecklist;
}) {
  const steps = [
    {
      label: "Complete profile details",
      description: "Name, bio, techniques, and pricing",
      done: checklist?.has_profile ?? false,
      href: "/guide/profile",
    },
    {
      label: "Upload license & insurance",
      description: "Required credentials for verification",
      done: checklist?.has_docs ?? false,
      href: "/guide/profile",
    },
    {
      label: "Submit for verification",
      description: "Pay $49 fee and start background check",
      done: false,
      href: "/guide/verification",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <Card className="border-charcoal/20 bg-charcoal/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="size-5 text-charcoal" />
          Complete Your Guide Setup
        </CardTitle>
        <CardDescription>
          {completedCount} of {steps.length} steps complete
          {profile?.display_name ? ` — looking good, ${profile.display_name}!` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-charcoal/10">
          <div
            className="h-full rounded-full bg-charcoal transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <Link
              key={step.label}
              href={step.href}
              className="flex items-start gap-3 rounded-lg border border-stone-light/20 bg-white px-4 py-3 transition-colors hover:bg-offwhite/50"
            >
              <div className="mt-0.5">
                {step.done ? (
                  <CheckCircle2 className="size-5 text-forest" />
                ) : (
                  <div className="size-5 rounded-full border-2 border-stone-light/40" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    step.done ? "text-text-light line-through" : "text-text-primary"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-text-light">{step.description}</p>
              </div>
              {!step.done && (
                <ArrowRight className="mt-0.5 size-4 text-text-light" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReadyToVerifyStep() {
  return (
    <Card className="border-charcoal/20 bg-charcoal/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-5 text-charcoal" />
          Ready for Verification
        </CardTitle>
        <CardDescription>
          Your profile and credentials look great! Start the verification
          process to get approved for guiding.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-forest">
            <CheckCircle2 className="size-4" />
            Profile complete
          </div>
          <div className="flex items-center gap-2 text-sm text-forest">
            <CheckCircle2 className="size-4" />
            License & insurance uploaded
          </div>
        </div>
        <Link href="/guide/verification">
          <Button className="w-full bg-charcoal text-white hover:bg-charcoal/90">
            <CreditCard className="mr-2 size-4" />
            Start Verification ($49)
          </Button>
        </Link>
        <p className="mt-2 text-center text-xs text-text-light">
          One-time fee covers background check via Checkr
        </p>
      </CardContent>
    </Card>
  );
}

export function PendingStep() {
  return (
    <Card className="border-charcoal/20 bg-charcoal/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Loader2 className="size-5 animate-spin text-charcoal" />
          Verification In Progress
        </CardTitle>
        <CardDescription>
          Your background check is being processed. This typically takes 2-5
          business days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-forest">
            <CheckCircle2 className="size-4" />
            Profile complete
          </div>
          <div className="flex items-center gap-2 text-sm text-forest">
            <CheckCircle2 className="size-4" />
            Verification fee paid
          </div>
          <div className="flex items-center gap-2 text-sm text-charcoal">
            <Loader2 className="size-4 animate-spin" />
            Background check in progress
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-stone-light/20 bg-white px-4 py-3">
          <p className="text-sm text-text-secondary">
            We&rsquo;ll send you a notification as soon as your background
            check clears. You&rsquo;ll then be reviewed by our team for final
            approval.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function VerifiedStep() {
  return (
    <Card className="border-river/20 bg-river/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="size-5 text-river" />
          Background Check Passed
        </CardTitle>
        <CardDescription>
          Great news! Your background check cleared. Our team is reviewing
          your profile for final approval — typically 1-2 business days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-forest">
            <CheckCircle2 className="size-4" />
            Profile complete
          </div>
          <div className="flex items-center gap-2 text-sm text-forest">
            <CheckCircle2 className="size-4" />
            Background check passed
          </div>
          <div className="flex items-center gap-2 text-sm text-river">
            <Loader2 className="size-4 animate-spin" />
            Admin review in progress
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PayoutNeededStep() {
  return (
    <div className="space-y-4">
      <Card className="border-forest/20 bg-forest/5">
        <CardContent className="flex items-start gap-3 py-4">
          <CheckCircle2 className="size-5 shrink-0 text-forest" />
          <div>
            <p className="text-sm font-medium text-text-primary">
              You&rsquo;re approved!
            </p>
            <p className="text-sm text-text-secondary">
              Your guide profile is live. Connect your bank account below to
              start accepting bookings and receiving payouts.
            </p>
          </div>
        </CardContent>
      </Card>
      <PayoutSetup type="guide" />
    </div>
  );
}

export function RejectedStep({ profile }: { profile?: StepProfile }) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-red-700">
          <XCircle className="size-5" />
          Verification Not Approved
        </CardTitle>
        <CardDescription>
          Unfortunately, your guide verification was not approved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile?.rejection_reason && (
          <div className="rounded-lg border border-red-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-text-light">Reason</p>
            <p className="mt-1 text-sm text-text-primary">
              {profile.rejection_reason}
            </p>
          </div>
        )}
        <Link href="/guide/profile">
          <Button className="w-full bg-charcoal text-white hover:bg-charcoal/90">
            Update Profile & Resubmit
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function SuspendedStep({ profile }: { profile?: StepProfile }) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-red-700">
          <Ban className="size-5" />
          Profile Suspended
        </CardTitle>
        <CardDescription>
          Your guide profile has been suspended.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {profile?.suspended_reason && (
          <div className="rounded-lg border border-red-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-text-light">Reason</p>
            <p className="mt-1 text-sm text-text-primary">
              {profile.suspended_reason}
            </p>
          </div>
        )}
        {profile?.suspension_type === "credential_expired" && (
          <div className="mt-4">
            <Link href="/guide/profile">
              <Button
                variant="outline"
                className="w-full border-charcoal/30 text-charcoal"
              >
                Update Credentials
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
            <p className="mt-2 text-center text-xs text-text-light">
              Updating expired credentials may automatically reinstate your
              profile.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
