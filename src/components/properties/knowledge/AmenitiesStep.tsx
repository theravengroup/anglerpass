"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  Control,
} from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  RESTROOM_TYPE_OPTIONS,
  RESTROOM_TYPE_LABELS,
  SITE_AMENITIES,
  NEARBY_SERVICES,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function AmenitiesStep({
  register,
  watch,
  setValue,
}: KnowledgeStepProps) {
  const siteAmenities = (watch("amenities.site_amenities") ?? {}) as Record<string, boolean>;
  const nearbyServices = (watch("amenities.nearby_services") ?? {}) as Record<string, boolean>;

  function toggleSiteAmenity(key: string) {
    setValue(
      "amenities.site_amenities",
      { ...siteAmenities, [key]: !siteAmenities[key] },
      { shouldDirty: true },
    );
  }

  function toggleNearbyService(key: string) {
    setValue(
      "amenities.nearby_services",
      { ...nearbyServices, [key]: !nearbyServices[key] },
      { shouldDirty: true },
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Amenity info helps anglers plan logistics and know what to bring vs.
        what&apos;s available on-site.
      </p>

      {/* Restroom Type */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Restroom Facilities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Select
            value={watch("amenities.restroom_type") ?? ""}
            onValueChange={(val) =>
              setValue("amenities.restroom_type", val, { shouldDirty: true })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select restroom type..." />
            </SelectTrigger>
            <SelectContent>
              {RESTROOM_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {RESTROOM_TYPE_LABELS[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Site Amenities */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Site Amenities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SITE_AMENITIES.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
              >
                <input
                  type="checkbox"
                  checked={siteAmenities[key] ?? false}
                  onChange={() => toggleSiteAmenity(key)}
                  className="accent-forest"
                />
                {label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nearby Services */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Nearby Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NEARBY_SERVICES.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
              >
                <input
                  type="checkbox"
                  checked={nearbyServices[key] ?? false}
                  onChange={() => toggleNearbyService(key)}
                  className="accent-forest"
                />
                {label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fly Shop & Grocery Distance */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Nearby Distances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nearest_fly_shop">Nearest Fly Shop</Label>
            <Input
              id="nearest_fly_shop"
              placeholder="e.g. Blue Quill Angler, Evergreen"
              {...register("amenities.nearest_fly_shop")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nearest_fly_shop_distance">
                Fly Shop Distance (miles)
              </Label>
              <Input
                id="nearest_fly_shop_distance"
                type="number"
                placeholder="e.g. 12"
                {...register("amenities.nearest_fly_shop_distance_miles", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nearest_grocery_distance">
                Grocery Distance (miles)
              </Label>
              <Input
                id="nearest_grocery_distance"
                type="number"
                placeholder="e.g. 8"
                {...register("amenities.nearest_grocery_distance_miles", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camping & Notes */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Additional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="camping_details">Camping Details</Label>
            <Textarea
              id="camping_details"
              placeholder="If camping is allowed, describe sites, amenities, and rules"
              {...register("amenities.camping_details")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="amenity_notes">Amenity Notes</Label>
            <Textarea
              id="amenity_notes"
              {...register("amenities.amenity_notes")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
