"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

interface CompassStats {
  totalMessagesThisMonth: number;
  activeUsersThisMonth: number;
  totalCreditPurchases: number;
  creditRevenueCents: number;
  topUsers: {
    user_id: string;
    display_name: string;
    message_count: number;
  }[];
  usersAtLimit: number;
}

function CompassAdminContent() {
  const [stats, setStats] = useState<CompassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/compass/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-bronze" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "Messages This Month",
      value: stats.totalMessagesThisMonth.toLocaleString(),
      icon: MessageSquare,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Active Users",
      value: stats.activeUsersThisMonth.toLocaleString(),
      icon: Users,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Credit Purchases",
      value: stats.totalCreditPurchases.toLocaleString(),
      icon: TrendingUp,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Credit Revenue",
      value: `$${(stats.creditRevenueCents / 100).toFixed(2)}`,
      icon: DollarSign,
      color: "text-forest-deep",
      bg: "bg-forest-deep/10",
    },
    {
      label: "Users at Limit",
      value: stats.usersAtLimit.toLocaleString(),
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-parchment bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${card.bg}`}
              >
                <card.icon className={`size-4 ${card.color}`} />
              </div>
              <span className="text-xs text-text-secondary">{card.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-text-primary">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top users table */}
      <div className="rounded-xl border border-parchment bg-white">
        <div className="border-b border-parchment px-6 py-4">
          <h3 className="font-heading text-lg font-semibold text-forest-deep">
            Top Compass Users This Month
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-parchment text-left text-xs text-text-secondary">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium text-right">
                  Messages
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-6 py-8 text-center text-sm text-text-light"
                  >
                    No Compass usage yet this month
                  </td>
                </tr>
              ) : (
                stats.topUsers.map((user, i) => (
                  <tr
                    key={user.user_id}
                    className="border-b border-parchment/50 last:border-0"
                  >
                    <td className="px-6 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-stone-light text-xs font-medium text-text-secondary">
                          {i + 1}
                        </span>
                        <span className="text-text-primary">
                          {user.display_name || "Unknown User"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-text-primary">
                      {user.message_count.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompassPage() {
  return (
    <AdminPageGuard path="/admin/compass">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-bronze/10">
            <Sparkles className="size-5 text-bronze" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-forest-deep">
              Compass AI Usage
            </h1>
            <p className="text-sm text-text-secondary">
              Monitor AI usage, credit purchases, and user limits
            </p>
          </div>
        </div>

        <CompassAdminContent />
      </div>
    </AdminPageGuard>
  );
}
