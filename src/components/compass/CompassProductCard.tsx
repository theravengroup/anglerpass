"use client";

import { ExternalLink, Tag } from "lucide-react";
import { PRODUCT_CATEGORY_LABELS, type AffiliateProductCategory } from "@/lib/constants/affiliate";

export interface ProductRecommendation {
  id: string;
  name: string;
  brand_name: string;
  brand_slug: string;
  category: AffiliateProductCategory;
  description: string | null;
  price_cents: number | null;
  image_url: string | null;
  affiliate_url: string;
  tier: "direct" | "retailer" | "digital";
  tags: string[];
}

interface CompassProductCardProps {
  product: ProductRecommendation;
  /** Source context for click tracking */
  source?: string;
  conversationId?: string;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** Tracks affiliate click and opens link */
async function trackClick(
  productId: string,
  affiliateUrl: string,
  source: string,
  conversationId?: string
) {
  // Fire-and-forget click tracking
  try {
    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        source,
        context: conversationId ? { conversation_id: conversationId } : {},
      }),
    }).catch(() => {
      // Silent fail — don't block navigation
    });
  } catch {
    // Silent fail
  }

  // Open affiliate link in new tab
  window.open(affiliateUrl, "_blank", "noopener,noreferrer");
}

export default function CompassProductCard({
  product,
  source = "compass",
  conversationId,
}: CompassProductCardProps) {
  const categoryLabel =
    PRODUCT_CATEGORY_LABELS[product.category] ?? product.category;

  return (
    <button
      type="button"
      onClick={() =>
        trackClick(product.id, product.affiliate_url, source, conversationId)
      }
      className="group flex w-full items-start gap-3 rounded-xl border border-parchment bg-white px-4 py-3 text-left transition-all hover:border-bronze/30 hover:shadow-sm"
    >
      {/* Product image or category icon */}
      {product.image_url ? (
        <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-parchment-light">
          <img
            src={product.image_url}
            alt={product.name}
            className="size-full object-contain"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-parchment-light text-stone">
          <Tag className="size-5" />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-forest-deep group-hover:text-forest">
              {product.name}
            </p>
            <p className="text-xs text-text-light">
              {product.brand_name}
              <span className="mx-1.5 text-parchment">·</span>
              {categoryLabel}
            </p>
          </div>
          <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-stone opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary">
            {product.description}
          </p>
        )}

        {product.price_cents && (
          <p className="mt-1 text-sm font-semibold text-bronze">
            {formatPrice(product.price_cents)}
          </p>
        )}
      </div>
    </button>
  );
}
