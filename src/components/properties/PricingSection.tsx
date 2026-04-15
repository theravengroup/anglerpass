"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UseFormSetValue } from "react-hook-form";
import type { PropertyFormData } from "@/lib/validations/properties";
import { CLASSIFICATION_META } from "@/lib/constants/fees";
import type { PropertySectionProps } from "./property-form-types";

interface PricingSectionProps extends PropertySectionProps {
  halfDayAllowed: boolean;
  pricingMode: "rod_fee_split" | "upfront_lease";
  classification: "select" | "premier" | "signature" | null | undefined;
  setValue: UseFormSetValue<PropertyFormData>;
}

export default function PricingSection({
  register,
  errors,
  halfDayAllowed,
  pricingMode,
  classification,
  setValue,
}: PricingSectionProps) {
  const isLease = pricingMode === "upfront_lease";

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          Pricing &amp; Revenue Model
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Pricing mode toggle ─────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-primary">
            How do you want to be paid?
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setValue("pricing_mode", "rod_fee_split", { shouldDirty: true })}
              className={`rounded-lg border p-4 text-left transition ${
                !isLease
                  ? "border-forest bg-forest/5 ring-1 ring-forest"
                  : "border-stone-light/30 bg-white hover:border-stone-light"
              }`}
            >
              <div className="text-sm font-semibold text-text-primary">
                Rod fee split (per-trip)
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                Share each booking&apos;s rod fee with the club per
                classification. No commitment, ongoing revenue.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setValue("pricing_mode", "upfront_lease", { shouldDirty: true })}
              className={`rounded-lg border p-4 text-left transition ${
                isLease
                  ? "border-forest bg-forest/5 ring-1 ring-forest"
                  : "border-stone-light/30 bg-white hover:border-stone-light"
              }`}
            >
              <div className="text-sm font-semibold text-text-primary">
                Upfront annual lease
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                Club pays you a fixed annual amount via ACH. Club keeps
                100% of rod fees thereafter.
              </div>
            </button>
          </div>
        </div>

        {/* ── Rod-fee-split: classification picker ─────────────── */}
        {!isLease && (
          <div className="space-y-3 border-t border-stone-light/20 pt-4">
            <p className="text-sm font-medium text-text-primary">
              Property classification
            </p>
            <p className="text-xs text-text-secondary">
              Your club splits rod fees with you. Higher tiers send you a
              larger share of each booking.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {(["select", "premier", "signature"] as const).map((tier) => {
                const meta = CLASSIFICATION_META[tier];
                const active = classification === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setValue("classification", tier, { shouldDirty: true })}
                    className={`rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-forest bg-forest/5 ring-1 ring-forest"
                        : "border-stone-light/30 bg-white hover:border-stone-light"
                    }`}
                  >
                    <div className="text-sm font-semibold text-text-primary">
                      {meta.label}
                    </div>
                    <div className="mt-1 text-2xl font-heading text-forest">
                      {meta.landownerPct}%
                    </div>
                    <div className="text-[11px] uppercase tracking-wide text-text-light">
                      Your share
                    </div>
                    <div className="mt-2 text-xs text-text-secondary">
                      {meta.tagline}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.classification && (
              <p className="text-sm text-red-600" role="alert" aria-live="polite">
                {errors.classification.message}
              </p>
            )}
          </div>
        )}

        {/* ── Lease: amount + term ─────────────────────────────── */}
        {isLease && (
          <div className="space-y-4 border-t border-stone-light/20 pt-4">
            <p className="text-xs text-text-secondary">
              Your club will receive a lease proposal. You&apos;ll be paid via
              ACH after the club accepts &mdash; you receive the full amount you
              propose. AnglerPass&apos;s 5% facilitation fee is charged on top
              to the club.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lease_amount_usd">Annual lease amount ($)</Label>
                <Input
                  id="lease_amount_usd"
                  type="number"
                  step="100"
                  min="1000"
                  placeholder="e.g. 25000"
                  {...register("lease_amount_usd", { valueAsNumber: true })}
                />
                {errors.lease_amount_usd && (
                  <p className="text-sm text-red-600" role="alert" aria-live="polite">
                    {errors.lease_amount_usd.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lease_term_months">Term (months)</Label>
                <Input
                  id="lease_term_months"
                  type="number"
                  step="1"
                  min="1"
                  max="60"
                  placeholder="e.g. 12"
                  {...register("lease_term_months", { valueAsNumber: true })}
                />
                {errors.lease_term_months && (
                  <p className="text-sm text-red-600" role="alert" aria-live="polite">
                    {errors.lease_term_months.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Rod fee rates (always shown — also used for lease bookings) ── */}
        <div className="space-y-4 border-t border-stone-light/20 pt-4">
          <p className="text-sm font-medium text-text-primary">
            Full Day Rates
            <span className="ml-2 text-xs font-normal text-text-light">
              {isLease
                ? "(anglers still pay this, then 100% goes to the club)"
                : "(per rod / per angler)"}
            </span>
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate_adult_full_day">Adult ($)</Label>
              <Input
                id="rate_adult_full_day"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 250"
                {...register("rate_adult_full_day", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate_youth_full_day">Youth ($)</Label>
              <Input
                id="rate_youth_full_day"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 150"
                {...register("rate_youth_full_day", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate_child_full_day">Child ($)</Label>
              <Input
                id="rate_child_full_day"
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 75"
                {...register("rate_child_full_day", { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-stone-light/20 pt-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-4 rounded border-stone-light/30 accent-forest"
              {...register("half_day_allowed")}
            />
            <span className="text-sm font-medium text-text-primary">
              Allow half-day bookings
            </span>
          </label>
        </div>

        {halfDayAllowed && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text-primary">Half Day Rates</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate_adult_half_day">Adult ($)</Label>
                <Input
                  id="rate_adult_half_day"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 150"
                  {...register("rate_adult_half_day", { valueAsNumber: true })}
                />
                {errors.rate_adult_half_day && (
                  <p className="text-sm text-red-600">{errors.rate_adult_half_day.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate_youth_half_day">Youth ($)</Label>
                <Input
                  id="rate_youth_half_day"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 100"
                  {...register("rate_youth_half_day", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate_child_half_day">Child ($)</Label>
                <Input
                  id="rate_child_half_day"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 50"
                  {...register("rate_child_half_day", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
