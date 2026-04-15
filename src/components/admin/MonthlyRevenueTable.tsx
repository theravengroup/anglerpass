import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MonthlyRevenue } from "./financials-types";

interface MonthlyRevenueTableProps {
  months: MonthlyRevenue[];
  platformFeeTotal: number;
  crossClubFeeTotal: number;
  guideServiceFeeTotal: number;
  platformRevenueTotal: number;
}

export function MonthlyRevenueTable({
  months,
  platformFeeTotal,
  crossClubFeeTotal,
  guideServiceFeeTotal,
  platformRevenueTotal,
}: MonthlyRevenueTableProps) {
  if (months.length === 0) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
        <CardDescription>
          Platform revenue by month, broken down by source
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                <th className="pb-2 pr-4">Month</th>
                <th className="pb-2 pr-4 text-right">Platform Fee</th>
                <th className="pb-2 pr-4 text-right">Cross-Club</th>
                <th className="pb-2 pr-4 text-right">Ind. Guide Service</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-light/10">
              {months.map((m) => (
                <tr key={m.month}>
                  <td className="py-2.5 pr-4 font-medium text-text-primary">
                    {new Date(m.month + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-text-secondary">
                    ${m.platform_fee.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-text-secondary">
                    ${m.cross_club_fee.toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4 text-right text-text-secondary">
                    ${m.guide_service_fee.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-medium text-forest">
                    ${m.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-light/30">
                <td className="pb-1 pt-3 pr-4 font-semibold text-text-primary">
                  Total
                </td>
                <td className="pb-1 pt-3 pr-4 text-right font-medium text-text-primary">
                  ${platformFeeTotal.toLocaleString()}
                </td>
                <td className="pb-1 pt-3 pr-4 text-right font-medium text-text-primary">
                  ${crossClubFeeTotal.toLocaleString()}
                </td>
                <td className="pb-1 pt-3 pr-4 text-right font-medium text-text-primary">
                  ${guideServiceFeeTotal.toLocaleString()}
                </td>
                <td className="pb-1 pt-3 text-right text-lg font-semibold text-forest">
                  ${platformRevenueTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
