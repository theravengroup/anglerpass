"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LODGING_TYPE_LABELS,
  LODGING_TYPES,
  type LodgingType,
} from "@/lib/constants/lodging";
import type { LodgingFormData } from "@/lib/validations/lodging";
import type { UseFormRegister, UseFormWatch, FieldErrors } from "react-hook-form";

const SELECT_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

interface LodgingBasicInfoProps {
  register: UseFormRegister<LodgingFormData>;
  errors: FieldErrors<LodgingFormData>;
  disabled: boolean;
  watch: UseFormWatch<LodgingFormData>;
}

export default function LodgingBasicInfo({
  register,
  errors,
  disabled,
  watch,
}: LodgingBasicInfoProps) {
  const lodgingType = watch("lodging_type");

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-text-primary">Basic Info</p>

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
            className={SELECT_CLASS}
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
  );
}
