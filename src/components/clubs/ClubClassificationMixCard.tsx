import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Layers } from "lucide-react";
import { CLASSIFICATION_LABELS_CLUB } from "@/lib/constants/fees";

interface ClassificationMixEntry {
  classification: string;
  bookings: number;
  commission: number;
}

export function ClubClassificationMixCard({
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
          Rod-fee share earned by property tier (as managing club).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-stone-light/20">
          {items.map((c) => (
            <div
              key={c.classification}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-text-secondary">
                {CLASSIFICATION_LABELS_CLUB[c.classification] ??
                  c.classification}
              </span>
              <span className="font-medium text-text-primary">
                {c.bookings} booking{c.bookings === 1 ? "" : "s"} &middot; $
                {c.commission.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
