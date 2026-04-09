import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface Transaction {
  id: string;
  status: string;
  booking_date: string;
  property_name: string;
  angler_name: string | null;
  club_commission: number;
  base_rate: number;
  rod_count: number;
  created_at: string;
}

interface ClubTransactionHistoryProps {
  transactions: Transaction[];
}

export default function ClubTransactionHistory({
  transactions,
}: ClubTransactionHistoryProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4 text-forest" />
          Booking Commission History
        </CardTitle>
        <CardDescription>
          Commission earned from property bookings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            No booking transactions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Property</th>
                  <th className="pb-2 pr-4">Angler</th>
                  <th className="pb-2 pr-4 text-right">Rods</th>
                  <th className="pb-2 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {new Date(t.booking_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-text-primary">
                      {t.property_name}
                    </td>
                    <td className="py-2.5 pr-4 text-text-secondary">
                      {t.angler_name ?? "\u2014"}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-text-secondary">
                      {t.rod_count}
                    </td>
                    <td className="py-2.5 text-right font-medium text-river">
                      ${t.club_commission}
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
