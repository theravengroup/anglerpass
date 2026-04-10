"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
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
  ACCESS_METHOD_OPTIONS,
  ACCESS_METHOD_LABELS,
  BOAT_LAUNCH_OPTIONS,
  BOAT_LAUNCH_LABELS,
  BOAT_TYPES_ALLOWED,
  BOAT_TYPE_LABELS,
  FLOAT_DIFFICULTY_OPTIONS,
  FLOAT_DIFFICULTY_LABELS,
} from "@/lib/constants/property-knowledge";

interface AccessMethodFieldsProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
}

export default function AccessMethodFields({
  register,
  watch,
  setValue,
}: AccessMethodFieldsProps) {
  const accessMethod = watch("access_and_logistics.access_method");
  const shuttleAvailable = watch("access_and_logistics.shuttle_available");
  const boatTypesAllowed = watch("access_and_logistics.boat_types_allowed") ?? [];
  const showFloatFields = accessMethod === "float" || accessMethod === "both";

  function toggleBoatType(type: string) {
    const current = boatTypesAllowed ?? [];
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    setValue("access_and_logistics.boat_types_allowed", next, {
      shouldDirty: true,
    });
  }

  return (
    <>
      {/* Access Method */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Access Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Access Method</Label>
            <Select
              value={accessMethod ?? ""}
              onValueChange={(val) =>
                setValue("access_and_logistics.access_method", val, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select access method" />
              </SelectTrigger>
              <SelectContent>
                {ACCESS_METHOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {ACCESS_METHOD_LABELS[opt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showFloatFields && (
            <div className="space-y-4 rounded-lg border border-stone-light/10 bg-parchment-light/30 p-4">
              <p className="text-sm font-medium text-text-primary">
                Float / Boat Details
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Boat Launch Type</Label>
                  <Select
                    value={
                      watch("access_and_logistics.boat_launch_type") ?? ""
                    }
                    onValueChange={(val) =>
                      setValue(
                        "access_and_logistics.boat_launch_type",
                        val,
                        { shouldDirty: true }
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select launch type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOAT_LAUNCH_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {BOAT_LAUNCH_LABELS[opt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Float Difficulty</Label>
                  <Select
                    value={
                      watch("access_and_logistics.float_difficulty") ?? ""
                    }
                    onValueChange={(val) =>
                      setValue(
                        "access_and_logistics.float_difficulty",
                        val,
                        { shouldDirty: true }
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLOAT_DIFFICULTY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {FLOAT_DIFFICULTY_LABELS[opt]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Boat Types Allowed</Label>
                <div className="flex flex-wrap gap-2">
                  {BOAT_TYPES_ALLOWED.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleBoatType(type)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        boatTypesAllowed.includes(type)
                          ? "border-forest bg-forest/10 text-forest"
                          : "border-stone-light/30 text-text-secondary hover:border-stone-light/50"
                      }`}
                    >
                      {BOAT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_float_dist">
                  Float Distance (miles)
                </Label>
                <Input
                  id="access_float_dist"
                  type="number"
                  placeholder="Miles"
                  {...register(
                    "access_and_logistics.float_distance_miles",
                    { valueAsNumber: true }
                  )}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-stone-light/30"
                  checked={shuttleAvailable ?? false}
                  onChange={(e) =>
                    setValue(
                      "access_and_logistics.shuttle_available",
                      e.target.checked,
                      { shouldDirty: true }
                    )
                  }
                />
                Shuttle service available
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Road Conditions & Directions */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Road Conditions & Directions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_road_conditions">
              Road Conditions Notes
            </Label>
            <Textarea
              id="access_road_conditions"
              placeholder="e.g. Road impassable during spring mud season"
              className="min-h-20"
              {...register("access_and_logistics.road_conditions_notes")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access_directions">Directions Notes</Label>
            <Textarea
              id="access_directions"
              placeholder="General directions to the property"
              className="min-h-20"
              {...register("access_and_logistics.directions_notes")}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
