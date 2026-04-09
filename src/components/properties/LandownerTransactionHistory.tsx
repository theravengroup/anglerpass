import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { STATUS_BADGE_COLORS } from "@/lib/constants/status";

interface Transaction {
  id: string;
  status: string;
  payment_status: string;
  booking_date: string;
  property_name: string;
  angler_name: string | null;
  base_rate: number;
  club_commission: number;
  landowner_payout: number;
  rod_count: number;
  guide_rate: number;
  guide_payout: number;
  refund_amount: number;
  created_at: string;
}

interface LandownerTransactionHistoryProps {
  transactions: Transaction[];
}

export default function LandownerTransactionHistory({
  transactions,
}: LandownerTransactionHistoryProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <CardDescription>
          Detailed fee breakdown per booking
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
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Property</th>
                  <th className="pb-2 pr-4">Angler</th>
                  <th className="pb-2 pr-4 text-right">Gross</th>
                  <th className="pb-2 pr-4 text-right">Commission</th>
                  <th className="pb-2 pr-4 text-right">Net Payout</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className={
                      t.status === "cancelled" ? "opacity-60" : ""
                    }
                  >
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {new Date(t.booking_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-text-primary">
                      {t.property_name}
                      {(t.guide_rate ?? 0) > 0 && (
                        <span className="ml-1 text-[10px] text-charcoal">
                          (guided)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {t.angler_name ?? "\u2014"}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-text-primary">
                      ${t.base_rate}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-text-light">
                      -${t.club_commission}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-medium text-forest">
                      {t.status === "cancelled" ? (
                        <span className="text-red-500">
                          {(t.refund_amount ?? 0) > 0
                            ? `-$${t.refund_amount}`
                            : "Cancelled"}
                        </span>
                      ) : (
                        `$${t.landowner_payout}`
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.status === "cancelled"
                            ? "bg-red-50 text-red-600"
                            : STATUS_BADGE_COLORS[t.status] ??
                              STATUS_BADGE_COLORS.pending
                        }`}
                      >
                        {t.status === "confirmed" ||
                        t.status === "completed" ? (
                          <CheckCircle2 className="size-3" />
                        ) : t.status === "cancelled" ? (
                          <XCircle className="size-3" />
                        ) : (
                          <Clock className="size-3" />
                        )}
                        {t.status}
                      </span>
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
