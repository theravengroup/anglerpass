"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LodgingFormData } from "@/lib/validations/lodging";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

interface LodgingExternalListingProps {
  register: UseFormRegister<LodgingFormData>;
  errors: FieldErrors<LodgingFormData>;
  disabled: boolean;
}

export default function LodgingExternalListing({
  register,
  errors,
  disabled,
}: LodgingExternalListingProps) {
  return (
    <div className="space-y-4 border-t border-stone-light/20 pt-4">
      <p className="text-sm font-medium text-text-primary">
        External Listing
      </p>
      <div className="space-y-2">
        <Label htmlFor="external_listing_url">
          Airbnb or VRBO Listing URL
        </Label>
        <Input
          id="external_listing_url"
          type="url"
          placeholder="https://www.airbnb.com/rooms/..."
          disabled={disabled}
          {...register("external_listing_url")}
        />
        {errors.external_listing_url && (
          <p className="text-sm text-red-600">
            {errors.external_listing_url.message}
          </p>
        )}
        <p className="text-xs text-text-light">
          Paste the link to your existing listing. Anglers will be
          directed here to book lodging.
        </p>
      </div>
    </div>
  );
}
