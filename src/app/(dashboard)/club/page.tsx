"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarDays,
  MapPin,
  ArrowRight,
  Settings,
  Loader2,
  UserPlus,
  Bell,
  Network,
  Gift,
  Shield,
  Handshake,
} from "lucide-react";
import PayoutSetup from "@/components/shared/PayoutSetup";
import ClubOnboardingChecklist from "@/components/clubs/ClubOnboardingChecklist";
import BookingAlertsCard from "@/components/clubs/BookingAlertsCard";
import ClubEmbedWidget from "@/components/clubs/ClubEmbedWidget";
import CalendarFeedCard from "@/components/shared/CalendarFeedCard";
import ClubActivationToggle from "@/components/clubs/ClubActivationToggle";
import Link from "next/link";
import SmsConsentCard from "@/components/shared/SmsConsentCard";

interface ClubData {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  subscription_tier: string;
  is_active: boolean;
}

interface ClubStats {
  active_members: number;
  pending_members: number;
  active_properties: number;
  pending_properties: number;
  upcoming_bookings: number;
}

type ClubOnboardingState = "no_club" | "setup_incomplete" | "active";

interface OnboardingData {
  state: ClubOnboardingState;
  club?: {
    id: string;
    name: string;
    subscription_tier: string | null;
  };
  checklist?: {
    club_created: boolean;
    has_description: boolean;
    has_subscription: boolean;
    has_payout: boolean;
    has_members: boolean;
    has_properties: boolean;
  };
}

export default function ClubPage() {
  const router = useRouter();
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [club, setClub] = useState<ClubData | null>(null);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      // Fetch onboarding status first
      const onboardingRes = await fetch("/api/clubs/onboarding-status");
      let onboardingData: OnboardingData = { state: "no_club" };
      if (onboardingRes.ok) {
        onboardingData = await onboardingRes.json();
      }
      setOnboarding(onboardingData);

      // Only fetch full details if active
      if (onboardingData.state === "active" && onboardingData.club) {
        const detailRes = await fetch(
          `/api/clubs/${onboardingData.club.id}`
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setClub(detail.club);
          setStats(detail.stats);
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
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  // No club yet — show setup CTA
  if (onboarding?.state === "no_club") {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Club Management
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage members, reservations, and property access for your fishing
            club.
          </p>
        </div>

        <Card className="border-river/20 bg-river/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-river/10">
                <Users className="size-8 text-river" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-text-primary">
                Set Up Your Club on AnglerPass
              </h3>
              <p className="mt-2 max-w-lg text-sm text-text-secondary">
                Create your club profile to start managing members, coordinating
                property access through the Cross-Club Network, and running your
                club digitally.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-forest/10">
                    <Users className="size-5 text-forest" />
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    Manage members
                  </p>
                </div>
                <div>
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-bronze/10">
                    <MapPin className="size-5 text-bronze" />
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    Property access
                  </p>
                </div>
                <div>
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-river/10">
                    <Network className="size-5 text-river" />
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    Cross-Club Network
                  </p>
                </div>
              </div>
              <Button
                className="mt-6 bg-river text-white hover:bg-river/90"
                onClick={() => router.push("/club/setup")}
              >
                Get Started
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup incomplete — show onboarding checklist
  if (
    onboarding?.state === "setup_incomplete" &&
    onboarding.club &&
    onboarding.checklist
  ) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            {onboarding.club.name}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Complete your club setup to start managing members and bookings.
          </p>
        </div>
        <ClubOnboardingChecklist
          club={onboarding.club}
          checklist={onboarding.checklist}
          onComplete={() => {
            setLoading(true);
            load();
          }}
        />
      </div>
    );
  }

  // Active — show full dashboard
  if (!club) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  return (
    <ActiveClubDashboard
      club={club}
      stats={stats}
    />
  );
}

// ─── Active Club Dashboard ─────────────────────────────────────────

function ActiveClubDashboard({
  club,
  stats,
}: {
  club: ClubData;
  stats: ClubStats | null;
}) {
  const [isActive, setIsActive] = useState(club.is_active);
  const statCards = [
    {
      label: "Active Members",
      value: String(stats?.active_members ?? 0),
      description: stats?.pending_members
        ? `${stats.pending_members} pending`
        : "Manage your roster",
      icon: Users,
      color: "text-forest",
      bg: "bg-forest/10",
      href: "/club/members",
    },
    {
      label: "Upcoming Reservations",
      value: String(stats?.upcoming_bookings ?? 0),
      description: "Across all club properties",
      icon: CalendarDays,
      color: "text-river",
      bg: "bg-river/10",
      href: "/club/properties",
    },
    {
      label: "Active Properties",
      value: String(stats?.active_properties ?? 0),
      description: stats?.pending_properties
        ? `${stats.pending_properties} pending approval`
        : "Managed by your club",
      icon: MapPin,
      color: "text-bronze",
      bg: "bg-bronze/10",
      href: "/club/properties",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            {club.name}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {club.location ?? "Club dashboard"}
          </p>
        </div>
        <Link href="/club/settings">
          <Button variant="outline" size="sm">
            <Settings className="size-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Activation Toggle */}
      <ClubActivationToggle
        clubId={club.id}
        isActive={isActive}
        hasProperties={(stats?.active_properties ?? 0) + (stats?.pending_properties ?? 0) > 0}
        onToggle={setIsActive}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-stone-light/20 transition-colors hover:border-stone-light/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-text-secondary">
                    {stat.label}
                  </CardDescription>
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <stat.icon className={`size-[18px] ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight text-text-primary">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-text-light">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Payout setup — required for processing bookings */}
      <PayoutSetup type="club" />

      {/* Website Embed & Join Link */}
      <ClubEmbedWidget club={club} />

      {/* Action items */}
      {((stats?.pending_members ?? 0) > 0 ||
        (stats?.pending_properties ?? 0) > 0) && (
        <Card className="border-bronze/20 bg-bronze/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-bronze" />
              Needs Your Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.pending_members ?? 0) > 0 && (
              <Link
                href="/club/members"
                className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-white px-4 py-3 transition-colors hover:bg-offwhite/50"
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="size-4 text-forest" />
                  <span className="text-sm text-text-primary">
                    {stats!.pending_members} pending member
                    {stats!.pending_members !== 1 ? "s" : ""} to review
                  </span>
                </div>
                <ArrowRight className="size-4 text-text-light" />
              </Link>
            )}
            {(stats?.pending_properties ?? 0) > 0 && (
              <Link
                href="/club/properties"
                className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-white px-4 py-3 transition-colors hover:bg-offwhite/50"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-bronze" />
                  <span className="text-sm text-text-primary">
                    {stats!.pending_properties} property association
                    {stats!.pending_properties !== 1 ? "s" : ""} to approve
                  </span>
                </div>
                <ArrowRight className="size-4 text-text-light" />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking alerts — flagged members */}
      <BookingAlertsCard clubId={club.id} />

      {/* SMS Consent — optional, dismissable */}
      <SmsConsentCard />

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Invite Members",
            description: "Grow your club by inviting anglers",
            href: "/club/members",
            icon: UserPlus,
            color: "text-forest",
            bg: "bg-forest/10",
          },
          {
            label: "Manage Properties",
            description: "View and approve property associations",
            href: "/club/properties",
            icon: MapPin,
            color: "text-bronze",
            bg: "bg-bronze/10",
          },
          {
            label: "Manage Staff",
            description: "Assign roles and permissions to members",
            href: "/club/staff",
            icon: Shield,
            color: "text-river",
            bg: "bg-river/10",
          },
          {
            label: "Independent Guide Affiliations",
            description: "Manage affiliated independent guides for your waters",
            href: "/club/guides",
            icon: Handshake,
            color: "text-charcoal",
            bg: "bg-charcoal/10",
          },
          {
            label: "Club Network",
            description: "Partner with other clubs for shared access",
            href: "/club/network",
            icon: Network,
            color: "text-river",
            bg: "bg-river/10",
          },
          {
            label: "Member Referrals",
            description: "Set up referral rewards for members",
            href: "/club/referrals",
            icon: Gift,
            color: "text-bronze",
            bg: "bg-bronze/10",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="border-stone-light/20 transition-colors hover:border-stone-light/40">
              <CardContent className="flex items-center gap-4 py-5">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
                >
                  <item.icon className={`size-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {item.label}
                  </p>
                  <p className="text-xs text-text-light">
                    {item.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Calendar feed — all club bookings in one subscription */}
      <CalendarFeedCard
        tokenEndpoint="/api/clubs/calendar-token"
        title="Club Bookings Calendar"
        description="Subscribe to all bookings across your club's properties. See who is fishing where, at a glance."
        color="river"
      />
    </div>
  );
}
