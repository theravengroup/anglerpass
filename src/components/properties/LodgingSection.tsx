"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import type { LodgingFormData } from "@/lib/validations/lodging";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";

import LodgingBasicInfo from "./LodgingBasicInfo";
import LodgingAmenities from "./LodgingAmenities";
import LodgingPricing from "./LodgingPricing";
import LodgingExternalListing from "./LodgingExternalListing";

interface LodgingSectionProps {
  register: UseFormRegister<LodgingFormData>;
  errors: FieldErrors<LodgingFormData>;
  disabled: boolean;
  watch: UseFormWatch<LodgingFormData>;
  setValue: UseFormSetValue<LodgingFormData>;
}

export default function LodgingSection({
  register,
  errors,
  disabled,
  watch,
  setValue,
}: LodgingSectionProps) {
  const isActive = watch("is_active");
  const amenities = watch("amenities") ?? {};

  function toggleAmenity(key: string) {
    const current = amenities[key] ?? false;
    setValue("amenities", { ...amenities, [key]: !current }, { shouldDirty: true });
  }

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bronze/10">
            <Home className="size-4 text-bronze" />
          </div>
          <div>
            <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
              Lodging
            </CardTitle>
            <p className="mt-1 text-xs text-text-light">
              If your property offers on-site lodging, enable this to display
              details on your listing and link to your Airbnb/VRBO listing.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-t border-stone-light/20 pt-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-4 rounded border-stone-light/30 accent-forest"
              disabled={disabled}
              {...register("is_active")}
            />
            <span className="text-sm font-medium text-text-primary">
              This property has lodging available
            </span>
          </label>
        </div>

        {isActive && (
          <div className="space-y-6 pt-2">
            <LodgingBasicInfo
              register={register}
              errors={errors}
              disabled={disabled}
              watch={watch}
            />
            <LodgingAmenities
              amenities={amenities}
              onToggle={toggleAmenity}
              disabled={disabled}
            />
            <LodgingPricing
              register={register}
              errors={errors}
              disabled={disabled}
            />
            <LodgingExternalListing
              register={register}
              errors={errors}
              disabled={disabled}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
