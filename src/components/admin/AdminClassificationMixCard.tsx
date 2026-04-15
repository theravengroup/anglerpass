import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers } from "lucide-react";
import { CLASSIFICATION_LABELS } from "@/lib/constants/fees";
import type { ClassificationMixEntry } from "./financials-types";

export function AdminClassificationMixCard({
  items,
}: {
  items: ClassificationMixEntry[];
}) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="size-4 text-river" />
          Classification Mix
        </CardTitle>
        <CardDescription>
          Bookings, GMV and platform fees by tier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-3 text-sm text-text-light">
            No classification data yet.
          </p>
        ) : (
          <div className="divide-y divide-stone-light/20">
            {items.map((c) => (
              <div
                key={c.classification}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-text-secondary">
                  {CLASSIFICATION_LABELS[c.classification] ?? c.classification}
                </span>
                <span className="text-right font-medium text-text-primary">
                  <span className="block">
                    {c.bookings} &middot; ${c.gmv.toLocaleString()} GMV
                  </span>
                  <span className="block text-xs text-text-secondary">
                    ${c.platform_fee.toLocaleString()} platform fees
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
