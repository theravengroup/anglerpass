import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SplitSquareHorizontal } from "lucide-react";
import type { PricingModeSplit } from "./financials-types";

export function PricingModeSplitCard({
  split,
}: {
  split: PricingModeSplit | undefined;
}) {
  const rod = split?.rod_fee_split ?? { bookings: 0, gmv: 0 };
  const lease = split?.upfront_lease ?? { bookings: 0, gmv: 0 };
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <SplitSquareHorizontal className="size-4 text-forest" />
          Pricing Mode Split
        </CardTitle>
        <CardDescription>
          Booking volume and GMV by property pricing mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Rod-fee split</span>
          <span className="font-medium text-text-primary">
            {rod.bookings} booking{rod.bookings === 1 ? "" : "s"} &middot; $
            {rod.gmv.toLocaleString()} GMV
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Upfront lease</span>
          <span className="font-medium text-text-primary">
            {lease.bookings} booking{lease.bookings === 1 ? "" : "s"} &middot; $
            {lease.gmv.toLocaleString()} GMV
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
