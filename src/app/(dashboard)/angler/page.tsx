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
  CalendarDays,
  Users,
  ArrowRight,
  Compass,
  Loader2,
  MapPin,
  DollarSign,
  Droplets,
  Download,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { STATUS_BADGE_COLORS } from "@/lib/constants/status";
import { WATER_TYPE_LABELS } from "@/lib/constants/water-types";
import { downloadCSV } from "@/lib/csv";
import OnboardingCard from "@/components/angler/OnboardingCard";
import MembershipStatusCard from "@/components/angler/MembershipStatusCard";
import CorporateInviteSection from "@/components/angler/CorporateInviteSection";
import SmsConsentCard from "@/components/shared/SmsConsentCard";

/** Angler-specific period options (includes "All time") */
const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "All time", value: 3650 },
];

interface Analytics {
  trips_total: number;
  trips_upcoming: number;
  trips_period: number;
  total_spent: number;
  memberships: number;
  favorite_properties: FavoriteProp[];
  recent_bookings: RecentBooking[];
}

interface FavoriteProp {
  name: string;
  count: number;
  water_type: string | null;
}

interface RecentBooking {
  id: string;
  status: string;
  booking_date: string;
  total_amount: number;
  duration: string;
  property_name: string;
  created_at: string;
}

interface ClubInvitation {
  id: string;
  club_name: string;
  admin_email: string;
  status: string;
  created_at: string;
}

interface CorporateMembership {
  membership_id: string;
  club_id: string;
  club_name: string;
  company_name: string;
}

interface ClubInfo {
  id: string;
  name: string;
  location: string | null;
  logo_url: string | null;
  initiation_fee: number | null;
  annual_dues: number | null;
}

type OnboardingState = "no_club" | "pending" | "payment_pending" | "active";

interface OnboardingData {
  state: OnboardingState;
  club?: ClubInfo;
  membershipId?: string;
  applicationStatus?: string;
}

export default function AnglerPage() {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [clubInvitations, setClubInvitations] = useState<ClubInvitation[]>([]);
  const [corporateMembership, setCorporateMembership] =
    useState<CorporateMembership | null>(null);

  async function load() {
    try {
      // Always fetch onboarding status first
      const onboardingRes = await fetch("/api/anglers/onboarding-status");
      let onboardingData: OnboardingData = { state: "no_club" };
      if (onboardingRes.ok) {
        onboardingData = await onboardingRes.json();
      }
      setOnboarding(onboardingData);

      // Only fetch full analytics if active
      if (onboardingData.state === "active") {
        const [analyticsRes, invitationsRes, corpRes] = await Promise.all([
          fetch(`/api/analytics?view=angler&days=${days}`),
          fetch("/api/anglers/invite-club"),
          fetch("/api/anglers/corporate-membership"),
        ]);
        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        }
        if (invitationsRes.ok) {
          const invData = await invitationsRes.json();
          setClubInvitations(invData.invitations ?? []);
        }
        if (corpRes.ok) {
          const corpData = await corpRes.json();
          if (corpData.membership) {
            setCorporateMembership(corpData.membership);
          }
        }
      } else if (onboardingData.state === "no_club") {
        // Fetch invitations for onboarding card
        const invRes = await fetch("/api/anglers/invite-club");
        if (invRes.ok) {
          const invData = await invRes.json();
          setClubInvitations(invData.invitations ?? []);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [days]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  // Onboarding states — show appropriate card instead of full dashboard
  if (onboarding?.state === "no_club") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Welcome to AnglerPass
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Join a fishing club to access exclusive private waters.
          </p>
        </div>
        <OnboardingCard existingInvitations={clubInvitations} />
      </div>
    );
  }

  if (onboarding?.state === "pending" && onboarding.club) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Your Fishing Dashboard
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Your club membership is being processed.
          </p>
        </div>
        <MembershipStatusCard
          state="pending"
          club={onboarding.club}
          applicationStatus={onboarding.applicationStatus}
        />
      </div>
    );
  }

  if (onboarding?.state === "payment_pending" && onboarding.club) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Your Fishing Dashboard
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Complete your membership payment to start booking.
          </p>
        </div>
        <MembershipStatusCard
          state="payment_pending"
          club={onboarding.club}
          membershipId={onboarding.membershipId}
          onPaymentSuccess={() => {
            // Reload to show full dashboard
            setLoading(true);
            load();
          }}
        />
      </div>
    );
  }

  // Active state — show full dashboard
  return <ActiveDashboard
    data={data}
    days={days}
    setDays={setDays}
    clubInvitations={clubInvitations}
    corporateMembership={corporateMembership}
  />;
}

// ─── Active Dashboard (extracted to stay under 300-line limit) ─────

function ActiveDashboard({
  data,
  days,
  setDays,
  clubInvitations,
  corporateMembership,
}: {
  data: Analytics | null;
  days: number;
  setDays: (d: number) => void;
  clubInvitations: ClubInvitation[];
  corporateMembership: CorporateMembership | null;
}) {
  function exportCSV() {
    if (!data) return;
    downloadCSV(
      [
        ["Date", "Property", "Status", "Duration", "Amount"],
        ...data.recent_bookings.map((b) => [
          b.booking_date,
          b.property_name,
          b.status,
          b.duration,
          String(b.total_amount),
        ]),
      ],
      `anglerpass-trips-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  const stats = [
    {
      label: "Upcoming Trips",
      value: String(data?.trips_upcoming ?? 0),
      description: `${data?.trips_total ?? 0} total trips`,
      icon: CalendarDays,
      color: "text-river",
      bg: "bg-river/10",
      href: "/angler/bookings",
    },
    {
      label: "Total Spent",
      value: `$${(data?.total_spent ?? 0).toLocaleString()}`,
      description: `${data?.trips_period ?? 0} trips last ${days}d`,
      icon: DollarSign,
      color: "text-bronze",
      bg: "bg-bronze/10",
      href: "/angler/bookings",
    },
    {
      label: "Memberships",
      value: String(data?.memberships ?? 0),
      description: "Active club memberships",
      icon: Users,
      color: "text-forest",
      bg: "bg-forest/10",
      href: "#",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Your Fishing Dashboard
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track your trips, spending, and club memberships.
          </p>
        </div>
        <div className="flex rounded-lg border border-stone-light/20">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                days === opt.value
                  ? "bg-bronze text-white"
                  : "text-text-secondary hover:bg-offwhite"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
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

      {/* Corporate Employee Invitation Section */}
      {corporateMembership && (
        <CorporateInviteSection
          membershipId={corporateMembership.membership_id}
          clubId={corporateMembership.club_id}
          clubName={corporateMembership.club_name}
          companyName={corporateMembership.company_name}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Favorite Properties */}
        {(data?.favorite_properties?.length ?? 0) > 0 && (
          <Card className="border-stone-light/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-forest" />
                Favorite Properties
              </CardTitle>
              <CardDescription>Most visited waters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data!.favorite_properties.map((prop) => (
                <div
                  key={prop.name}
                  className="flex items-center justify-between rounded-lg border border-stone-light/10 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {prop.name}
                    </p>
                    {prop.water_type && (
                      <p className="flex items-center gap-1 text-xs text-text-light">
                        <Droplets className="size-3" />
                        {WATER_TYPE_LABELS[prop.water_type] ?? prop.water_type}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-text-secondary">
                    {prop.count} trip{prop.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Bookings */}
        <RecentBookingsCard
          bookings={data?.recent_bookings ?? []}
          onExport={exportCSV}
        />
      </div>

      {/* SMS Consent — optional, dismissable */}
      <SmsConsentCard />

      {/* Discover CTA */}
      <Card className="border-bronze/20 bg-bronze/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="size-5 text-bronze" />
            Discover Private Waters
          </CardTitle>
          <CardDescription>
            Browse exclusive private fishing properties available through your
            club memberships and book your next day on the water.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/angler/discover">
            <Button className="bg-bronze text-white hover:bg-bronze/90">
              Browse Properties
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Recent Bookings Card ──────────────────────────────────────────

function RecentBookingsCard({
  bookings,
  onExport,
}: {
  bookings: RecentBooking[];
  onExport: () => void;
}) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Recent Bookings</CardTitle>
          <CardDescription>Your latest trips</CardDescription>
        </div>
        {bookings.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onExport}
          >
            <Download className="mr-1 size-3" />
            CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            No bookings yet. Discover properties to book your first trip!
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-stone-light/10 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {b.property_name}
                  </p>
                  <p className="text-xs text-text-light">
                    {new Date(b.booking_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {b.duration === "full_day" ? "Full Day" : "Half Day"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    ${b.total_amount}
                  </span>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_BADGE_COLORS[b.status] ?? STATUS_BADGE_COLORS.pending
                    }`}
                  >
                    {b.status === "confirmed" || b.status === "completed" ? (
                      <CheckCircle2 className="size-3" />
                    ) : (
                      <Clock className="size-3" />
                    )}
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/angler/bookings">
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full text-xs"
          >
            View All Bookings
            <ArrowRight className="ml-1 size-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
