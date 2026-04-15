import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { formatShortDate } from "@/lib/utils";
import type { RecentLeasePayment } from "./financials-types";

export function AdminRecentLeasePaymentsCard({
  payments,
  total,
  count,
}: {
  payments: RecentLeasePayment[];
  total: number;
  count: number;
}) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-bronze" />
          Recent Lease Payments
        </CardTitle>
        <CardDescription>
          {count} payment{count === 1 ? "" : "s"} &middot; $
          {total.toLocaleString()} facilitation fees collected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-stone-light/20">
          {payments.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 items-center gap-2 py-2 text-sm"
            >
              <div className="col-span-4 min-w-0">
                <div className="truncate font-medium text-text-primary">
                  {p.property_name}
                </div>
                {p.club_name && (
                  <div className="truncate text-xs text-text-secondary">
                    {p.club_name}
                  </div>
                )}
              </div>
              <div className="col-span-4 text-xs text-text-secondary">
                {formatShortDate(p.period_start)} –{" "}
                {formatShortDate(p.period_end)}
                {p.paid_at
                  ? ` · paid ${formatShortDate(p.paid_at)}`
                  : ""}
              </div>
              <div className="col-span-4 text-right">
                <div className="font-medium text-text-primary">
                  ${p.amount.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary">
                  ${p.landowner_net.toLocaleString()} landowner &middot; $
                  {p.platform_fee.toLocaleString()} AP
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
