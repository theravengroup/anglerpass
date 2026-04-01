"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import PayoutSetup from "@/components/shared/PayoutSetup";

export default function GuideEarningsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-charcoal/10">
          <DollarSign className="size-6 text-charcoal" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Earnings
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track your guide earnings and manage payouts.
          </p>
        </div>
      </div>

      {/* Payout Setup */}
      <PayoutSetup type="guide" />

      {/* Earnings Overview - placeholder cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <DollarSign className="size-3.5" />
              Total Earnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text-primary">$0.00</p>
            <p className="mt-1 text-xs text-text-light">All time</p>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <TrendingUp className="size-3.5" />
              This Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text-primary">$0.00</p>
            <p className="mt-1 text-xs text-text-light">0 trips</p>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <Calendar className="size-3.5" />
              Next Payout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-text-primary">&mdash;</p>
            <p className="mt-1 text-xs text-text-light">No pending payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Earnings */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-lg">Recent Earnings</CardTitle>
          <CardDescription>
            Your guide trip earnings will appear here once you start receiving
            bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-charcoal/10">
              <DollarSign className="size-5 text-charcoal" />
            </div>
            <p className="mt-3 text-sm font-medium text-text-primary">
              No Earnings Yet
            </p>
            <p className="mt-1 max-w-xs text-center text-sm text-text-secondary">
              Earnings from guided trips will be listed here as they come in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
