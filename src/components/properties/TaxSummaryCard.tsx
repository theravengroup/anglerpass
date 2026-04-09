import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

interface QuarterlyEarnings {
  quarter: string;
  earnings: number;
  gross: number;
  commissions: number;
  bookings: number;
}

interface TaxSummaryCardProps {
  ytdEarnings: number;
  quarterlyEarnings: QuarterlyEarnings[];
}

export default function TaxSummaryCard({
  ytdEarnings,
  quarterlyEarnings,
}: TaxSummaryCardProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4 text-forest" />
          Tax Summary
        </CardTitle>
        <CardDescription>
          Year-to-date earnings and quarterly breakdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-forest/20 bg-forest/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">YTD Net Earnings</p>
              <p className="text-3xl font-semibold text-forest">
                ${ytdEarnings.toLocaleString()}
              </p>
            </div>
            <p className="text-sm text-text-light">
              {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {quarterlyEarnings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                  <th className="pb-2 pr-4">Quarter</th>
                  <th className="pb-2 pr-4 text-right">Gross</th>
                  <th className="pb-2 pr-4 text-right">Commissions</th>
                  <th className="pb-2 pr-4 text-right">Net Earnings</th>
                  <th className="pb-2 text-right">Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-light/10">
                {quarterlyEarnings.map((q) => (
                  <tr key={q.quarter}>
                    <td className="py-2.5 pr-4 font-medium text-text-primary">
                      {q.quarter}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-text-secondary">
                      ${q.gross.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-right text-text-light">
                      -${q.commissions.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-medium text-forest">
                      ${q.earnings.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right text-text-secondary">
                      {q.bookings}
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
