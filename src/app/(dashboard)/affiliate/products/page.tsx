"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Tag, ExternalLink } from "lucide-react";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants/affiliate";
import { EmptyState } from "@/components/shared/EmptyState";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price_cents: number | null;
  image_url: string | null;
  affiliate_url: string;
  tags: string[];
  brand_name: string;
  brand_slug: string;
  tier: string;
}

export default function AffiliateProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all products for management view
    fetch("/api/affiliate/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxResults: 20 }),
    })
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-text-secondary">
        Loading products…
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No Products Yet"
        description="Add affiliate products to the catalog. These are surfaced by Compass AI when anglers ask for gear recommendations."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        {products.length} product{products.length !== 1 ? "s" : ""} in catalog
      </p>

      <div className="overflow-x-auto rounded-xl border border-parchment bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-parchment bg-parchment-light/50 text-left text-xs font-medium uppercase tracking-wider text-text-light">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3 text-right">Price</th>
              <th className="px-5 py-3">Tags</th>
              <th className="px-5 py-3 text-center">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-parchment/50">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="size-8 rounded object-contain"
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded bg-parchment-light text-stone">
                        <Tag className="size-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-text-primary">
                        {product.name}
                      </p>
                      {product.description && (
                        <p className="line-clamp-1 text-xs text-text-light">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-text-secondary">
                  {product.brand_name}
                </td>
                <td className="px-5 py-3 text-text-secondary">
                  {PRODUCT_CATEGORY_LABELS[product.category as keyof typeof PRODUCT_CATEGORY_LABELS] ??
                    product.category}
                </td>
                <td className="px-5 py-3 text-right font-medium text-forest-deep">
                  {product.price_cents
                    ? `$${(product.price_cents / 100).toFixed(product.price_cents % 100 === 0 ? 0 : 2)}`
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-parchment-light px-1.5 py-0.5 text-[10px] text-text-light"
                      >
                        {tag}
                      </span>
                    ))}
                    {product.tags.length > 3 && (
                      <span className="text-[10px] text-text-light">
                        +{product.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-center">
                  <a
                    href={product.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-river hover:text-river-light"
                    aria-label={`Open affiliate link for ${product.name}`}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
