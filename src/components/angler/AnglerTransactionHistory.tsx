import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Network, XCircle } from "lucide-react";

interface Transaction {
  id: string;
  status: string;
  booking_date: string;
  property_name: string;
  base_rate: number;
  platform_fee: number;
  guide_rate: number;
  guide_service_fee: number;
  cross_club_fee: number;
  total_amount: number;
  refund_amount: number;
  late_cancel_fee: number;
  created_at: string;
}

interface AnglerTransactionHistoryProps {
  transactions: Transaction[];
}

export default function AnglerTransactionHistory({
  transactions,
}: AnglerTransactionHistoryProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Booking Transaction History</CardTitle>
        <CardDescription>
          Detailed fee breakdown for each trip, including cancellations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            No transactions yet. Book a trip to see your spending breakdown.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Property</th>
                  <th className="pb-2 pr-4 text-right">Rod Fee</th>
                  <th className="pb-2 pr-4 text-right">Platform</th>
                  <th className="pb-2 pr-4 text-right">Guide</th>
                  <th className="pb-2 pr-4 text-right">Total</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {transactions.map((t) => {
                  const isCancelled = t.status === "cancelled";
                  return (
                    <tr
                      key={t.id}
                      className={isCancelled ? "opacity-60" : ""}
                    >
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(t.booking_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-text-primary">
                        {t.property_name}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        ${t.base_rate}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-light">
                        ${t.platform_fee}
                        {(t.cross_club_fee ?? 0) > 0 && (
                          <span
                            className="ml-1 inline-flex items-center text-[10px] text-bronze"
                            title="Cross-club fee"
                          >
                            <Network className="mr-0.5 size-2.5" />
                            +${t.cross_club_fee}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-text-secondary">
                        {(t.guide_rate ?? 0) > 0
                          ? `$${t.guide_rate + (t.guide_service_fee ?? 0)}`
                          : "\u2014"}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-medium text-text-primary">
                        {isCancelled ? (
                          <span className="text-red-500 line-through">
                            ${t.total_amount}
                          </span>
                        ) : (
                          `$${t.total_amount}`
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {isCancelled ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                              <XCircle className="size-3" />
                              cancelled
                            </span>
                            {(t.refund_amount ?? 0) > 0 && (
                              <p className="text-[10px] text-forest">
                                +${t.refund_amount} refund
                              </p>
                            )}
                            {(t.late_cancel_fee ?? 0) > 0 && (
                              <p className="text-[10px] text-red-500">
                                -${t.late_cancel_fee} late fee
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
                            {t.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
