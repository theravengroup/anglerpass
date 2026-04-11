"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Building2,
  Clock,
} from "lucide-react";
import {
  AFFILIATE_TIER_LABELS,
} from "@/lib/constants/affiliate";

interface AffiliateStats {
  period: string;
  stats: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: string;
    approvedRevenue: string;
    pendingRevenue: string;
    activeBrandCount: number;
  };
  brands: Array<{
    id: string;
    name: string;
    slug: string;
    tier: string;
    is_active: boolean;
  }>;
  topProducts: Array<{
    product_name: string;
    brand_name: string;
    click_count: number;
  }>;
  monthlyHistory: Array<{
    period: string;
    clicks: number;
    conversions: number;
    revenue_cents: number;
  }>;
}

const STAT_CARDS = [
  {
    key: "totalClicks",
    label: "Clicks This Month",
    icon: MousePointerClick,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    key: "totalConversions",
    label: "Conversions",
    icon: ShoppingCart,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  {
    key: "conversionRate",
    label: "Conversion Rate",
    icon: TrendingUp,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  {
    key: "approvedRevenue",
    label: "Approved Revenue",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "pendingRevenue",
    label: "Pending Revenue",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "activeBrandCount",
    label: "Active Brands",
    icon: Building2,
    color: "text-charcoal",
    bg: "bg-charcoal/10",
  },
] as const;

export default function AffiliateDashboardPage() {
  const [data, setData] = useState<AffiliateStats | null>(null);
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
        Loading affiliate data…
      </div>
    );
  }

  if (!data || data.stats === undefined) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-bronze/10 text-bronze">
          <Link2 className="size-6" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-forest-deep">
          Affiliate Program
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          No data yet. Add brands and products to get started.
        </p>
      </div>
    );
  }

  const { stats, brands, topProducts, monthlyHistory } = data;

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats[card.key as keyof typeof stats];
          return (
            <div
              key={card.key}
              className="rounded-xl border border-parchment bg-white px-4 py-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${card.bg}`}
                >
                  <Icon className={`size-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-forest-deep">{value}</p>
              <p className="mt-0.5 text-xs text-text-light">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Brands */}
        <div className="rounded-xl border border-parchment bg-white">
          <div className="border-b border-parchment px-5 py-4">
            <h2 className="font-heading text-base font-semibold text-forest-deep">
              Active Brand Partners
            </h2>
          </div>
          <div className="divide-y divide-parchment/50">
            {brands.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-light">
                No brands configured yet. Add affiliate brands to&nbsp;get&nbsp;started.
              </p>
            ) : (
              brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {brand.name}
                    </p>
                    <p className="text-xs text-text-light">{brand.slug}</p>
                  </div>
                  <span className="rounded-full bg-parchment-light px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {AFFILIATE_TIER_LABELS[brand.tier as keyof typeof AFFILIATE_TIER_LABELS] ??
                      brand.tier}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-parchment bg-white">
          <div className="border-b border-parchment px-5 py-4">
            <h2 className="font-heading text-base font-semibold text-forest-deep">
              Top Products (Last 30 Days)
            </h2>
          </div>
          <div className="divide-y divide-parchment/50">
            {topProducts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-text-light">
                No click data yet. Product clicks will appear here once Compass AI starts
                recommending&nbsp;products.
              </p>
            ) : (
              topProducts.map((product, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-text-light">
                      {product.brand_name}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-forest-deep">
                    {product.click_count} clicks
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Revenue History */}
      {monthlyHistory.length > 0 && (
        <div className="rounded-xl border border-parchment bg-white">
          <div className="border-b border-parchment px-5 py-4">
            <h2 className="font-heading text-base font-semibold text-forest-deep">
              Monthly Revenue History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-parchment bg-parchment-light/50 text-left text-xs font-medium uppercase tracking-wider text-text-light">
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3 text-right">Clicks</th>
                  <th className="px-5 py-3 text-right">Conversions</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment/50">
                {monthlyHistory.map((row) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
