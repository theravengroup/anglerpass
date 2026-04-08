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
  PARKING_SURFACE_OPTIONS,
  PARKING_SURFACE_LABELS,
  VEHICLE_CLEARANCE_OPTIONS,
  VEHICLE_CLEARANCE_LABELS,
  ACCESS_METHOD_OPTIONS,
  ACCESS_METHOD_LABELS,
  BOAT_LAUNCH_OPTIONS,
  BOAT_LAUNCH_LABELS,
  BOAT_TYPES_ALLOWED,
  BOAT_TYPE_LABELS,
  FLOAT_DIFFICULTY_OPTIONS,
  FLOAT_DIFFICULTY_LABELS,
  CELL_COVERAGE_OPTIONS,
  CELL_COVERAGE_LABELS,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function AccessAndLogisticsStep({
  register,
  watch,
  setValue,
}: KnowledgeStepProps) {
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
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Access details help anglers plan their trip and set expectations for the
        drive and walk-in.
      </p>

      {/* Location */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_elevation">Elevation (ft)</Label>
            <Input
              id="access_elevation"
              type="number"
              placeholder="e.g. 7500"
              {...register("access_and_logistics.elevation_ft", {
                valueAsNumber: true,
              })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="access_nearest_town">Nearest Town</Label>
              <Input
                id="access_nearest_town"
                placeholder="e.g. Vail, CO"
                {...register("access_and_logistics.nearest_town")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_town_dist">Distance (miles)</Label>
              <Input
                id="access_town_dist"
                type="number"
                placeholder="Miles"
                {...register(
                  "access_and_logistics.nearest_town_distance_miles",
                  { valueAsNumber: true }
                )}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="access_nearest_airport">Nearest Airport</Label>
              <Input
                id="access_nearest_airport"
                placeholder="e.g. Eagle County Regional (EGE)"
                {...register("access_and_logistics.nearest_airport")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_airport_dist">Distance (miles)</Label>
              <Input
                id="access_airport_dist"
                type="number"
                placeholder="Miles"
                {...register(
                  "access_and_logistics.nearest_airport_distance_miles",
                  { valueAsNumber: true }
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parking & Vehicle */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Parking & Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access_parking_spaces">Parking Spaces</Label>
            <Input
              id="access_parking_spaces"
              type="number"
              placeholder="Number of vehicles"
              {...register("access_and_logistics.parking_spaces", {
                valueAsNumber: true,
              })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Parking Surface</Label>
              <Select
                value={watch("access_and_logistics.parking_surface") ?? ""}
                onValueChange={(val) =>
                  setValue("access_and_logistics.parking_surface", val, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select surface type" />
                </SelectTrigger>
                <SelectContent>
                  {PARKING_SURFACE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {PARKING_SURFACE_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Clearance</Label>
              <Select
                value={watch("access_and_logistics.vehicle_clearance") ?? ""}
                onValueChange={(val) =>
                  setValue("access_and_logistics.vehicle_clearance", val, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select clearance" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_CLEARANCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {VEHICLE_CLEARANCE_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Walk to Water */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Walk to Water
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="access_walk_dist">
                Walk Distance to Water (ft)
              </Label>
              <Input
                id="access_walk_dist"
                type="number"
                placeholder="Feet"
                {...register(
                  "access_and_logistics.walk_distance_to_water_ft",
                  { valueAsNumber: true }
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_walk_time">Walk Time (minutes)</Label>
              <Input
                id="access_walk_time"
                type="number"
                placeholder="Minutes"
                {...register("access_and_logistics.walk_time_minutes", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cell Coverage */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Cell Coverage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cell Coverage</Label>
              <Select
                value={watch("access_and_logistics.cell_coverage") ?? ""}
                onValueChange={(val) =>
                  setValue("access_and_logistics.cell_coverage", val, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coverage level" />
                </SelectTrigger>
                <SelectContent>
                  {CELL_COVERAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {CELL_COVERAGE_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_carriers">Best Cell Carriers</Label>
              <Input
                id="access_carriers"
                placeholder="e.g. Verizon, AT&T"
                {...register("access_and_logistics.best_cell_carriers")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
