"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  WATER_TYPES,
  COMMON_SPECIES,
  type PropertyFormData,
} from "@/lib/validations/properties";
import { WATER_TYPE_LABELS } from "@/lib/constants/water-types";
import type { UseFormSetValue } from "react-hook-form";
import type { PropertySectionProps } from "./property-form-types";

interface WaterSpeciesSectionProps extends PropertySectionProps {
  species: string[];
  waterType: string;
  setValue: UseFormSetValue<PropertyFormData>;
}

export default function WaterSpeciesSection({
  register,
  species,
  waterType,
  setValue,
}: WaterSpeciesSectionProps) {
  function toggleSpecies(s: string) {
    const current = species ?? [];
    if (current.includes(s)) {
      setValue("species", current.filter((x) => x !== s));
    } else {
      setValue("species", [...current, s]);
    }
  }

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          Water & Species
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Water Type</Label>
          <Select
            value={waterType ?? ""}
            onValueChange={(val) =>
              setValue("water_type", val as (typeof WATER_TYPES)[number])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select water type" />
            </SelectTrigger>
            <SelectContent>
              {WATER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {WATER_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="water_miles">Miles of Fishable Water</Label>
          <Input
            id="water_miles"
            type="number"
            step="0.1"
            placeholder="e.g. 2.5"
            {...register("water_miles", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label>Species</Label>
          <p className="text-xs text-text-light">
            Select all species present on your property.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SPECIES.map((s) => {
              const selected = (species ?? []).includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecies(s)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selected
                      ? "border-forest bg-forest text-white"
                      : "border-stone-light/30 text-text-secondary hover:border-forest/50"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="regulations">Regulations & Rules</Label>
          <Textarea
            id="regulations"
            placeholder="e.g. Catch and release only, barbless hooks required, no wading in spawning areas."
            rows={4}
            {...register("regulations")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
