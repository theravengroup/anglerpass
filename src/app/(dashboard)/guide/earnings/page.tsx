"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CalendarDays, Info } from "lucide-react";

export default function GuideEarningsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Earnings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Track your earnings from guided trips.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-text-light">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-forest" />
              <span className="text-2xl font-semibold text-text-primary">$0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-text-light">
              This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-river" />
              <span className="text-2xl font-semibold text-text-primary">$0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-text-light">
              All Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-bronze" />
              <span className="text-2xl font-semibold text-text-primary">$0</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout info */}
      <Card className="border-river/20 bg-river/5">
        <CardContent className="flex items-start gap-3 py-5">
          <Info className="size-5 shrink-0 text-river" />
          <div>
            <h3 className="text-sm font-medium text-text-primary">
              Payout Setup
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Payout setup via Stripe Connect is coming soon. Once available,
              you&apos;ll be able to link your bank account for automatic payouts
              after each completed trip. You keep 100% of your listed rate.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Empty bookings table */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-base">Booking Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="size-8 text-text-light" />
            <p className="mt-3 text-sm text-text-secondary">
              Your per-booking earnings will appear here after completed trips.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
