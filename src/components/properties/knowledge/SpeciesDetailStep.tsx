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
  ABUNDANCE_OPTIONS,
  ABUNDANCE_LABELS,
  POPULATION_SOURCE_OPTIONS,
  POPULATION_SOURCE_LABELS,
  SPAWN_MONTHS,
  MONTH_LABELS,
  FEEDING_PATTERNS,
  FEEDING_PATTERN_LABELS,
  TECHNIQUE_OPTIONS,
  TECHNIQUE_LABELS,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function SpeciesDetailStep({
  register,
  errors,
  watch,
  setValue,
  control,
}: KnowledgeStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "species_detail",
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
        Detailed species info helps Compass AI recommend your property to
        anglers targeting specific fish.
      </p>

      {fields.map((field, index) => {
        const prefix = `species_detail.${index}` as const;
        const entryErrors = errors.species_detail?.[index];

        return (
          <Card key={field.id} className="border-stone-light/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
                Species #{index + 1}
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => remove(index)}
                aria-label={`Remove species #${index + 1}`}
              >
                Remove
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Species Name */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.species_name`}>
                  Species Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`${prefix}.species_name`}
                  placeholder="e.g. Rainbow Trout"
                  {...register(`species_detail.${index}.species_name`)}
                />
                {entryErrors?.species_name && (
                  <p className="text-xs text-red-500" role="alert" aria-live="polite">
                    {entryErrors.species_name.message}
                  </p>
                )}
                <p className="text-xs text-text-light">
                  Used to match anglers searching for specific species.
                </p>
              </div>

              {/* Abundance */}
              <div className="space-y-1">
                <Label>Abundance</Label>
                <Select
                  value={watch(`species_detail.${index}.abundance`) ?? ""}
                  onValueChange={(val) =>
                    setValue(`species_detail.${index}.abundance`, val, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select abundance..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ABUNDANCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {ABUNDANCE_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-light">
                  Helps set angler expectations for catch rates.
                </p>
              </div>

              {/* Size Range */}
              <div className="space-y-1">
                <Label>Average Size Range (inches)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor={`${prefix}.avg_size_min`}
                      className="text-xs"
                    >
                      Min
                    </Label>
                    <Input
                      id={`${prefix}.avg_size_min`}
                      type="number"
                      placeholder="e.g. 10"
                      {...register(
                        `species_detail.${index}.avg_size_min_inches`,
                        { valueAsNumber: true },
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor={`${prefix}.avg_size_max`}
                      className="text-xs"
                    >
                      Max
                    </Label>
                    <Input
                      id={`${prefix}.avg_size_max`}
                      type="number"
                      placeholder="e.g. 16"
                      {...register(
                        `species_detail.${index}.avg_size_max_inches`,
                        { valueAsNumber: true },
                      )}
                    />
                  </div>
                </div>
                <p className="text-xs text-text-light">
                  Lets AI communicate realistic size expectations.
                </p>
              </div>

              {/* Trophy Size */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.trophy_size`}>
                  Trophy Size (inches)
                </Label>
                <Input
                  id={`${prefix}.trophy_size`}
                  type="number"
                  placeholder="e.g. 22"
                  {...register(
                    `species_detail.${index}.trophy_size_inches`,
                    { valueAsNumber: true },
                  )}
                />
                <p className="text-xs text-text-light">
                  AI highlights trophy potential for anglers seeking big fish.
                </p>
              </div>

              {/* Population Source */}
              <div className="space-y-1">
                <Label>Population Source</Label>
                <Select
                  value={
                    watch(`species_detail.${index}.population_source`) ?? ""
                  }
                  onValueChange={(val) =>
                    setValue(
                      `species_detail.${index}.population_source`,
                      val,
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {POPULATION_SOURCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {POPULATION_SOURCE_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-light">
                  Wild vs stocked affects angler interest and technique
                  recommendations.
                </p>
              </div>

              {/* Stocking Schedule */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.stocking_schedule`}>
                  Stocking Schedule
                </Label>
                <Input
                  id={`${prefix}.stocking_schedule`}
                  placeholder="e.g. Monthly from April-October"
                  {...register(
                    `species_detail.${index}.stocking_schedule`,
                  )}
                />
                <p className="text-xs text-text-light">
                  Stocking info helps AI time trip recommendations.
                </p>
              </div>

              {/* Spawn Months */}
              <div className="space-y-1">
                <Label>Spawn Months</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {SPAWN_MONTHS.map((month) => {
                    const selected = (
                      (watch(
                        `species_detail.${index}.spawn_months`,
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
                              `species_detail.${index}.spawn_months`,
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
                  Spawn timing affects regulations and fish behavior AI
                  considers.
                </p>
              </div>

              {/* Feeding Patterns */}
              <div className="space-y-1">
                <Label>Feeding Patterns</Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEEDING_PATTERNS.map((pattern) => {
                    const selected = (
                      (watch(
                        `species_detail.${index}.feeding_patterns`,
                      ) ?? []) as string[]
                    ).includes(pattern);
                    return (
                      <label
                        key={pattern}
                        className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleArrayItem(
                              `species_detail.${index}.feeding_patterns`,
                              pattern,
                            )
                          }
                          className="accent-forest"
                        />
                        {FEEDING_PATTERN_LABELS[pattern]}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-text-light">
                  Feeding behavior drives technique and fly recommendations.
                </p>
              </div>

              {/* Best Technique */}
              <div className="space-y-1">
                <Label>Best Technique</Label>
                <Select
                  value={
                    watch(`species_detail.${index}.best_technique`) ?? ""
                  }
                  onValueChange={(val) =>
                    setValue(
                      `species_detail.${index}.best_technique`,
                      val,
                      { shouldDirty: true },
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select technique..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNIQUE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {TECHNIQUE_LABELS[opt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-light">
                  AI uses this for primary technique recommendations.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label htmlFor={`${prefix}.notes`}>Notes</Label>
                <Textarea
                  id={`${prefix}.notes`}
                  placeholder="Any additional details about this species on your property..."
                  {...register(`species_detail.${index}.notes`)}
                />
                <p className="text-xs text-text-light">
                  Free-form notes give AI extra context for personalized
                  recommendations.
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
            species_name: "",
            abundance: null,
            avg_size_min_inches: null,
            avg_size_max_inches: null,
            trophy_size_inches: null,
            population_source: null,
            stocking_schedule: null,
            spawn_months: [],
            feeding_patterns: [],
            best_technique: null,
            notes: null,
          })
        }
      >
        + Add Species
      </Button>
    </div>
  );
}
