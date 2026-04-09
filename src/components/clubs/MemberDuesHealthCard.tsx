import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface MemberDuesHealth {
  active: number;
  past_due: number;
  grace_period: number;
  lapsed: number;
}

interface MemberDuesHealthCardProps {
  duesHealth: MemberDuesHealth;
}

export default function MemberDuesHealthCard({
  duesHealth,
}: MemberDuesHealthCardProps) {
  const hasAtRisk =
    duesHealth.past_due > 0 ||
    duesHealth.grace_period > 0 ||
    duesHealth.lapsed > 0;

  return (
    <Card
      className={`border-stone-light/20 ${hasAtRisk ? "border-river/30" : ""}`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="size-4 text-river" />
          Member Dues Health
        </CardTitle>
        <CardDescription>
          Current standing of member dues payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-forest/20 bg-forest/5 p-3">
            <p className="text-2xl font-semibold text-forest">
              {duesHealth.active}
            </p>
            <p className="text-xs text-text-secondary">Active &amp; Current</p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              duesHealth.past_due > 0
                ? "border-river/30 bg-river/5"
                : "border-stone-light/20 bg-offwhite/50"
            }`}
          >
            <p
              className={`text-2xl font-semibold ${
                duesHealth.past_due > 0 ? "text-river" : "text-text-light"
              }`}
            >
              {duesHealth.past_due}
            </p>
            <p className="text-xs text-text-secondary">Past Due</p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              duesHealth.grace_period > 0
                ? "border-bronze/30 bg-bronze/5"
                : "border-stone-light/20 bg-offwhite/50"
            }`}
          >
            <p
              className={`text-2xl font-semibold ${
                duesHealth.grace_period > 0 ? "text-bronze" : "text-text-light"
              }`}
            >
              {duesHealth.grace_period}
            </p>
            <p className="text-xs text-text-secondary">Grace Period</p>
          </div>
          <div
            className={`rounded-lg border p-3 ${
              duesHealth.lapsed > 0
                ? "border-red-300 bg-red-50"
                : "border-stone-light/20 bg-offwhite/50"
            }`}
          >
            <p
              className={`text-2xl font-semibold ${
                duesHealth.lapsed > 0 ? "text-red-600" : "text-text-light"
              }`}
            >
              {duesHealth.lapsed}
            </p>
            <p className="text-xs text-text-secondary">Lapsed</p>
          </div>
        </div>
        {hasAtRisk && (
          <p className="flex items-center gap-1.5 text-xs text-river">
            <AlertTriangle className="size-3" />
            {duesHealth.past_due + duesHealth.grace_period} member
            {duesHealth.past_due + duesHealth.grace_period !== 1
              ? "s"
              : ""}{" "}
            need
            {duesHealth.past_due + duesHealth.grace_period === 1 ? "s" : ""}{" "}
            attention.
            <Link href="/club/members" className="underline">
              View members
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
