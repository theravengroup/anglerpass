import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
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
  PARKING_SURFACE_OPTIONS,
  PARKING_SURFACE_LABELS,
  VEHICLE_CLEARANCE_OPTIONS,
  VEHICLE_CLEARANCE_LABELS,
  CELL_COVERAGE_OPTIONS,
  CELL_COVERAGE_LABELS,
} from "@/lib/constants/property-knowledge";

interface ParkingAndVehicleFieldsProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
}

export default function ParkingAndVehicleFields({
  register,
  watch,
  setValue,
}: ParkingAndVehicleFieldsProps) {
  return (
    <>
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
    </>
  );
}
