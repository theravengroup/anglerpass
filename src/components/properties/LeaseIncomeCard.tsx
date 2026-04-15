import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

interface LeasePayment {
  id: string;
  property_name: string;
  club_name?: string;
  amount: number;
  platform_fee: number;
  landowner_net: number;
  period_start: string;
  period_end: string;
  paid_at: string | null;
}

export function LeaseIncomeCard({
  totalLeaseIncome,
  periodLeaseIncome,
  days,
  payments,
}: {
  totalLeaseIncome: number;
  periodLeaseIncome: number;
  days: number;
  payments: LeasePayment[];
}) {
  return (
    <Card className="border-forest/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-forest" />
          Lease Income
        </CardTitle>
        <CardDescription>
          ${totalLeaseIncome.toLocaleString()} total &middot; $
          {periodLeaseIncome.toLocaleString()} last {days}d
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="py-3 text-sm text-text-light">
            No lease payments received yet.
          </p>
        ) : (
          <div className="divide-y divide-stone-light/20">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-text-primary">
                    {p.property_name}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatShortDate(p.period_start)} –{" "}
                    {formatShortDate(p.period_end)}
                    {p.paid_at
                      ? ` · paid ${formatShortDate(p.paid_at)}`
                      : ""}
                  </div>
                </div>
                <div className="text-right font-medium text-forest">
                  ${p.landowner_net.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
