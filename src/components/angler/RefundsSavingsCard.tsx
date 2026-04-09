import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown, XCircle, AlertTriangle, Sparkles } from "lucide-react";

interface RefundsSavingsCardProps {
  totalRefunds: number;
  totalCancellations: number;
  totalLateFees: number;
  totalDiscountSavings: number;
}

export default function RefundsSavingsCard({
  totalRefunds,
  totalCancellations,
  totalLateFees,
  totalDiscountSavings,
}: RefundsSavingsCardProps) {
  const hasRefunds = totalRefunds > 0;
  const hasLateFees = totalLateFees > 0;
  const hasDiscounts = totalDiscountSavings > 0;

  if (!hasRefunds && !hasLateFees && !hasDiscounts) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingDown className="size-4 text-river" />
          Refunds, Fees &amp; Savings
        </CardTitle>
        <CardDescription>
          Cancellation refunds, late fees, and discounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasRefunds && (
          <div className="flex items-center justify-between rounded-lg border border-forest/20 bg-forest/5 p-3">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-forest" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Refunds Received
                </p>
                <p className="text-xs text-text-light">
                  From {totalCancellations} cancellation
                  {totalCancellations !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-forest">
              +${totalRefunds.toLocaleString()}
            </p>
          </div>
        )}
        {hasLateFees && (
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Late Cancel Fees
                </p>
                <p className="text-xs text-text-light">
                  $15 per late cancellation (within 72 hrs)
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-red-600">
              -${totalLateFees.toLocaleString()}
            </p>
          </div>
        )}
        {hasDiscounts && (
          <div className="flex items-center justify-between rounded-lg border border-river/20 bg-river/5 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-river" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Staff Discount Savings
                </p>
                <p className="text-xs text-text-light">
                  50% own-club, 25% cross-club
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-river">
              -${totalDiscountSavings.toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
