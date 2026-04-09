import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";

interface MembershipPayment {
  id: string;
  type: string;
  amount: number;
  processing_fee: number;
  club_name: string | null;
  created_at: string;
}

interface MembershipPaymentsTableProps {
  payments: MembershipPayment[];
  totalInitiationFees: number;
  totalAnnualDues: number;
  totalProcessingFees: number;
}

export default function MembershipPaymentsTable({
  payments,
  totalInitiationFees,
  totalAnnualDues,
  totalProcessingFees,
}: MembershipPaymentsTableProps) {
  if (payments.length === 0) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-charcoal" />
              Membership Payments
            </CardTitle>
            <CardDescription>
              Club initiation fees and annual dues
            </CardDescription>
          </div>
          {(totalInitiationFees > 0 || totalAnnualDues > 0) && (
            <div className="flex items-center gap-4 text-xs text-text-light">
              <span>
                Initiation:{" "}
                <strong className="text-text-secondary">
                  ${totalInitiationFees.toLocaleString()}
                </strong>
              </span>
              <span>
                Dues:{" "}
                <strong className="text-text-secondary">
                  ${totalAnnualDues.toLocaleString()}
                </strong>
              </span>
              {totalProcessingFees > 0 && (
                <span>
                  Processing:{" "}
                  <strong className="text-text-secondary">
                    ${totalProcessingFees.toLocaleString()}
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Club</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2 text-right">Processing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-light/10">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 pr-4 text-text-secondary">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-text-primary">
                    {p.club_name ?? "\u2014"}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.type === "initiation_fee"
                          ? "bg-river/10 text-river"
                          : "bg-bronze/10 text-bronze"
                      }`}
                    >
                      {p.type === "initiation_fee"
                        ? "Initiation"
                        : "Annual Dues"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-medium text-text-primary">
                    ${(p.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right text-text-light">
                    {(p.processing_fee ?? 0) > 0
                      ? `$${(p.processing_fee ?? 0).toLocaleString()}`
                      : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
