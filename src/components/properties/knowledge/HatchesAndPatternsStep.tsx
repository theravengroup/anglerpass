"use client";

import { useFieldArray } from "react-hook-form";
import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  Control,
} from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";

import { Button } from "@/components/ui/button";
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
  INSECT_TYPES,
  INSECT_TYPE_LABELS,
  SPAWN_MONTHS,
  MONTH_LABELS,
  TIME_OF_DAY_OPTIONS,
  TIME_OF_DAY_LABELS,
  FLY_CATEGORIES,
  FLY_CATEGORY_LABELS,
} from "@/lib/constants/property-knowledge";

const INTENSITY_OPTIONS = [
  { value: "sporadic", label: "Sporadic" },
  { value: "moderate", label: "Moderate" },
  { value: "reliable", label: "Reliable" },
  { value: "blanket", label: "Blanket" },
] as const;

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function HatchesAndPatternsStep({
  register,
  errors,
  watch,
  setValue,
  control,
}: KnowledgeStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "hatches_and_patterns",
  });

  function toggleArrayItem(field: string, value: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dot-notation paths for nested JSONB fields
    const w = watch as (field: string) => unknown;
    const s = setValue as (field: string, value: unknown, options?: { shouldDirty?: boolean }) => void;
    const current = (w(field) ?? []) as string[];
    if (current.includes(value)) {
      s(field, current.filter((x) => x !== value), { shouldDirty: true });
    } else {
      s(field, [...current, value], { shouldDirty: true });
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Hatch data is gold for Compass AI — it lets us give anglers specific
        fly recommendations for their trip dates.
      </p>

      {fields.map((field, index) => {
        const prefix = `hatches_and_patterns.${index}` as const;
        const entryErrors = errors.hatches_and_patterns?.[index];

        return (
          <Card key={field.id} className="border-stone-light/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
                Hatch #{index + 1}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => remove(index)}
                aria-label={`Remove hatch #${index + 1}`}
              >
                Remove
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Insect Name */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.insect_name`}>
                  Insect Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`${prefix}.insect_name`}
                  placeholder="e.g. Blue Winged Olive"
                  {...register(`hatches_and_patterns.${index}.insect_name`)}
                />
                {entryErrors?.insect_name && (
                  <p className="text-xs text-red-500" role="alert" aria-live="polite">
                    {entryErrors.insect_name.message}
                  </p>
                )}
                <p className="text-xs text-text-light">
                  Common name helps anglers recognize the hatch.
                </p>
              </div>

              {/* Insect Type */}
              <div className="space-y-1">
                <Label>Insect Type</Label>
                <Select
                  value={
                    watch(`hatches_and_patterns.${index}.insect_type`) ?? ""
                  }
                  onValueChange={(val) =>
                    setValue(
                      `hatches_and_patterns.${index}.insect_type`,
                      val,
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INSECT_TYPES.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {INSECT_TYPE_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-light">
                  Type determines the category of fly patterns AI recommends.
                </p>
              </div>

              {/* Peak Months */}
              <div className="space-y-1">
                <Label>Peak Months</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {SPAWN_MONTHS.map((month) => {
                    const selected = (
                      (watch(
                        `hatches_and_patterns.${index}.peak_months`,
                      ) ?? []) as string[]
                    ).includes(month);
                    return (
                      <label
                        key={month}
                        className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArrayItem(
                              `hatches_and_patterns.${index}.peak_months`,
                              month,
                            )
                          }
                          className="accent-forest"
                        />
                        {MONTH_LABELS[month]}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-text-light">
                  Peak timing lets AI match hatch activity to trip dates.
                </p>
              </div>

              {/* Time of Day */}
              <div className="space-y-1">
                <Label>Time of Day</Label>
                <Select
                  value={
                    watch(`hatches_and_patterns.${index}.time_of_day`) ?? ""
                  }
                  onValueChange={(val) =>
                    setValue(
                      `hatches_and_patterns.${index}.time_of_day`,
                      val,
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OF_DAY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {TIME_OF_DAY_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-light">
                  AI uses this to plan fishing windows for anglers.
                </p>
              </div>

              {/* Matching Patterns */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.matching_patterns`}>
                  Matching Fly Patterns
                </Label>
                <Textarea
                  id={`${prefix}.matching_patterns`}
                  placeholder="e.g. Parachute Adams #16, RS2 #20, Sparkle Dun #18"
                  {...register(
                    `hatches_and_patterns.${index}.matching_patterns`,
                  )}
                />
                <p className="text-xs text-text-light">
                  Specific pattern names let AI build a trip-ready fly list.
                </p>
              </div>

              {/* Fly Categories */}
              <div className="space-y-1">
                <Label>Fly Categories</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FLY_CATEGORIES.map((cat) => {
                    const selected = (
                      (watch(
                        `hatches_and_patterns.${index}.fly_categories`,
                      ) ?? []) as string[]
                    ).includes(cat);
                    return (
                      <label
                        key={cat}
                        className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArrayItem(
                              `hatches_and_patterns.${index}.fly_categories`,
                              cat,
                            )
                          }
                          className="accent-forest"
                        />
                        {FLY_CATEGORY_LABELS[cat]}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-text-light">
                  Categories help AI organize recommendations by technique.
                </p>
              </div>

              {/* Hook Sizes */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.hook_sizes`}>Hook Sizes</Label>
                <Input
                  id={`${prefix}.hook_sizes`}
                  placeholder="e.g. 14-20"
                  {...register(
                    `hatches_and_patterns.${index}.hook_sizes`,
                  )}
                />
                <p className="text-xs text-text-light">
                  Size range helps AI recommend the right tippet and leader.
                </p>
              </div>

              {/* Intensity */}
              <div className="space-y-1">
                <Label>Intensity</Label>
                <Select
                  value={
                    watch(`hatches_and_patterns.${index}.intensity`) ?? ""
                  }
                  onValueChange={(val) =>
                    setValue(
                      `hatches_and_patterns.${index}.intensity`,
                      val,
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select intensity..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENSITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-light">
                  Intensity level sets expectations for how productive the
                  hatch is.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.notes`}>Notes</Label>
                <Textarea
                  id={`${prefix}.notes`}
                  placeholder="Any additional hatch details, tips, or local knowledge..."
                  {...register(`hatches_and_patterns.${index}.notes`)}
                />
                <p className="text-xs text-text-light">
                  Extra context for AI to provide richer trip advice.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed border-forest/40 text-forest hover:bg-forest/5"
        onClick={() =>
          append({
            insect_name: "",
            insect_type: null,
            peak_months: [],
            time_of_day: null,
            matching_patterns: null,
            fly_categories: [],
            hook_sizes: null,
            intensity: null,
            notes: null,
          })
        }
      >
        + Add Hatch
      </Button>
    </div>
  );
}
