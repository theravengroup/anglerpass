"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";

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
  SPAWN_MONTHS,
  MONTH_LABELS,
  FEEDING_PATTERNS,
  FEEDING_PATTERN_LABELS,
  TECHNIQUE_OPTIONS,
  TECHNIQUE_LABELS,
} from "@/lib/constants/property-knowledge";

interface SpeciesBehaviorFieldsProps {
  index: number;
  prefix: string;
  register: UseFormRegister<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  toggleArrayItem: (field: string, value: string) => void;
}

export default function SpeciesBehaviorFields({
  index,
  prefix,
  register,
  watch,
  setValue,
  toggleArrayItem,
}: SpeciesBehaviorFieldsProps) {
  return (
    <>
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
    </>
  );
}
