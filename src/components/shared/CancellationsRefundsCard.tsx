import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { XCircle } from "lucide-react";

interface CancellationsRefundsCardProps {
  title: string;
  description: string;
  totalCancellations: number;
  /** Dollar amount (refunded or lost commission) */
  totalAmount: number;
  /** Label for the amount metric, e.g. "Total Refunded" or "Lost Commission" */
  amountLabel: string;
  /** Period cancellations count */
  periodCancellations?: number;
  /** Days in current period */
  days?: number;
  /** Extra text for the period line, e.g. "($1,200 refunded)" */
  periodSuffix?: string;
}

export default function CancellationsRefundsCard({
  title,
  description,
  totalCancellations,
  totalAmount,
  amountLabel,
  periodCancellations,
  days,
  periodSuffix,
}: CancellationsRefundsCardProps) {
  if (totalCancellations <= 0) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <XCircle className="size-4 text-red-500" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 p-3">
            <p className="text-xl font-semibold text-text-primary">
              {totalCancellations}
            </p>
            <p className="text-xs text-text-secondary">Total Cancellations</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-xl font-semibold text-red-600">
              {totalAmount < 0 ? "-" : ""}${Math.abs(totalAmount).toLocaleString()}
            </p>
            <p className="text-xs text-text-secondary">{amountLabel}</p>
          </div>
        </div>
        {(periodCancellations ?? 0) > 0 && days && (
          <p className="mt-3 text-xs text-text-light">
            {periodCancellations} cancellation
            {periodCancellations !== 1 ? "s" : ""} in the last {days} days
            {periodSuffix ? ` ${periodSuffix}` : ""}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
