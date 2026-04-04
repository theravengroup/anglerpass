"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertySectionProps } from "./property-form-types";

interface PricingSectionProps extends PropertySectionProps {
  halfDayAllowed: boolean;
}

export default function PricingSection({
  register,
  errors,
  halfDayAllowed,
}: PricingSectionProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Full Day Rates */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-text-primary">
            Full Day Rates
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

        {/* Half Day Toggle */}
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

        {/* Half Day Rates */}
        {halfDayAllowed && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text-primary">
              Half Day Rates
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate_adult_half_day">Adult ($)</Label>
                <Input
                  id="rate_adult_half_day"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 150"
                  {...register("rate_adult_half_day", {
                    valueAsNumber: true,
                  })}
                />
                {errors.rate_adult_half_day && (
                  <p className="text-sm text-red-600">
                    {errors.rate_adult_half_day.message}
                  </p>
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
                  {...register("rate_youth_half_day", {
                    valueAsNumber: true,
                  })}
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
                  {...register("rate_child_half_day", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
