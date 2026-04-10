"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";

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
  ABUNDANCE_OPTIONS,
  ABUNDANCE_LABELS,
  POPULATION_SOURCE_OPTIONS,
  POPULATION_SOURCE_LABELS,
} from "@/lib/constants/property-knowledge";

interface SpeciesPopulationFieldsProps {
  index: number;
  prefix: string;
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>["species_detail"];
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
}

export default function SpeciesPopulationFields({
  index,
  prefix,
  register,
  errors,
  watch,
  setValue,
}: SpeciesPopulationFieldsProps) {
  const entryErrors = errors?.[index];

  return (
    <>
      {/* Species Name */}
      <div className="space-y-1">
        <Label htmlFor={`${prefix}.species_name`}>
          Species Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`${prefix}.species_name`}
          placeholder="e.g. Rainbow Trout"
          {...register(`species_detail.${index}.species_name`)}
        />
        {entryErrors?.species_name && (
          <p className="text-xs text-red-500" role="alert" aria-live="polite">
            {entryErrors.species_name.message}
          </p>
        )}
        <p className="text-xs text-text-light">
          Used to match anglers searching for specific species.
        </p>
      </div>

      {/* Abundance */}
      <div className="space-y-1">
        <Label>Abundance</Label>
        <Select
          value={watch(`species_detail.${index}.abundance`) ?? ""}
          onValueChange={(val) =>
            setValue(`species_detail.${index}.abundance`, val, {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select abundance..." />
          </SelectTrigger>
          <SelectContent>
            {ABUNDANCE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {ABUNDANCE_LABELS[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-text-light">
          Helps set angler expectations for catch rates.
        </p>
      </div>

      {/* Size Range */}
      <div className="space-y-1">
        <Label>Average Size Range (inches)</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label
              htmlFor={`${prefix}.avg_size_min`}
              className="text-xs"
            >
              Min
            </Label>
            <Input
              id={`${prefix}.avg_size_min`}
              type="number"
              placeholder="e.g. 10"
              {...register(
                `species_detail.${index}.avg_size_min_inches`,
                { valueAsNumber: true },
              )}
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor={`${prefix}.avg_size_max`}
              className="text-xs"
            >
              Max
            </Label>
            <Input
              id={`${prefix}.avg_size_max`}
              type="number"
              placeholder="e.g. 16"
              {...register(
                `species_detail.${index}.avg_size_max_inches`,
                { valueAsNumber: true },
              )}
            />
          </div>
        </div>
        <p className="text-xs text-text-light">
          Lets AI communicate realistic size expectations.
        </p>
      </div>

      {/* Trophy Size */}
      <div className="space-y-1">
        <Label htmlFor={`${prefix}.trophy_size`}>
          Trophy Size (inches)
        </Label>
        <Input
          id={`${prefix}.trophy_size`}
          type="number"
          placeholder="e.g. 22"
          {...register(
            `species_detail.${index}.trophy_size_inches`,
            { valueAsNumber: true },
          )}
        />
        <p className="text-xs text-text-light">
          AI highlights trophy potential for anglers seeking big fish.
        </p>
      </div>

      {/* Population Source */}
      <div className="space-y-1">
        <Label>Population Source</Label>
        <Select
          value={
            watch(`species_detail.${index}.population_source`) ?? ""
          }
          onValueChange={(val) =>
            setValue(
              `species_detail.${index}.population_source`,
              val,
              { shouldDirty: true },
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select source..." />
          </SelectTrigger>
          <SelectContent>
            {POPULATION_SOURCE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {POPULATION_SOURCE_LABELS[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-text-light">
          Wild vs stocked affects angler interest and technique
          recommendations.
        </p>
      </div>

      {/* Stocking Schedule */}
      <div className="space-y-1">
        <Label htmlFor={`${prefix}.stocking_schedule`}>
          Stocking Schedule
        </Label>
        <Input
          id={`${prefix}.stocking_schedule`}
          placeholder="e.g. Monthly from April-October"
          {...register(
            `species_detail.${index}.stocking_schedule`,
          )}
        />
        <p className="text-xs text-text-light">
          Stocking info helps AI time trip recommendations.
        </p>
      </div>
    </>
  );
}
