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

import SpeciesPopulationFields from "./SpeciesPopulationFields";
import SpeciesBehaviorFields from "./SpeciesBehaviorFields";

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
              <SpeciesPopulationFields
                index={index}
                prefix={prefix}
                register={register}
                errors={errors.species_detail}
                watch={watch}
                setValue={setValue}
              />
              <SpeciesBehaviorFields
                index={index}
                prefix={prefix}
                register={register}
                watch={watch}
                setValue={setValue}
                toggleArrayItem={toggleArrayItem}
              />
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
