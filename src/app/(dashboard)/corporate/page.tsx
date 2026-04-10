"use client";

import { useEffect, useState } from "react";
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
  Building2,
  Users,
  UserCheck,
  Clock,
  DollarSign,
  MapPin,
  ArrowRight,
  Loader2,
} from "lucide-react";

type OnboardingState = "no_club" | "pending" | "payment_pending" | "active";

interface OnboardingData {
  state: OnboardingState;
  club?: {
    id: string;
    name: string;
    location: string | null;
    logo_url: string | null;
    corporate_initiation_fee: number | null;
    annual_dues: number | null;
  };
  membershipId?: string;
  applicationStatus?: string;
}

interface CorporateDashboardData {
  membership: {
    id: string;
    club_id: string;
    company_name: string | null;
    status: string;
    dues_status: string | null;
    joined_at: string;
  };
  club: { name: string; location: string | null };
  employees: Array<{
    id: string;
    user_id: string | null;
    display_name: string | null;
    email: string | null;
    status: string;
    joined_at: string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    status: string;
    invited_at: string;
  }>;
  summary: {
    activeEmployees: number;
    pendingInvitations: number;
    totalTeamSize: number;
  };
}

export default function CorporatePage() {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [dashboard, setDashboard] = useState<CorporateDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const onboardingRes = await fetch("/api/corporate/onboarding-status");
      let onboardingData: OnboardingData = { state: "no_club" };
      if (onboardingRes.ok) {
        onboardingData = await onboardingRes.json();
      }
      setOnboarding(onboardingData);

      if (onboardingData.state === "active") {
        const dashRes = await fetch("/api/corporate/dashboard");
        if (dashRes.ok) {
          setDashboard(await dashRes.json());
        }
      }
    } catch {
      // Silent fail — states remain at defaults
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
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  if (onboarding?.state === "no_club") {
    return <NoClubState />;
  }

  if (onboarding?.state === "pending" && onboarding.club) {
    return <PendingState club={onboarding.club} />;
  }

  if (onboarding?.state === "payment_pending" && onboarding.club) {
    return (
      <PaymentPendingState
        club={onboarding.club}
        membershipId={onboarding.membershipId}
      />
    );
  }

  if (onboarding?.state === "active" && dashboard) {
    return <ActiveDashboard data={dashboard} />;
  }

  return null;
}

// ─── No Club State ────────────────────────────────────────────────

function NoClubState() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Welcome to AnglerPass Corporate
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Find a club to host your corporate membership.
        </p>
      </div>
      <Card className="border-bronze/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
              <Building2 className="size-5 text-bronze" />
            </div>
            <div>
              <CardTitle className="text-lg">
                Get Started with Corporate Access
              </CardTitle>
              <CardDescription>
                Search for a fishing club that accepts corporate memberships and
                give your team access to exclusive private waters.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-text-secondary">
            Corporate memberships let you invite employees as anglers with no
            initiation fee — they only pay annual club dues. Browse available
            clubs to find the right fit for your&nbsp;organization.
          </p>
          <Link href="/angler/discover">
            <Button className="bg-bronze text-white hover:bg-bronze/90">
              Browse Clubs
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Pending State ────────────────────────────────────────────────

function PendingState({
  club,
}: {
  club: NonNullable<OnboardingData["club"]>;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Corporate Dashboard
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your corporate membership application is being reviewed.
        </p>
      </div>
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="size-5 text-amber-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-900">
                Application Under Review
              </CardTitle>
              <CardDescription className="text-amber-700">
                {club.name}
                {club.location ? ` · ${club.location}` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-800">
            Your corporate membership application has been submitted and is
            currently being reviewed by the club. You will be notified once a
            decision has been&nbsp;made.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Payment Pending State ────────────────────────────────────────

function PaymentPendingState({
  club,
  membershipId,
}: {
  club: NonNullable<OnboardingData["club"]>;
  membershipId?: string;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Corporate Dashboard
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Complete your corporate initiation fee to activate&nbsp;membership.
        </p>
      </div>
      <Card className="border-bronze/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
              <DollarSign className="size-5 text-bronze" />
            </div>
            <div>
              <CardTitle className="text-lg">Payment Required</CardTitle>
              <CardDescription>
                {club.name}
                {club.location ? ` · ${club.location}` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Your corporate membership has been approved. Pay the initiation fee
            to activate your account and start inviting&nbsp;employees.
          </p>
          {club.corporate_initiation_fee != null && (
            <p className="text-lg font-semibold text-text-primary">
              ${club.corporate_initiation_fee.toLocaleString()} initiation fee
            </p>
          )}
          <Button className="bg-bronze text-white hover:bg-bronze/90">
            Pay Initiation Fee
            <ArrowRight className="ml-1 size-4" />
          </Button>
          {membershipId && (
            <p className="text-xs text-text-light">
              Membership ID: {membershipId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Active Dashboard ─────────────────────────────────────────────

function ActiveDashboard({ data }: { data: CorporateDashboardData }) {
  const stats = [
    {
      label: "Active Employees",
      value: String(data.summary.activeEmployees),
      icon: UserCheck,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Pending Invitations",
      value: String(data.summary.pendingInvitations),
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      label: "Total Team Size",
      value: String(data.summary.totalTeamSize),
      icon: Users,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Corporate Dashboard
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your corporate membership and team access.
        </p>
      </div>

      {/* Company Overview */}
      <Card className="border-bronze/20 bg-bronze/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
              <Building2 className="size-5 text-bronze" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {data.membership.company_name ?? "Your Company"}
              </CardTitle>
              <CardDescription>
                {data.club.name}
                {data.club.location ? ` · ${data.club.location}` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-text-light">
            Member since{" "}
            {new Date(data.membership.joined_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-stone-light/20">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/corporate/staff">
          <Card className="border-stone-light/20 transition-colors hover:border-stone-light/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-forest/10">
                    <Users className="size-[18px] text-forest" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Invite Staff</CardTitle>
                    <CardDescription>
                      Add employees to your corporate membership
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="size-4 text-text-light" />
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/corporate/club">
          <Card className="border-stone-light/20 transition-colors hover:border-stone-light/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-river/10">
                    <MapPin className="size-[18px] text-river" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Club Details</CardTitle>
                    <CardDescription>
                      View your club membership information
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="size-4 text-text-light" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
