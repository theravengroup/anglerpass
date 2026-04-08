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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CLARITY_OPTIONS,
  CLARITY_LABELS,
  WADEABILITY_OPTIONS,
  WADEABILITY_LABELS,
  DEPTH_ZONES,
  DEPTH_ZONE_LABELS,
  STRUCTURAL_FEATURES,
  STRUCTURAL_FEATURE_LABELS,
  BOTTOM_COMPOSITIONS,
  BOTTOM_COMPOSITION_LABELS,
  SEASONS,
  SEASON_LABELS,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function WaterCharacteristicsStep({
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
        Water characteristics help Compass AI match anglers to the right
        conditions for their skill level and preferences.
      </p>

      {/* Clarity */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Water Clarity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            Helps AI recommend sight-fishing suitability and fly selection.
          </p>
          <Select
            value={watch("water_characteristics.clarity") ?? ""}
            onValueChange={(val) =>
              setValue("water_characteristics.clarity", val, { shouldDirty: true })
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
        </CardContent>
      </Card>

      {/* Wadeability */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Wadeability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            Helps AI set wading expectations and recommend skill-appropriate
            waters.
          </p>
          <Select
            value={watch("water_characteristics.wadeability") ?? ""}
            onValueChange={(val) =>
              setValue("water_characteristics.wadeability", val, {
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select wadeability..." />
            </SelectTrigger>
            <SelectContent>
              {WADEABILITY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {WADEABILITY_LABELS[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Depth Zones */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Depth Zones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            Lets AI recommend appropriate gear and techniques for available
            water depths.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEPTH_ZONES.map((zone) => {
              const selected = (
                (watch("water_characteristics.depth_zones") ?? []) as string[]
              ).includes(zone);
              return (
                <label
                  key={zone}
                  className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleArrayItem(
                        "water_characteristics.depth_zones",
                        zone,
                      )
                    }
                    className="accent-forest"
                  />
                  {DEPTH_ZONE_LABELS[zone]}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Structural Features */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Structural Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            Structural diversity is key for species variety and technique
            matching.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STRUCTURAL_FEATURES.map((feat) => {
              const selected = (
                (watch("water_characteristics.structural_features") ??
                  []) as string[]
              ).includes(feat);
              return (
                <label
                  key={feat}
                  className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleArrayItem(
                        "water_characteristics.structural_features",
                        feat,
                      )
                    }
                    className="accent-forest"
                  />
                  {STRUCTURAL_FEATURE_LABELS[feat]}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Composition */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Bottom Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            Bottom type affects wading safety and insect habitat for hatch
            predictions.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BOTTOM_COMPOSITIONS.map((comp) => {
              const selected = (
                (watch("water_characteristics.bottom_composition") ??
                  []) as string[]
              ).includes(comp);
              return (
                <label
                  key={comp}
                  className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleArrayItem(
                        "water_characteristics.bottom_composition",
                        comp,
                      )
                    }
                    className="accent-forest"
                  />
                  {BOTTOM_COMPOSITION_LABELS[comp]}
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stream Width Range */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Stream Width Range (feet)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-text-light">
            Width helps AI recommend casting techniques and rod lengths.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="stream_width_min">Min Width (ft)</Label>
              <Input
                id="stream_width_min"
                type="number"
                placeholder="e.g. 15"
                {...register("water_characteristics.stream_width_ft_min", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stream_width_max">Max Width (ft)</Label>
              <Input
                id="stream_width_max"
                type="number"
                placeholder="e.g. 60"
                {...register("water_characteristics.stream_width_ft_max", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Temperature Profiles */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Temperature Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-text-light">
            Seasonal temps let AI predict fish activity and recommend optimal
            visit windows.
          </p>
          {SEASONS.map((season) => (
            <div key={season} className="space-y-2">
              <h4 className="text-sm font-semibold text-text-primary">
                {SEASON_LABELS[season]}
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label
                    htmlFor={`temp_${season}_min`}
                    className="text-xs"
                  >
                    Min ({"\u00B0"}F)
                  </Label>
                  <Input
                    id={`temp_${season}_min`}
                    type="number"
                    placeholder="e.g. 38"
                    {...register(
                      `water_characteristics.temp_${season}.min_f` as `water_characteristics.temp_spring.min_f`,
                      { valueAsNumber: true },
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={`temp_${season}_max`}
                    className="text-xs"
                  >
                    Max ({"\u00B0"}F)
                  </Label>
                  <Input
                    id={`temp_${season}_max`}
                    type="number"
                    placeholder="e.g. 55"
                    {...register(
                      `water_characteristics.temp_${season}.max_f` as `water_characteristics.temp_spring.max_f`,
                      { valueAsNumber: true },
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={`temp_${season}_optimal`}
                    className="text-xs"
                  >
                    Optimal ({"\u00B0"}F)
                  </Label>
                  <Input
                    id={`temp_${season}_optimal`}
                    type="number"
                    placeholder="e.g. 48"
                    {...register(
                      `water_characteristics.temp_${season}.optimal_f` as `water_characteristics.temp_spring.optimal_f`,
                      { valueAsNumber: true },
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
