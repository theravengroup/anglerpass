"use client";

import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface MonthlyRevenue {
  period: string;
  clicks: number;
  conversions: number;
  revenue_cents: number;
}

interface RevenueData {
  stats: {
    approvedRevenue: string;
    pendingRevenue: string;
  };
  monthlyHistory: MonthlyRevenue[];
}

export default function AffiliateRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/affiliate")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        Loading revenue data…
      </div>
    );
  }

  const monthlyHistory = data?.monthlyHistory ?? [];

  if (monthlyHistory.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No Revenue Data Yet"
        description="Revenue from affiliate conversions will appear here once affiliate networks report conversions. Data flows in via network webhooks."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-parchment bg-white px-5 py-4">
          <p className="text-xs text-text-light">Approved Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {data?.stats.approvedRevenue ?? "$0.00"}
          </p>
        </div>
        <div className="rounded-xl border border-parchment bg-white px-5 py-4">
          <p className="text-xs text-text-light">Pending Revenue</p>
          <p className="mt-1 text-2xl font-semibold text-amber-600">
            {data?.stats.pendingRevenue ?? "$0.00"}
          </p>
        </div>
      </div>

      {/* Monthly table */}
      <div className="overflow-x-auto rounded-xl border border-parchment bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-parchment bg-parchment-light/50 text-left text-xs font-medium uppercase tracking-wider text-text-light">
              <th className="px-5 py-3">Period</th>
              <th className="px-5 py-3 text-right">Clicks</th>
              <th className="px-5 py-3 text-right">Conversions</th>
              <th className="px-5 py-3 text-right">Revenue</th>
              <th className="px-5 py-3 text-right">Conv. Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-parchment/50">
            {monthlyHistory.map((row) => {
              const convRate =
                row.clicks > 0
                  ? ((row.conversions / row.clicks) * 100).toFixed(1)
                  : "0";
              return (
                <tr key={row.period}>
                  <td className="px-5 py-3 font-medium text-text-primary">
                    {row.period}
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary">
                    {row.clicks.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary">
                    {row.conversions.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-forest-deep">
                    ${(row.revenue_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-text-secondary">
                    {convRate}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
