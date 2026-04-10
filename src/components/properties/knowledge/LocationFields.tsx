import type { UseFormRegister } from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationFieldsProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
}

export default function LocationFields({ register }: LocationFieldsProps) {
  return (
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
  );
}
