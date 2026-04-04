import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

interface MembershipRevenueCardProps {
  membershipGmv: number;
  membershipProcessingFees: number;
}

export function MembershipRevenueCard({
  membershipGmv,
  membershipProcessingFees,
}: MembershipRevenueCardProps) {
  if (membershipGmv <= 0) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowUpRight className="size-4 text-river" />
          Membership Revenue
        </CardTitle>
        <CardDescription>
          Club membership fees processed through the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-stone-light/20 p-4">
            <p className="text-xs text-text-light">Membership GMV</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              ${membershipGmv.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-stone-light/20 p-4">
            <p className="text-xs text-text-light">Processing Fees Collected</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              ${membershipProcessingFees.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
