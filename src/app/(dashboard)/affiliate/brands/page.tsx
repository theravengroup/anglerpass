"use client";

import { useEffect, useState } from "react";
import { Building2, ExternalLink, Plus } from "lucide-react";
import { AFFILIATE_TIER_LABELS } from "@/lib/constants/affiliate";
import { EmptyState } from "@/components/shared/EmptyState";

interface Brand {
  id: string;
  name: string;
  slug: string;
  tier: string;
  website_url: string | null;
  commission_rate: number | null;
  is_active: boolean;
}

export default function AffiliateBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/affiliate")
      .then((res) => res.json())
      .then((data) => setBrands(data.brands ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        Loading brands…
      </div>
    );
  }

  if (brands.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No Brand Partners Yet"
        description="Add affiliate brand partners to start monetizing Compass AI gear recommendations. Brands are organized into three tiers: direct partners, authorized retailers, and digital products."
      />
    );
  }

  // Group by tier
  const tiers = ["direct", "retailer", "digital"] as const;

  return (
    <div className="space-y-8">
      {tiers.map((tier) => {
        const tierBrands = brands.filter((b) => b.tier === tier);
        if (tierBrands.length === 0) return null;

        return (
          <div key={tier}>
            <h2 className="mb-3 font-heading text-base font-semibold text-forest-deep">
              {AFFILIATE_TIER_LABELS[tier]}
              <span className="ml-2 text-sm font-normal text-text-light">
                ({tierBrands.length})
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tierBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="rounded-xl border border-parchment bg-white px-5 py-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-forest-deep">
                        {brand.name}
                      </p>
                      <p className="text-xs text-text-light">{brand.slug}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        brand.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone"
                      }`}
                    >
                      {brand.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {brand.commission_rate && (
                    <p className="mt-2 text-xs text-text-secondary">
                      Commission: {(brand.commission_rate * 100).toFixed(1)}%
                    </p>
                  )}
                  {brand.website_url && (
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-river hover:text-river-light"
                    >
                      <ExternalLink className="size-3" />
                      Website
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
