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
  member_name: string | null;
  created_at: string;
}

interface ClubMembershipPaymentsTableProps {
  payments: MembershipPayment[];
}

export default function ClubMembershipPaymentsTable({
  payments,
}: ClubMembershipPaymentsTableProps) {
  if (payments.length === 0) return null;

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-bronze" />
          Recent Membership Payments
        </CardTitle>
        <CardDescription>
          Initiation fees and annual dues collected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Member</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 text-right">Amount</th>
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
                    {p.member_name ?? "\u2014"}
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
                  <td className="py-2.5 text-right font-medium text-river">
                    ${(p.amount ?? 0).toLocaleString()}
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
