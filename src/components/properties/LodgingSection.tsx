"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import {
  LODGING_AMENITIES,
  LODGING_TYPE_LABELS,
  LODGING_TYPES,
  PET_POLICY_LABELS,
  PET_POLICIES,
  COMMON_CHECKIN_TIMES,
  COMMON_CHECKOUT_TIMES,
  type LodgingType,
  type PetPolicy,
} from "@/lib/constants/lodging";
import type { LodgingFormData } from "@/lib/validations/lodging";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";

interface LodgingSectionProps {
  register: UseFormRegister<LodgingFormData>;
  errors: FieldErrors<LodgingFormData>;
  disabled: boolean;
  watch: UseFormWatch<LodgingFormData>;
  setValue: UseFormSetValue<LodgingFormData>;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:${minutes} ${suffix}`;
}

export default function LodgingSection({
  register,
  errors,
  disabled,
  watch,
  setValue,
}: LodgingSectionProps) {
  const isActive = watch("is_active");
  const lodgingType = watch("lodging_type");
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
            {/* ── Basic Info ── */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-text-primary">
                Basic Info
              </p>

              <div className="space-y-2">
                <Label htmlFor="lodging_name">Lodging Name</Label>
                <Input
                  id="lodging_name"
                  placeholder="e.g. Riverside Cabin"
                  disabled={disabled}
                  {...register("lodging_name")}
                />
                {errors.lodging_name && (
                  <p className="text-sm text-red-600">
                    {errors.lodging_name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lodging_type">Type</Label>
                  <select
                    id="lodging_type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={disabled}
                    {...register("lodging_type")}
                  >
                    <option value="">Select type</option>
                    {LODGING_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {LODGING_TYPE_LABELS[type as LodgingType]}
                      </option>
                    ))}
                  </select>
                </div>

                {lodgingType === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="lodging_type_other">Describe</Label>
                    <Input
                      id="lodging_type_other"
                      placeholder="e.g. Yurt, Tree House"
                      disabled={disabled}
                      {...register("lodging_type_other")}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lodging_description">Description</Label>
                <textarea
                  id="lodging_description"
                  rows={4}
                  placeholder="Describe the lodging, what makes it special, what guests should know..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled}
                  {...register("lodging_description")}
                />
                {errors.lodging_description && (
                  <p className="text-sm text-red-600">
                    {errors.lodging_description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sleeps">Sleeps</Label>
                  <Input
                    id="sleeps"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="e.g. 6"
                    disabled={disabled}
                    {...register("sleeps", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    max="20"
                    placeholder="e.g. 3"
                    disabled={disabled}
                    {...register("bedrooms", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    placeholder="e.g. 1.5"
                    disabled={disabled}
                    {...register("bathrooms", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* ── Amenities ── */}
            <div className="space-y-4 border-t border-stone-light/20 pt-4">
              <p className="text-sm font-medium text-text-primary">
                Amenities
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
                {LODGING_AMENITIES.map((amenity) => (
                  <label
                    key={amenity.key}
                    className="flex cursor-pointer items-center gap-2.5"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-stone-light/30 accent-forest"
                      checked={amenities[amenity.key] ?? false}
                      onChange={() => toggleAmenity(amenity.key)}
                      disabled={disabled}
                    />
                    <span className="text-sm text-text-secondary">
                      {amenity.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Pricing & Policies ── */}
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* ── External Listing ── */}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
