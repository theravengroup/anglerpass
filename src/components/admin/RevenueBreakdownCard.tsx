import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PieChart } from "lucide-react";
import type { StreamItem } from "./financials-types";

interface RevenueBreakdownCardProps {
  revenueStreams: StreamItem[];
  revenueTotal: number;
}

export function RevenueBreakdownCard({
  revenueStreams,
  revenueTotal,
}: RevenueBreakdownCardProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="size-4 text-forest" />
          Revenue by Source
        </CardTitle>
        <CardDescription>
          AnglerPass platform revenue streams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {revenueTotal === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            No revenue data yet.
          </p>
        ) : (
          <>
            <div className="flex h-4 overflow-hidden rounded-full">
              {revenueStreams.map((s) => (
                <div
                  key={s.label}
                  className={`${s.color} transition-all`}
                  style={{ width: `${(s.amount / revenueTotal) * 100}%` }}
                />
              ))}
            </div>
            <div className="space-y-2">
              {revenueStreams.map((s) => (
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
                    {Math.round((s.amount / revenueTotal) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-light/20 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">
                  Total Platform Revenue
                </span>
                <span className="text-lg font-semibold text-forest">
                  ${revenueTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
