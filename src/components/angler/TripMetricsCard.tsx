import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface TripMetricsCardProps {
  costPerTrip: number;
  avgRodFee: number;
  totalBookings: number;
  totalRodFees: number;
  feeTotal: number;
}

export default function TripMetricsCard({
  costPerTrip,
  avgRodFee,
  totalBookings,
  totalRodFees,
  feeTotal,
}: TripMetricsCardProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="size-4 text-bronze" />
          Trip Metrics
        </CardTitle>
        <CardDescription>
          Average cost analysis across your trips
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-bronze/20 bg-bronze/5 p-3">
            <p className="text-2xl font-semibold text-bronze">
              ${costPerTrip.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">Avg Cost per Trip</p>
          </div>
          <div className="rounded-lg border border-forest/20 bg-forest/5 p-3">
            <p className="text-2xl font-semibold text-forest">
              ${avgRodFee.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">Avg Rod Fee</p>
          </div>
        </div>
        {totalBookings > 0 && (
          <p className="mt-3 text-xs text-text-light">
            Based on {totalBookings} trip{totalBookings !== 1 ? "s" : ""}. Rod
            fees make up{" "}
            {feeTotal > 0
              ? Math.round((totalRodFees / feeTotal) * 100)
              : 0}
            % of your total booking costs.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
