import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Transaction } from "./financials-types";

interface RecentTransactionsTableProps {
  transactions: Transaction[];
}

export function RecentTransactionsTable({
  transactions,
}: RecentTransactionsTableProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Recent Transactions — Full Fee Split
        </CardTitle>
        <CardDescription>
          Complete breakdown showing every party&apos;s share
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            No transactions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Property</th>
                  <th className="pb-2 pr-3 text-right">Total</th>
                  <th className="pb-2 pr-3 text-right">
                    <span className="text-forest">AP Fee</span>
                  </th>
                  <th className="pb-2 pr-3 text-right">
                    <span className="text-river">Cross-Club</span>
                  </th>
                  <th className="pb-2 pr-3 text-right">
                    <span className="text-charcoal">Guide Fee</span>
                  </th>
                  <th className="pb-2 pr-3 text-right">Landowner</th>
                  <th className="pb-2 pr-3 text-right">Club</th>
                  <th className="pb-2 text-right">Guide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-3 text-text-secondary">
                      {new Date(t.booking_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-2 pr-3 font-medium text-text-primary">
                      {t.property_name}
                    </td>
                    <td className="py-2 pr-3 text-right font-medium text-text-primary">
                      ${t.total_amount}
                    </td>
                    <td className="py-2 pr-3 text-right text-forest">
                      ${t.platform_fee}
                    </td>
                    <td className="py-2 pr-3 text-right text-river">
                      {(t.cross_club_fee ?? 0) > 0
                        ? `$${t.cross_club_fee}`
                        : "\u2014"}
                    </td>
                    <td className="py-2 pr-3 text-right text-charcoal">
                      {(t.guide_service_fee ?? 0) > 0
                        ? `$${t.guide_service_fee}`
                        : "\u2014"}
                    </td>
                    <td className="py-2 pr-3 text-right text-text-secondary">
                      ${t.landowner_payout}
                    </td>
                    <td className="py-2 pr-3 text-right text-text-secondary">
                      ${t.club_commission}
                    </td>
                    <td className="py-2 text-right text-text-secondary">
                      {(t.guide_payout ?? 0) > 0
                        ? `$${t.guide_payout}`
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
