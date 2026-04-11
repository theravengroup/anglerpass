"use client";

import { useEffect, useState } from "react";
import { MousePointerClick } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

interface ClickSummary {
  product_name: string;
  brand_name: string;
  click_count: number;
}

export default function AffiliateClicksPage() {
  const [data, setData] = useState<{ topProducts: ClickSummary[] } | null>(null);
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
        Loading click data…
      </div>
    );
  }

  const topProducts = data?.topProducts ?? [];

  if (topProducts.length === 0) {
    return (
      <EmptyState
        icon={MousePointerClick}
        title="No Clicks Yet"
        description="Click data will appear here once Compass AI starts recommending affiliate products to anglers. Each product click is tracked with source context."
      />
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Top products by clicks over the last 30 days.
      </p>

      <div className="overflow-x-auto rounded-xl border border-parchment bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-parchment bg-parchment-light/50 text-left text-xs font-medium uppercase tracking-wider text-text-light">
              <th className="px-5 py-3 w-8">#</th>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3 text-right">Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-parchment/50">
            {topProducts.map((product, i) => (
              <tr key={i}>
                <td className="px-5 py-3 text-text-light">{i + 1}</td>
                <td className="px-5 py-3 font-medium text-text-primary">
                  {product.product_name}
                </td>
                <td className="px-5 py-3 text-text-secondary">
                  {product.brand_name}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-forest-deep">
                  {product.click_count.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
