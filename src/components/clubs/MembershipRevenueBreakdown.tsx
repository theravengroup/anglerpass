import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import MonthlyBarChart from "@/components/shared/MonthlyBarChart";

interface MonthlyData {
  month: string;
  amount: number;
}

interface MembershipRevenueBreakdownProps {
  totalInitiationRevenue: number;
  totalDuesRevenue: number;
  totalMembershipRevenue: number;
  monthlyMembership: MonthlyData[];
}

export default function MembershipRevenueBreakdown({
  totalInitiationRevenue,
  totalDuesRevenue,
  totalMembershipRevenue,
  monthlyMembership,
}: MembershipRevenueBreakdownProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-bronze" />
          Membership Revenue Breakdown
        </CardTitle>
        <CardDescription>Initiation fees vs. annual dues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Initiation Fees</span>
            <span className="text-sm font-medium text-text-primary">
              ${totalInitiationRevenue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Annual Dues</span>
            <span className="text-sm font-medium text-text-primary">
              ${totalDuesRevenue.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-stone-light/20 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">
                Total Membership Revenue
              </span>
              <span className="text-sm font-semibold text-river">
                ${totalMembershipRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        {monthlyMembership.length > 0 && (
          <div className="pt-2">
            <p className="mb-2 text-xs text-text-light">
              Monthly membership revenue trend
            </p>
            <MonthlyBarChart data={monthlyMembership} color="bg-bronze" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
