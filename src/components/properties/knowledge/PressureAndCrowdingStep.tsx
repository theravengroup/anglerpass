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
  PRESSURE_LEVEL_OPTIONS,
  PRESSURE_LEVEL_LABELS,
  SPAWN_MONTHS,
  MONTH_LABELS,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function PressureAndCrowdingStep({
  register,
  watch,
  setValue,
}: KnowledgeStepProps) {
  function toggleMonthArray(
    field: "pressure_and_crowding.busiest_months" | "pressure_and_crowding.quietest_months",
    value: string,
  ) {
    const current = (watch(field) ?? []) as string[];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    setValue(field, next, { shouldDirty: true });
  }

  type PressureField =
    | "pressure_and_crowding.overall_pressure"
    | "pressure_and_crowding.weekday_pressure"
    | "pressure_and_crowding.weekend_pressure"
    | "pressure_and_crowding.peak_season_pressure"
    | "pressure_and_crowding.off_season_pressure";

  const pressureFields: { field: PressureField; label: string }[] = [
    { field: "pressure_and_crowding.overall_pressure", label: "Overall Pressure" },
    { field: "pressure_and_crowding.weekday_pressure", label: "Weekday Pressure" },
    { field: "pressure_and_crowding.weekend_pressure", label: "Weekend Pressure" },
    { field: "pressure_and_crowding.peak_season_pressure", label: "Peak Season Pressure" },
    { field: "pressure_and_crowding.off_season_pressure", label: "Off-Season Pressure" },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Pressure data helps Compass AI recommend the best days and times to
        visit for a peaceful experience.
      </p>

      {/* Pressure Levels */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Fishing Pressure Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pressureFields.map(({ field, label }) => (
            <div key={field} className="space-y-2">
              <Label>{label}</Label>
              <Select
                value={(watch(field) as string) ?? ""}
                onValueChange={(val) =>
                  setValue(field, val, { shouldDirty: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Select ${label.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  {PRESSURE_LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {PRESSURE_LEVEL_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Busiest Months */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Busiest Months
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SPAWN_MONTHS.map((month) => {
              const selected = (
                (watch("pressure_and_crowding.busiest_months") ?? []) as string[]
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
                      toggleMonthArray(
                        "pressure_and_crowding.busiest_months",
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
        </CardContent>
      </Card>

      {/* Quietest Months */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Quietest Months
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SPAWN_MONTHS.map((month) => {
              const selected = (
                (watch("pressure_and_crowding.quietest_months") ?? []) as string[]
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
                      toggleMonthArray(
                        "pressure_and_crowding.quietest_months",
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
        </CardContent>
      </Card>

      {/* Crowd Type & Notes */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Additional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="crowd_type">Crowd Type</Label>
            <Input
              id="crowd_type"
              placeholder="e.g. Mostly fly fishers, occasional kayakers"
              {...register("pressure_and_crowding.crowd_type")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pressure_notes">Pressure Notes</Label>
            <Textarea
              id="pressure_notes"
              {...register("pressure_and_crowding.pressure_notes")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
