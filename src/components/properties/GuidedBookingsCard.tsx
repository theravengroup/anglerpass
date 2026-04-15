import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";

interface GuidedBookingsCardProps {
  guidedBookingsCount: number;
  totalGuideRate: number;
  totalGuidePayout: number;
}

export default function GuidedBookingsCard({
  guidedBookingsCount,
  totalGuideRate,
  totalGuidePayout,
}: GuidedBookingsCardProps) {
  if (guidedBookingsCount <= 0) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-charcoal" />
          Guided Bookings
        </CardTitle>
        <CardDescription>
          Revenue split on bookings with independent guides
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
            <p className="text-xl font-semibold text-text-primary">
              {guidedBookingsCount}
            </p>
            <p className="text-xs text-text-secondary">Guided Bookings</p>
          </div>
          <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
            <p className="text-xl font-semibold text-text-primary">
              ${totalGuideRate.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">Total Independent Guide Revenue</p>
          </div>
          <div className="rounded-lg border border-charcoal/20 bg-charcoal/5 p-3">
            <p className="text-xl font-semibold text-charcoal">
              ${totalGuidePayout.toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">Paid to Independent Guides</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-text-light">
          Independent guide rates are charged to anglers in addition to your rod fee. You
          receive your full net payout regardless of independent guide involvement.
        </p>
      </CardContent>
    </Card>
  );
}
