"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  propertySchema,
  type PropertyFormData,
  WATER_TYPES,
  COMMON_SPECIES,
  MIN_PHOTOS,
} from "@/lib/validations/properties";
import { Loader2, Save, Send, Lock, Info } from "lucide-react";
import PhotoUpload from "@/components/properties/PhotoUpload";

const WATER_TYPE_LABELS: Record<string, string> = {
  river: "River",
  stream: "Stream",
  lake: "Lake",
  pond: "Pond",
  spring_creek: "Spring Creek",
  tailwater: "Tailwater",
  reservoir: "Reservoir",
};

interface PropertyFormProps {
  initialData?: PropertyFormData & { id?: string; status?: string };
  mode: "create" | "edit";
}

export default function PropertyForm({ initialData, mode }: PropertyFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPropertyId, setSavedPropertyId] = useState<string | undefined>(
    initialData?.id
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      location_description: "",
      coordinates: "",
      water_type: "",
      species: [],
      water_miles: null,
      capacity: null,
      regulations: "",
      photos: [],
      rate_adult_full_day: null,
      rate_youth_full_day: null,
      rate_child_full_day: null,
      half_day_allowed: false,
      rate_adult_half_day: null,
      rate_youth_half_day: null,
      rate_child_half_day: null,
      access_notes: "",
      gate_code_required: false,
      gate_code: "",
    },
  });

  const species = watch("species");
  const waterType = watch("water_type");
  const halfDayAllowed = watch("half_day_allowed");
  const gateCodeRequired = watch("gate_code_required");
  const photos = watch("photos");

  async function saveProperty(data: PropertyFormData) {
    setSaving(true);
    setError(null);

    try {
      const url =
        mode === "create" && !savedPropertyId
          ? "/api/properties"
          : `/api/properties/${savedPropertyId ?? initialData?.id}`;
      const method = mode === "create" && !savedPropertyId ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to save property");
        return null;
      }

      // Store the ID for subsequent saves (create → edit flow)
      if (!savedPropertyId) {
        setSavedPropertyId(result.property.id);
      }

      return result.property;
    } catch {
      setError("An unexpected error occurred");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function onSaveDraft(data: PropertyFormData) {
    const property = await saveProperty(data);
    if (property) {
      router.push("/landowner/properties");
      router.refresh();
    }
  }

  async function onSubmitForReview(data: PropertyFormData) {
    // Validate minimum photos
    if ((data.photos?.length ?? 0) < MIN_PHOTOS) {
      setError(
        `At least ${MIN_PHOTOS} photos are required to submit for review.`
      );
      return;
    }

    // Validate required pricing
    if (
      data.rate_adult_full_day == null ||
      data.rate_youth_full_day == null ||
      data.rate_child_full_day == null
    ) {
      setError("Full-day rates for Adult, Youth, and Child are required to submit for review.");
      return;
    }

    // Validate capacity
    if (data.capacity == null) {
      setError("Capacity is required to submit for review.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const property = await saveProperty(data);
      if (!property) {
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_review" }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error ?? "Failed to submit for review");
        setSubmitting(false);
        return;
      }

      router.push("/landowner/properties");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setSubmitting(false);
    }
  }

  function toggleSpecies(s: string) {
    const current = species ?? [];
    if (current.includes(s)) {
      setValue("species", current.filter((x) => x !== s));
    } else {
      setValue("species", [...current, s]);
    }
  }

  const isDisabled = saving || submitting;
  const canSubmitForReview =
    mode === "create" || initialData?.status === "draft";

  return (
    <form className="mx-auto max-w-3xl space-y-8">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Fourmile Creek"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_description">Location Description</Label>
            <Textarea
              id="location_description"
              placeholder="e.g. The property is located 1.3 miles south of Fairplay and 2.1 miles west of the junction of Hwy. 285 and CR 18."
              rows={3}
              {...register("location_description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinates">GPS Coordinates</Label>
            <p className="text-xs text-text-light">
              Enter as decimal degrees: latitude, longitude (e.g. 39.2242, -105.9731)
            </p>
            <Input
              id="coordinates"
              placeholder="e.g. 39.2242, -105.9731"
              {...register("coordinates")}
            />
            {errors.coordinates && (
              <p className="text-sm text-red-600">
                {errors.coordinates.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description of Fishing Spot</Label>
            <Textarea
              id="description"
              placeholder="e.g. This section of Fourmile Creek contains two stream miles of a creek dotted with beaver ponds. It offers fast action for a large population of wild browns and an occasional rainbow."
              rows={5}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (Maximum Simultaneous Anglers)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 4"
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && (
              <p className="text-sm text-red-600">{errors.capacity.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUpload
            photos={photos ?? []}
            onChange={(newPhotos) => setValue("photos", newPhotos)}
            propertyId={savedPropertyId}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>

      {/* Water & Species */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Water & Species
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Water Type</Label>
            <Select
              value={waterType ?? ""}
              onValueChange={(val) =>
                setValue("water_type", val as (typeof WATER_TYPES)[number])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select water type" />
              </SelectTrigger>
              <SelectContent>
                {WATER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {WATER_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="water_miles">Miles of Fishable Water</Label>
            <Input
              id="water_miles"
              type="number"
              step="0.1"
              placeholder="e.g. 2.5"
              {...register("water_miles", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Species</Label>
            <p className="text-xs text-text-light">
              Select all species present on your property.
            </p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SPECIES.map((s) => {
                const selected = (species ?? []).includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecies(s)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selected
                        ? "border-forest bg-forest text-white"
                        : "border-stone-light/30 text-text-secondary hover:border-forest/50"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="regulations">Regulations & Rules</Label>
            <Textarea
              id="regulations"
              placeholder="e.g. Catch and release only, barbless hooks required, no wading in spawning areas."
              rows={4}
              {...register("regulations")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
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

      {/* Access Notes (Private) */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-charcoal/10">
              <Lock className="size-4 text-charcoal" />
            </div>
            <div>
              <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
                Access Information
              </CardTitle>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-text-light">
                <Info className="size-3" />
                This information is private. It is never displayed on your public
                listing. Access notes are sent only in the booking confirmation,
                and gate codes are sent via SMS on the day of the booking.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_notes">Access Notes</Label>
            <Textarea
              id="access_notes"
              placeholder="e.g. Turn left at the red barn on CR 18, drive 0.4 miles to the locked gate. Park in the gravel lot on the right. Walk-in access only beyond the gate."
              rows={4}
              {...register("access_notes")}
            />
          </div>

          <div className="border-t border-stone-light/20 pt-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="size-4 rounded border-stone-light/30 accent-forest"
                {...register("gate_code_required")}
              />
              <span className="text-sm font-medium text-text-primary">
                Gate code required for access
              </span>
            </label>
          </div>

          {gateCodeRequired && (
            <div className="space-y-2">
              <Label htmlFor="gate_code">Gate Code</Label>
              <p className="text-xs text-text-light">
                Sent to the angler via SMS on the day of their booking.
              </p>
              <Input
                id="gate_code"
                placeholder="e.g. 4582"
                {...register("gate_code")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-stone-light/20 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/landowner/properties")}
          disabled={isDisabled}
        >
          Cancel
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSubmit(onSaveDraft)}
            disabled={isDisabled}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Draft
          </Button>

          {canSubmitForReview && (
            <Button
              type="button"
              className="bg-forest text-white hover:bg-forest/90"
              onClick={handleSubmit(onSubmitForReview)}
              disabled={isDisabled}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Submit for Review
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
