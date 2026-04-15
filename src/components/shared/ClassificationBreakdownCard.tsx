import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers } from "lucide-react";
import { CLASSIFICATION_LABELS } from "@/lib/constants/fees";

interface ClassificationBreakdown {
  classification: string;
  bookings: number;
  landowner_payout: number;
}

/**
 * Displays a compact classification breakdown card.
 * Reused across landowner and admin dashboards.
 */
export function ClassificationBreakdownCard({
  items,
  labels = CLASSIFICATION_LABELS,
  valueLabel = "landowner_payout",
  color = "text-forest",
  description = "Bookings and landowner payout by property tier.",
}: {
  items: ClassificationBreakdown[];
  labels?: Record<string, string>;
  valueLabel?: "landowner_payout";
  color?: string;
  description?: string;
}) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className={`size-4 ${color}`} />
          Classification Breakdown
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-stone-light/20">
          {items.map((c) => (
            <div
              key={c.classification}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-text-secondary">
                {labels[c.classification] ?? c.classification}
              </span>
              <span className="font-medium text-text-primary">
                {c.bookings} booking{c.bookings === 1 ? "" : "s"} &middot; $
                {c[valueLabel].toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
