"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Loader2,
  CalendarDays,
  Star,
  DollarSign,
  UserCircle,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Handshake,
} from "lucide-react";
import PayoutSetup from "@/components/shared/PayoutSetup";
import GuideOnboardingCard from "@/components/guide/GuideOnboardingCard";

interface GuideProfile {
  id: string;
  display_name: string;
  status: string;
  rating_avg: number;
  rating_count: number;
  trips_completed: number;
}

type GuideOnboardingState =
  | "no_profile"
  | "profile_incomplete"
  | "ready_to_verify"
  | "pending"
  | "verified"
  | "payout_needed"
  | "active"
  | "rejected"
  | "suspended";

interface OnboardingData {
  state: GuideOnboardingState;
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

export default function GuideDashboardPage() {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  async function load() {
    try {
      // Fetch onboarding status first
      const onboardingRes = await fetch("/api/guides/onboarding-status");
      let onboardingData: OnboardingData = { state: "no_profile" };
      if (onboardingRes.ok) {
        onboardingData = await onboardingRes.json();
      }
      setOnboarding(onboardingData);

      // Only fetch full profile + messages if active
      if (onboardingData.state === "active") {
        const [profileRes, threadsRes] = await Promise.all([
          fetch("/api/guides/profile"),
          fetch("/api/messages"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.profile);
        }

        if (threadsRes.ok) {
          const data = await threadsRes.json();
          const total = (data.threads ?? []).reduce(
            (sum: number, t: { unread_count: number }) => sum + t.unread_count,
            0
          );
          setUnreadMessages(total);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  // Non-active states — show onboarding card
  if (onboarding && onboarding.state !== "active") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Guide Dashboard
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {onboarding.state === "no_profile"
              ? "Set up your guide profile to start guiding on private waters."
              : onboarding.profile?.display_name
                ? `Welcome back, ${onboarding.profile.display_name}`
                : "Complete your guide setup to get started."}
          </p>
        </div>
        <GuideOnboardingCard
          state={onboarding.state}
          profile={onboarding.profile}
          checklist={onboarding.checklist}
        />
      </div>
    );
  }

  // Active state — show full dashboard
  if (!profile) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  return (
    <ActiveGuideDashboard
      profile={profile}
      unreadMessages={unreadMessages}
    />
  );
}

// ─── Active Dashboard ──────────────────────────────────────────────

function ActiveGuideDashboard({
  profile,
  unreadMessages,
}: {
  profile: GuideProfile;
  unreadMessages: number;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Guide Dashboard
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome back, {profile.display_name}
          </p>
        </div>
        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
          Live
        </span>
      </div>

      {/* Payout setup — show if somehow missing */}
      <PayoutSetup type="guide" />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-river" />
              <span className="text-2xl font-semibold">
                {profile.trips_completed}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="size-5 text-bronze" />
              <span className="text-2xl font-semibold">
                {profile.rating_count > 0
                  ? profile.rating_avg.toFixed(1)
                  : "--"}
              </span>
              {profile.rating_count > 0 && (
                <span className="text-sm text-text-light">
                  ({profile.rating_count})
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-forest" />
              <span className="text-2xl font-semibold">$0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-charcoal" />
              <span className="text-2xl font-semibold">{unreadMessages}</span>
              <span className="text-sm text-text-light">unread</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Edit Profile", href: "/guide/profile", icon: UserCircle },
          {
            label: "Verification",
            href: "/guide/verification",
            icon: ShieldCheck,
          },
          {
            label: "Club Affiliations",
            href: "/guide/affiliations",
            icon: Handshake,
          },
          {
            label: "Set Availability",
            href: "/guide/availability",
            icon: CalendarDays,
          },
          {
            label: "View Bookings",
            href: "/guide/bookings",
            icon: CalendarDays,
          },
          { label: "My Reviews", href: "/guide/reviews", icon: Star },
          {
            label: "Messages",
            href: "/guide/messages",
            icon: MessageSquare,
          },
          { label: "Earnings", href: "/guide/earnings", icon: DollarSign },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="border-stone-light/20 transition-colors hover:border-charcoal/20 hover:bg-offwhite/50">
              <CardContent className="flex items-center gap-3 py-4">
                <item.icon className="size-5 text-text-light" />
                <span className="text-sm font-medium text-text-primary">
                  {item.label}
                </span>
                <ArrowRight className="ml-auto size-4 text-text-light" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
