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
  SPAWN_MONTHS,
  MONTH_LABELS,
  SEASONS,
  SEASON_LABELS,
  CLARITY_OPTIONS,
  CLARITY_LABELS,
  FISH_ACTIVITY_OPTIONS,
  FISH_ACTIVITY_LABELS,
  TECHNIQUE_OPTIONS,
  TECHNIQUE_LABELS,
  WADEABILITY_OPTIONS,
  WADEABILITY_LABELS,
} from "@/lib/constants/property-knowledge";

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

      {/* Best Months */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Best Months to Fish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            AI highlights these months as prime time for trip planning.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SPAWN_MONTHS.map((month) => {
              const selected = (
                (watch("seasonal_conditions.best_months") ?? []) as string[]
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
                        "seasonal_conditions.best_months",
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

      {/* Worst Months */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Worst Months to Fish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            AI steers anglers away from these months or sets low expectations.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {SPAWN_MONTHS.map((month) => {
              const selected = (
                (watch("seasonal_conditions.worst_months") ?? []) as string[]
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
                        "seasonal_conditions.worst_months",
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
        <Card key={season} className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
              {SEASON_LABELS[season]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Water Temp Range */}
            <div className="space-y-1">
              <Label htmlFor={`seasonal_${season}_temp`}>
                Water Temperature Range
              </Label>
              <Input
                id={`seasonal_${season}_temp`}
                placeholder="e.g. 45-55\u00B0F"
                {...register(
                  `seasonal_conditions.${season}.water_temp_range` as `seasonal_conditions.spring.water_temp_range`,
                )}
              />
              <p className="text-xs text-text-light">
                Temperature drives fish activity predictions.
              </p>
            </div>

            {/* Clarity */}
            <div className="space-y-1">
              <Label>Clarity</Label>
              <Select
                value={
                  watch(
                    `seasonal_conditions.${season}.clarity` as `seasonal_conditions.spring.clarity`,
                  ) ?? ""
                }
                onValueChange={(val) =>
                  setValue(
                    `seasonal_conditions.${season}.clarity` as `seasonal_conditions.spring.clarity`,
                    val,
                    { shouldDirty: true },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select clarity..." />
                </SelectTrigger>
                <SelectContent>
                  {CLARITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {CLARITY_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-light">
                Seasonal clarity affects fly selection and technique.
              </p>
            </div>

            {/* Flow Description */}
            <div className="space-y-1">
              <Label htmlFor={`seasonal_${season}_flow`}>
                Flow Description
              </Label>
              <Input
                id={`seasonal_${season}_flow`}
                placeholder="e.g. High and stained from runoff"
                {...register(
                  `seasonal_conditions.${season}.flow_description` as `seasonal_conditions.spring.flow_description`,
                )}
              />
              <p className="text-xs text-text-light">
                Flow context helps set wading and fishing expectations.
              </p>
            </div>

            {/* Fish Activity */}
            <div className="space-y-1">
              <Label>Fish Activity</Label>
              <Select
                value={
                  watch(
                    `seasonal_conditions.${season}.fish_activity` as `seasonal_conditions.spring.fish_activity`,
                  ) ?? ""
                }
                onValueChange={(val) =>
                  setValue(
                    `seasonal_conditions.${season}.fish_activity` as `seasonal_conditions.spring.fish_activity`,
                    val,
                    { shouldDirty: true },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select activity level..." />
                </SelectTrigger>
                <SelectContent>
                  {FISH_ACTIVITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {FISH_ACTIVITY_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-light">
                Activity level drives catch-rate expectations for the season.
              </p>
            </div>

            {/* Best Techniques */}
            <div className="space-y-1">
              <Label>Best Techniques</Label>
              <div className="grid grid-cols-2 gap-2">
                {TECHNIQUE_OPTIONS.map((tech) => {
                  const selected = (
                    (watch(
                      `seasonal_conditions.${season}.best_techniques` as `seasonal_conditions.spring.best_techniques`,
                    ) ?? []) as string[]
                  ).includes(tech);
                  return (
                    <label
                      key={tech}
                      className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleArrayItem(
                            `seasonal_conditions.${season}.best_techniques`,
                            tech,
                          )
                        }
                        className="accent-forest"
                      />
                      {TECHNIQUE_LABELS[tech]}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-text-light">
                Season-specific techniques help AI tailor method
                recommendations.
              </p>
            </div>

            {/* Wading Difficulty */}
            <div className="space-y-1">
              <Label>Wading Difficulty</Label>
              <Select
                value={
                  watch(
                    `seasonal_conditions.${season}.wading_difficulty` as `seasonal_conditions.spring.wading_difficulty`,
                  ) ?? ""
                }
                onValueChange={(val) =>
                  setValue(
                    `seasonal_conditions.${season}.wading_difficulty` as `seasonal_conditions.spring.wading_difficulty`,
                    val,
                    { shouldDirty: true },
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select difficulty..." />
                </SelectTrigger>
                <SelectContent>
                  {WADEABILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {WADEABILITY_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-text-light">
                Seasonal wading difficulty helps set safety expectations.
              </p>
            </div>

            {/* Accessibility Notes */}
            <div className="space-y-1">
              <Label htmlFor={`seasonal_${season}_access`}>
                Accessibility Notes
              </Label>
              <Input
                id={`seasonal_${season}_access`}
                placeholder="e.g. Road may be muddy in spring, 4WD recommended"
                {...register(
                  `seasonal_conditions.${season}.accessibility_notes` as `seasonal_conditions.spring.accessibility_notes`,
                )}
              />
              <p className="text-xs text-text-light">
                Seasonal access notes help AI warn about road or trail
                conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
