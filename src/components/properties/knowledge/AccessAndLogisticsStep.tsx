"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  Control,
} from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";
import LocationFields from "./LocationFields";
import ParkingAndVehicleFields from "./ParkingAndVehicleFields";
import AccessMethodFields from "./AccessMethodFields";

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
  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Access details help anglers plan their trip and set expectations for the
        drive and walk-in.
      </p>

      <LocationFields register={register} />

      <ParkingAndVehicleFields
        register={register}
        watch={watch}
        setValue={setValue}
      />

      <AccessMethodFields
        register={register}
        watch={watch}
        setValue={setValue}
      />
    </div>
  );
}
