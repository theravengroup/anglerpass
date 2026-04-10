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
} from "@/lib/constants/property-knowledge";

import CheckboxGroupCard from "./CheckboxGroupCard";
import TemperatureProfiles from "./TemperatureProfiles";

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

      <CheckboxGroupCard
        title="Depth Zones"
        hint="Lets AI recommend appropriate gear and techniques for available water depths."
        items={DEPTH_ZONES}
        labels={DEPTH_ZONE_LABELS}
        selectedItems={
          (watch("water_characteristics.depth_zones") ?? []) as string[]
        }
        onToggle={toggleArrayItem}
        fieldPath="water_characteristics.depth_zones"
      />

      <CheckboxGroupCard
        title="Structural Features"
        hint="Structural diversity is key for species variety and technique matching."
        items={STRUCTURAL_FEATURES}
        labels={STRUCTURAL_FEATURE_LABELS}
        selectedItems={
          (watch("water_characteristics.structural_features") ?? []) as string[]
        }
        onToggle={toggleArrayItem}
        fieldPath="water_characteristics.structural_features"
        columns="grid-cols-2 sm:grid-cols-3"
      />

      <CheckboxGroupCard
        title="Bottom Composition"
        hint="Bottom type affects wading safety and insect habitat for hatch predictions."
        items={BOTTOM_COMPOSITIONS}
        labels={BOTTOM_COMPOSITION_LABELS}
        selectedItems={
          (watch("water_characteristics.bottom_composition") ?? []) as string[]
        }
        onToggle={toggleArrayItem}
        fieldPath="water_characteristics.bottom_composition"
        columns="grid-cols-2 sm:grid-cols-4"
      />

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

      <TemperatureProfiles register={register} />
    </div>
  );
}
