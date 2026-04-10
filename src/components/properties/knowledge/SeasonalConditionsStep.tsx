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

import { SEASONS } from "@/lib/constants/property-knowledge";

import MonthChecklistCard from "./MonthChecklistCard";
import SeasonProfileCard from "./SeasonProfileCard";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function SeasonalConditionsStep({
  register,
  errors,
  watch,
  setValue,
}: KnowledgeStepProps) {
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
        Seasonal data lets Compass AI recommend the best time to visit and set
        realistic expectations.
      </p>

      <MonthChecklistCard
        title="Best Months to Fish"
        hint="AI highlights these months as prime time for trip planning."
        selectedMonths={
          (watch("seasonal_conditions.best_months") ?? []) as string[]
        }
        onToggle={toggleArrayItem}
        fieldPath="seasonal_conditions.best_months"
      />

      <MonthChecklistCard
        title="Worst Months to Fish"
        hint="AI steers anglers away from these months or sets low expectations."
        selectedMonths={
          (watch("seasonal_conditions.worst_months") ?? []) as string[]
        }
        onToggle={toggleArrayItem}
        fieldPath="seasonal_conditions.worst_months"
      />

      {/* Runoff Timing */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Runoff Timing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="runoff_timing">Timing</Label>
            <Input
              id="runoff_timing"
              placeholder="e.g. Late May through mid-June"
              {...register("seasonal_conditions.runoff_timing")}
            />
            <p className="text-xs text-text-light">
              Runoff timing helps AI warn anglers about high water periods.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="runoff_notes">Runoff Notes</Label>
            <Textarea
              id="runoff_notes"
              placeholder="How does runoff affect fishing? Any tips for fishing during runoff?"
              {...register("seasonal_conditions.runoff_notes")}
            />
            <p className="text-xs text-text-light">
              Notes add context about whether fishing is still possible during
              runoff.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Per-Season Profiles */}
      {SEASONS.map((season) => (
        <SeasonProfileCard
          key={season}
          season={season}
          register={register}
          watch={watch}
          setValue={setValue}
          onToggleArray={toggleArrayItem}
        />
      ))}
    </div>
  );
}
