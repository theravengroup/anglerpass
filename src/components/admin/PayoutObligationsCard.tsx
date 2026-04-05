import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users } from "lucide-react";
import type { StreamItem } from "./financials-types";

interface PayoutObligationsCardProps {
  payoutStreams: StreamItem[];
  totalPayouts: number;
}

export function PayoutObligationsCard({
  payoutStreams,
  totalPayouts,
}: PayoutObligationsCardProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-bronze" />
          Payout Obligations
        </CardTitle>
        <CardDescription>
          Total amounts owed to platform participants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalPayouts === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            No payout data yet.
          </p>
        ) : (
          <>
            {/* Dynamic widths from runtime data — Tailwind cannot generate arbitrary values */}
            <div className="flex h-4 overflow-hidden rounded-full">
              {payoutStreams.map((s) => (
                <div
                  key={s.label}
                  className={`${s.color} transition-all`}
                  style={{ width: `${(s.amount / totalPayouts) * 100}%` }}
                />
              ))}
            </div>
            <div className="space-y-2">
              {payoutStreams.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`size-3 rounded-sm ${s.color}`} />
                    <span className="text-text-secondary">{s.label}</span>
                  </div>
                  <span className="font-medium text-text-primary">
                    ${s.amount.toLocaleString()} (
                    {Math.round((s.amount / totalPayouts) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-light/20 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">
                  Total Payout Obligations
                </span>
                <span className="text-lg font-semibold text-bronze">
                  ${totalPayouts.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
