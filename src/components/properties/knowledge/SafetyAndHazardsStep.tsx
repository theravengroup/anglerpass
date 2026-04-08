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
  WILDLIFE_HAZARDS,
  WILDLIFE_HAZARD_LABELS,
  WATER_HAZARDS,
  WATER_HAZARD_LABELS,
  TERRAIN_DIFFICULTY_OPTIONS,
  TERRAIN_DIFFICULTY_LABELS,
  REMOTE_RATING_OPTIONS,
  REMOTE_RATING_LABELS,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function SafetyAndHazardsStep({
  register,
  watch,
  setValue,
}: KnowledgeStepProps) {
  function toggleArrayItem(
    field: "safety_and_hazards.wildlife_hazards" | "safety_and_hazards.water_hazards",
    value: string,
  ) {
    const current = (watch(field) ?? []) as string[];
    const next = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    setValue(field, next, { shouldDirty: true });
  }

  const cellForEmergency = watch("safety_and_hazards.cell_for_emergency") as boolean | null | undefined;
  const bearSprayRecommended = watch("safety_and_hazards.bear_spray_recommended") as boolean | null | undefined;
  const wadingStaffForSafety = watch("safety_and_hazards.wading_staff_for_safety") as boolean | null | undefined;

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Safety info helps Compass AI warn anglers about conditions and ensure
        they&apos;re prepared.
      </p>

      {/* Wildlife Hazards */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Wildlife Hazards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {WILDLIFE_HAZARDS.map((hazard) => {
              const selected = (
                (watch("safety_and_hazards.wildlife_hazards") ?? []) as string[]
              ).includes(hazard);
              return (
                <label
                  key={hazard}
                  className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleArrayItem("safety_and_hazards.wildlife_hazards", hazard)
                    }
                    className="accent-forest"
                  />
                  {WILDLIFE_HAZARD_LABELS[hazard]}
                </label>
              );
            })}
          </div>
          <div className="space-y-1">
            <Label htmlFor="wildlife_notes">Wildlife Notes</Label>
            <Textarea
              id="wildlife_notes"
              placeholder="e.g. Black bears active May-October, store food in vehicles"
              {...register("safety_and_hazards.wildlife_notes")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Water Hazards */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Water Hazards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {WATER_HAZARDS.map((hazard) => {
              const selected = (
                (watch("safety_and_hazards.water_hazards") ?? []) as string[]
              ).includes(hazard);
              return (
                <label
                  key={hazard}
                  className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      toggleArrayItem("safety_and_hazards.water_hazards", hazard)
                    }
                    className="accent-forest"
                  />
                  {WATER_HAZARD_LABELS[hazard]}
                </label>
              );
            })}
          </div>
          <div className="space-y-1">
            <Label htmlFor="water_hazard_notes">Water Hazard Notes</Label>
            <Textarea
              id="water_hazard_notes"
              {...register("safety_and_hazards.water_hazard_notes")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Terrain & Remoteness */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Terrain & Remoteness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Terrain Difficulty</Label>
            <Select
              value={watch("safety_and_hazards.terrain_difficulty") ?? ""}
              onValueChange={(val) =>
                setValue("safety_and_hazards.terrain_difficulty", val, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select terrain difficulty..." />
              </SelectTrigger>
              <SelectContent>
                {TERRAIN_DIFFICULTY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {TERRAIN_DIFFICULTY_LABELS[opt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="terrain_notes">Terrain Notes</Label>
            <Textarea
              id="terrain_notes"
              {...register("safety_and_hazards.terrain_notes")}
            />
          </div>
          <div className="space-y-2">
            <Label>Remoteness Rating</Label>
            <Select
              value={watch("safety_and_hazards.remote_rating") ?? ""}
              onValueChange={(val) =>
                setValue("safety_and_hazards.remote_rating", val, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select remoteness..." />
              </SelectTrigger>
              <SelectContent>
                {REMOTE_RATING_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {REMOTE_RATING_LABELS[opt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Info */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Emergency Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nearest_hospital">Nearest Hospital</Label>
            <Input
              id="nearest_hospital"
              placeholder="e.g. Valley View Hospital, Glenwood Springs"
              {...register("safety_and_hazards.nearest_hospital")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nearest_hospital_distance">
                Distance (miles)
              </Label>
              <Input
                id="nearest_hospital_distance"
                type="number"
                placeholder="e.g. 25"
                {...register(
                  "safety_and_hazards.nearest_hospital_distance_miles",
                  { valueAsNumber: true },
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="emergency_response_minutes">
                Emergency Response (min)
              </Label>
              <Input
                id="emergency_response_minutes"
                type="number"
                placeholder="e.g. 45"
                {...register(
                  "safety_and_hazards.emergency_response_minutes",
                  { valueAsNumber: true },
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety Recommendations */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Safety Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30">
            <input
              type="checkbox"
              checked={cellForEmergency ?? false}
              onChange={() =>
                setValue(
                  "safety_and_hazards.cell_for_emergency",
                  !cellForEmergency,
                  { shouldDirty: true },
                )
              }
              className="accent-forest"
            />
            Cell coverage sufficient for emergency calls
          </label>
          <label className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30">
            <input
              type="checkbox"
              checked={bearSprayRecommended ?? false}
              onChange={() =>
                setValue(
                  "safety_and_hazards.bear_spray_recommended",
                  !bearSprayRecommended,
                  { shouldDirty: true },
                )
              }
              className="accent-forest"
            />
            Bear spray recommended
          </label>
          <label className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30">
            <input
              type="checkbox"
              checked={wadingStaffForSafety ?? false}
              onChange={() =>
                setValue(
                  "safety_and_hazards.wading_staff_for_safety",
                  !wadingStaffForSafety,
                  { shouldDirty: true },
                )
              }
              className="accent-forest"
            />
            Wading staff recommended for safety
          </label>
          <div className="space-y-1">
            <Label htmlFor="safety_notes">General Safety Notes</Label>
            <Textarea
              id="safety_notes"
              placeholder="General safety tips for visitors"
              {...register("safety_and_hazards.safety_notes")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
