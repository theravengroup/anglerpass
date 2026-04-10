"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PET_POLICY_LABELS,
  PET_POLICIES,
  COMMON_CHECKIN_TIMES,
  COMMON_CHECKOUT_TIMES,
  type PetPolicy,
} from "@/lib/constants/lodging";
import type { LodgingFormData } from "@/lib/validations/lodging";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${minutes} ${suffix}`;
}

interface LodgingPricingProps {
  register: UseFormRegister<LodgingFormData>;
  errors: FieldErrors<LodgingFormData>;
  disabled: boolean;
}

export default function LodgingPricing({
  register,
  errors,
  disabled,
}: LodgingPricingProps) {
  return (
    <div className="space-y-4 border-t border-stone-light/20 pt-4">
      <p className="text-sm font-medium text-text-primary">
        Pricing &amp; Policies
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nightly_rate_min">Nightly Rate Min ($)</Label>
          <Input
            id="nightly_rate_min"
            type="number"
            min="1"
            placeholder="e.g. 150"
            disabled={disabled}
            {...register("nightly_rate_min", { valueAsNumber: true })}
          />
          {errors.nightly_rate_min && (
            <p className="text-sm text-red-600">
              {errors.nightly_rate_min.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nightly_rate_max">Nightly Rate Max ($)</Label>
          <Input
            id="nightly_rate_max"
            type="number"
            min="1"
            placeholder="e.g. 250"
            disabled={disabled}
            {...register("nightly_rate_max", { valueAsNumber: true })}
          />
          {errors.nightly_rate_max && (
            <p className="text-sm text-red-600">
              {errors.nightly_rate_max.message}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-text-light">
        If pricing is flat, set both to the same value. For seasonal
        ranges, set min and max.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_nights">Minimum Nights</Label>
          <Input
            id="min_nights"
            type="number"
            min="1"
            max="30"
            disabled={disabled}
            {...register("min_nights", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pet_policy">Pet Policy</Label>
          <select
            id="pet_policy"
            className={SELECT_CLASS}
            disabled={disabled}
            {...register("pet_policy")}
          >
            {PET_POLICIES.map((policy) => (
              <option key={policy} value={policy}>
                {PET_POLICY_LABELS[policy as PetPolicy]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="checkin_time">Check-in Time</Label>
          <select
            id="checkin_time"
            className={SELECT_CLASS}
            disabled={disabled}
            {...register("checkin_time")}
          >
            <option value="">Select time</option>
            {COMMON_CHECKIN_TIMES.map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout_time">Check-out Time</Label>
          <select
            id="checkout_time"
            className={SELECT_CLASS}
            disabled={disabled}
            {...register("checkout_time")}
          >
            <option value="">Select time</option>
            {COMMON_CHECKOUT_TIMES.map((time) => (
              <option key={time} value={time}>
                {formatTime(time)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
