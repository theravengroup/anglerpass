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
  MapPin,
  CalendarDays,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  Download,
  Plus,
} from "lucide-react";
import PayoutSetup from "@/components/shared/PayoutSetup";
import LandownerOnboardingCard from "@/components/properties/LandownerOnboardingCard";
import { PERIOD_OPTIONS, STATUS_BADGE_COLORS } from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";

interface Analytics {
  properties_total: number;
  properties_published: number;
  bookings_total: number;
  bookings_pending: number;
  bookings_confirmed: number;
  bookings_period: number;
  revenue_total: number;
  revenue_period: number;
  conversion_rate: number;
  recent_bookings: RecentBooking[];
  revenue_by_property: PropertyRevenue[];
}

interface RecentBooking {
  id: string;
  status: string;
  booking_date: string;
  base_rate: number;
  property_name: string;
  angler_name: string | null;
  created_at: string;
}

interface PropertyRevenue {
  name: string;
  revenue: number;
  bookings: number;
}

type LandownerOnboardingState =
  | "no_property"
  | "property_draft"
  | "pending_review"
  | "changes_requested"
  | "payout_needed"
  | "active";

interface OnboardingData {
  state: LandownerOnboardingState;
  property?: { id: string; name: string };
  checklist?: {
    has_photos: boolean;
    photo_count: number;
    has_pricing: boolean;
    has_capacity: boolean;
    has_club: boolean;
  };
  moderationNote?: string | null;
  propertiesTotal?: number;
  propertiesPublished?: number;
}

export default function LandownerPage() {
  const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  async function load() {
    try {
      // Fetch onboarding status first
      const onboardingRes = await fetch("/api/landowners/onboarding-status");
      let onboardingData: OnboardingData = { state: "no_property" };
      if (onboardingRes.ok) {
        onboardingData = await onboardingRes.json();
      }
      setOnboarding(onboardingData);

      // Only fetch analytics if active
      if (onboardingData.state === "active") {
        const res = await fetch(`/api/analytics?view=landowner&days=${days}`);
        if (res.ok) {
          setData(await res.json());
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
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  // Non-active states — show onboarding card
  if (onboarding && onboarding.state !== "active") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Property Management
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {onboarding.state === "no_property"
              ? "List your private water on AnglerPass to start earning revenue."
              : "Complete your property setup to start accepting bookings."}
          </p>
        </div>
        <LandownerOnboardingCard
          state={onboarding.state}
          property={onboarding.property}
          checklist={onboarding.checklist}
          moderationNote={onboarding.moderationNote}
        />
      </div>
    );
  }

  // Active — show full dashboard
  return (
    <ActiveLandownerDashboard data={data} days={days} setDays={setDays} />
  );
}

// ─── Active Landowner Dashboard ────────────────────────────────────

function ActiveLandownerDashboard({
  data,
  days,
  setDays,
}: {
  data: Analytics | null;
  days: number;
  setDays: (d: number) => void;
}) {
  function exportCSV() {
    if (!data) return;
    downloadCSV(
      [
        ["Property", "Revenue", "Bookings"],
        ...data.revenue_by_property.map((p) => [
          p.name,
          p.revenue.toFixed(2),
          String(p.bookings),
        ]),
      ],
      `anglerpass-revenue-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  const stats = [
    {
      label: "Properties",
      value: `${data?.properties_published ?? 0}/${data?.properties_total ?? 0}`,
      description: "Published / Total",
      icon: MapPin,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Pending Bookings",
      value: String(data?.bookings_pending ?? 0),
      description: `${data?.bookings_confirmed ?? 0} confirmed total`,
      icon: CalendarDays,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Revenue",
      value: `$${(data?.revenue_total ?? 0).toLocaleString()}`,
      description: `$${(data?.revenue_period ?? 0).toLocaleString()} last ${days}d`,
      icon: DollarSign,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Conversion Rate",
      value: `${data?.conversion_rate ?? 0}%`,
      description: `${data?.bookings_period ?? 0} bookings last ${days}d`,
      icon: TrendingUp,
      color: "text-river",
      bg: "bg-river/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Property Management
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Overview of your properties, bookings, and revenue.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-stone-light/20">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  days === opt.value
                    ? "bg-forest text-white"
                    : "text-text-secondary hover:bg-offwhite"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <p className="mt-1 text-xs text-text-light">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payout setup — required for receiving booking revenue */}
      <PayoutSetup type="landowner" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Property */}
        {(data?.revenue_by_property?.length ?? 0) > 0 && (
          <Card className="border-stone-light/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">
                  Revenue by Property
                </CardTitle>
                <CardDescription>
                  Confirmed & completed bookings
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={exportCSV}
              >
                <Download className="mr-1 size-3" />
                CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {data!.revenue_by_property.map((prop) => {
                const pct =
                  (data?.revenue_total ?? 0) > 0
                    ? (prop.revenue / data!.revenue_total) * 100
                    : 0;
                return (
                  <div key={prop.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">
                        {prop.name}
                      </span>
                      <span className="text-text-secondary">
                        ${prop.revenue.toLocaleString()} · {prop.bookings}{" "}
                        booking
                        {prop.bookings !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                      <div
                        className="h-full rounded-full bg-forest transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Recent Bookings */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.recent_bookings?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-text-light">
                No bookings yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data!.recent_bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-stone-light/10 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {b.property_name}
                      </p>
                      <p className="text-xs text-text-light">
                        {b.angler_name ?? "Unknown angler"} ·{" "}
                        {new Date(b.booking_date).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        ${b.base_rate}
                      </span>
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_BADGE_COLORS[b.status] ??
                          STATUS_BADGE_COLORS.pending
                        }`}
                      >
                        {b.status === "confirmed" ||
                        b.status === "completed" ? (
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
            <Link href="/landowner/bookings">
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
      </div>

      {/* Add another property */}
      <Link href="/landowner/properties/new">
        <Button variant="outline" className="w-full border-forest/20 text-forest hover:bg-forest/5">
          <Plus className="mr-1 size-4" />
          Add Another Property
        </Button>
      </Link>
    </div>
  );
}
