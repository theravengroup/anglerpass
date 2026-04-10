"use client";

import type { UseFormRegister } from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SEASONS, SEASON_LABELS } from "@/lib/constants/property-knowledge";

interface TemperatureProfilesProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
}

export default function TemperatureProfiles({
  register,
}: TemperatureProfilesProps) {
  return (
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
  );
}
