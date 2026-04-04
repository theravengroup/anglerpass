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
import {
  Users,
  ShieldCheck,
  MapPin,
  Inbox,
  CalendarDays,
  DollarSign,
  Building2,
  TrendingUp,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  PERIOD_OPTIONS,
  STATUS_BADGE_COLORS,
} from "@/lib/constants/status";
import { downloadCSV } from "@/lib/csv";
import { FetchError } from "@/components/shared/FetchError";

/** Plural labels for the admin role breakdown chart */
const ROLE_LABELS_PLURAL: Record<string, string> = {
  angler: "Anglers",
  landowner: "Landowners",
  club_admin: "Club Admins",
  admin: "Admins",
};

interface Analytics {
  users_total: number;
  users_new: number;
  users_by_role: Record<string, number>;
  properties_total: number;
  properties_published: number;
  pending_review: number;
  bookings_total: number;
  bookings_period: number;
  clubs_total: number;
  leads_total: number;
  leads_period: number;
  platform_revenue: number;
  platform_revenue_period: number;
  gmv_total: number;
  recent_bookings: RecentBooking[];
}

interface RecentBooking {
  id: string;
  status: string;
  booking_date: string;
  total_amount: number;
  property_name: string;
  angler_name: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  async function load() {
    setError(false);
    try {
      const res = await fetch(`/api/analytics?view=admin&days=${days}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
  }, [days]);

  function handleExport() {
    if (!data) return;
    downloadCSV(
      [
        ["Metric", "Value"],
        ["Total Users", String(data.users_total)],
        ["New Users (period)", String(data.users_new)],
        ["Total Properties", String(data.properties_total)],
        ["Published Properties", String(data.properties_published)],
        ["Pending Review", String(data.pending_review)],
        ["Total Bookings", String(data.bookings_total)],
        ["Bookings (period)", String(data.bookings_period)],
        ["Clubs", String(data.clubs_total)],
        ["Total Leads", String(data.leads_total)],
        ["Leads (period)", String(data.leads_period)],
        ["Platform Revenue", data.platform_revenue.toFixed(2)],
        ["Platform Revenue (period)", data.platform_revenue_period.toFixed(2)],
        ["GMV Total", data.gmv_total.toFixed(2)],
        ...Object.entries(data.users_by_role).map(([role, count]) => [
          `Users: ${role}`,
          String(count),
        ]),
      ],
      `anglerpass-admin-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError message="Failed to load analytics." onRetry={load} />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Users",
      value: String(data?.users_total ?? 0),
      description: `${data?.users_new ?? 0} new last ${days}d`,
      icon: Users,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Properties",
      value: `${data?.properties_published ?? 0}/${data?.properties_total ?? 0}`,
      description: `${data?.pending_review ?? 0} pending review`,
      icon: MapPin,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Bookings",
      value: String(data?.bookings_total ?? 0),
      description: `${data?.bookings_period ?? 0} last ${days}d`,
      icon: CalendarDays,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Clubs",
      value: String(data?.clubs_total ?? 0),
      description: "Active clubs",
      icon: Building2,
      color: "text-charcoal",
      bg: "bg-charcoal/10",
    },
    {
      label: "Platform Revenue",
      value: `$${(data?.platform_revenue ?? 0).toLocaleString()}`,
      description: `$${(data?.platform_revenue_period ?? 0).toLocaleString()} last ${days}d`,
      icon: DollarSign,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "GMV",
      value: `$${(data?.gmv_total ?? 0).toLocaleString()}`,
      description: "Gross merchandise value",
      icon: TrendingUp,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Total Leads",
      value: String(data?.leads_total ?? 0),
      description: `${data?.leads_period ?? 0} last ${days}d`,
      icon: Inbox,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Pending Review",
      value: String(data?.pending_review ?? 0),
      description: "Properties awaiting approval",
      icon: ShieldCheck,
      color: "text-river",
      bg: "bg-river/10",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Admin Console
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Platform overview and management tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleExport}
          >
            <Download className="mr-1 size-3" />
            Export Report
          </Button>
          <div className="flex rounded-lg border border-stone-light/20">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  days === opt.value
                    ? "bg-river text-white"
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users by Role */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Users by Role</CardTitle>
            <CardDescription>Breakdown of registered accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data?.users_by_role ?? {})
              .sort(([, a], [, b]) => b - a)
              .map(([role, count]) => {
                const pct =
                  (data?.users_total ?? 0) > 0
                    ? (count / data!.users_total) * 100
                    : 0;
                const colors: Record<string, string> = {
                  angler: "bg-bronze",
                  landowner: "bg-forest",
                  club_admin: "bg-river",
                  admin: "bg-charcoal",
                };
                return (
                  <div key={role} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-primary">
                        {ROLE_LABELS_PLURAL[role] ?? role}
                      </span>
                      <span className="text-text-secondary">
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                      <div
                        className={`h-full rounded-full transition-all ${colors[role] ?? "bg-charcoal"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(data?.users_by_role ?? {}).length === 0 && (
              <p className="py-4 text-center text-sm text-text-light">
                No users yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent>
            {(data?.recent_bookings?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-sm text-text-secondary">
                  No recent bookings to display.
                </p>
                <p className="mt-1 text-xs text-text-light">
                  Activity will appear here as users book properties.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data!.recent_bookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-stone-light/10 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {b.property_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-text-light">
                        {b.angler_name ?? "Unknown"} ·{" "}
                        {new Date(b.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
