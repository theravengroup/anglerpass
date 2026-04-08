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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  RATING_OPTIONS,
  RATING_LABELS,
  BEST_FOR_OPTIONS,
  BEST_FOR_LABELS,
} from "@/lib/constants/property-knowledge";
import { cn } from "@/lib/utils";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

function RatingSelector({
  label,
  field,
  ratingKey,
  watch,
  setValue,
}: {
  label: string;
  field: string;
  ratingKey: string;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
}) {
  const value = watch(field as
    | "experience_profile.solitude_rating"
    | "experience_profile.scenery_rating"
    | "experience_profile.photography_rating"
    | "experience_profile.beginner_friendly_rating"
  ) as number | null | undefined;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {RATING_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() =>
              setValue(field as
                | "experience_profile.solitude_rating"
                | "experience_profile.scenery_rating"
                | "experience_profile.photography_rating"
                | "experience_profile.beginner_friendly_rating",
                r, { shouldDirty: true },
              )
            }
            className={cn(
              "rounded-lg border px-3 py-2 text-sm transition-colors",
              value === r
                ? "border-forest bg-forest text-white"
                : "border-stone-light/30 text-text-secondary hover:border-forest/50",
            )}
          >
            <span className="block font-medium">{r}</span>
            <span className="block text-xs">
              {RATING_LABELS[ratingKey]?.[r]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ExperienceProfileStep({
  register,
  watch,
  setValue,
}: KnowledgeStepProps) {
  function toggleBestFor(value: string) {
    const current = (watch("experience_profile.best_for") ?? []) as string[];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    setValue("experience_profile.best_for", next, { shouldDirty: true });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Experience data is the soul of your property profile — it&apos;s what
        makes an angler choose you over another listing.
      </p>

      {/* Ratings */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Experience Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RatingSelector
            label="Solitude"
            field="experience_profile.solitude_rating"
            ratingKey="solitude"
            watch={watch}
            setValue={setValue}
          />
          <RatingSelector
            label="Scenery"
            field="experience_profile.scenery_rating"
            ratingKey="scenery"
            watch={watch}
            setValue={setValue}
          />
          <RatingSelector
            label="Photography"
            field="experience_profile.photography_rating"
            ratingKey="photography"
            watch={watch}
            setValue={setValue}
          />
          <RatingSelector
            label="Beginner Friendly"
            field="experience_profile.beginner_friendly_rating"
            ratingKey="beginner_friendly"
            watch={watch}
            setValue={setValue}
          />
        </CardContent>
      </Card>

      {/* Best For */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Best For
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BEST_FOR_OPTIONS.map((option) => {
              const selected = (
                (watch("experience_profile.best_for") ?? []) as string[]
              ).includes(option);
              return (
                <label
                  key={option}
                  className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleBestFor(option)}
                    className="accent-forest"
                  />
                  {BEST_FOR_LABELS[option]}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Story & Highlights */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Story & Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="property_story">
              What makes this place special?
            </Label>
            <Textarea
              id="property_story"
              rows={4}
              placeholder="Tell us the story of this property — what would you say to a friend about why they should fish here?"
              {...register("experience_profile.property_story")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="unique_features">Unique Features</Label>
            <Textarea
              id="unique_features"
              placeholder="e.g. Mile of spring creek with rising browns all summer, mountain backdrop"
              {...register("experience_profile.unique_features")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="scenic_highlights">Scenic Highlights</Label>
            <Textarea
              id="scenic_highlights"
              placeholder="e.g. Mountain views, canyon walls, meadow sections, wildlife viewing"
              {...register("experience_profile.scenic_highlights")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="best_photography_spots">
              Best Photography Spots
            </Label>
            <Textarea
              id="best_photography_spots"
              placeholder="e.g. The bend at mile marker 2 at sunset, the canyon overlook"
              {...register("experience_profile.best_photography_spots")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="experience_notes">Experience Notes</Label>
            <Textarea
              id="experience_notes"
              {...register("experience_profile.experience_notes")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
