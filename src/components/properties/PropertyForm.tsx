"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  propertySchema,
  type PropertyFormData,
} from "@/lib/validations/properties";
import { lodgingSchema, type LodgingFormData } from "@/lib/validations/lodging";
import PhotoUpload from "@/components/properties/PhotoUpload";
import ClubAssociation from "@/components/properties/ClubAssociation";
import PropertyDetailsSection from "@/components/properties/PropertyDetailsSection";
import WaterSpeciesSection from "@/components/properties/WaterSpeciesSection";
import PricingSection from "@/components/properties/PricingSection";
import AccessInfoSection from "@/components/properties/AccessInfoSection";
import LodgingSection from "@/components/properties/LodgingSection";
import PropertyFormActions from "@/components/properties/PropertyFormActions";
import { usePropertyFormActions } from "@/hooks/use-property-form-actions";

interface PropertyFormProps {
  initialData?: PropertyFormData & { id?: string; status?: string };
  mode: "create" | "edit";
  /** When set, the property is created on behalf of a landowner by this club */
  clubId?: string;
}

const LODGING_DEFAULTS: LodgingFormData = {
  is_active: false,
  lodging_name: "",
  lodging_type: "",
  lodging_type_other: "",
  lodging_description: "",
  sleeps: null,
  bedrooms: null,
  bathrooms: null,
  amenities: {},
  nightly_rate_min: null,
  nightly_rate_max: null,
  min_nights: 1,
  pet_policy: "not_allowed",
  checkin_time: "",
  checkout_time: "",
  external_listing_url: "",
};

export default function PropertyForm({ initialData, mode, clubId }: PropertyFormProps) {
  const router = useRouter();

  // Main property form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      location_description: "",
      coordinates: "",
      water_type: "",
      species: [],
      water_miles: null,
      max_rods: null,
      max_guests: null,
      max_bookings_per_member_per_month: null,
      advance_booking_days: null,
      regulations: "",
      photos: [],
      rate_adult_full_day: null,
      rate_youth_full_day: null,
      rate_child_full_day: null,
      half_day_allowed: false,
      rate_adult_half_day: null,
      rate_youth_half_day: null,
      rate_child_half_day: null,
      lodging_available: false,
      lodging_url: "",
      access_notes: "",
      gate_code_required: false,
      gate_code: "",
    },
  });

  // Separate lodging form (manages property_lodging table)
  const lodgingForm = useForm<LodgingFormData>({
    resolver: zodResolver(lodgingSchema),
    defaultValues: LODGING_DEFAULTS,
  });

  const {
    saving,
    submitting,
    error,
    savedPropertyId,
    isClubCreated,
    returnPath,
    ensureSaved,
    onSaveDraft,
    onSubmitForReview,
    checkClubAssociation,
  } = usePropertyFormActions({
    mode,
    clubId,
    initialData,
    lodgingForm,
    getCurrentName: () => watch("name"),
  });

  const species = watch("species");
  const waterType = watch("water_type");
  const halfDayAllowed = watch("half_day_allowed");
  const pricingMode = watch("pricing_mode");
  const classification = watch("classification");
  const gateCodeRequired = watch("gate_code_required");
  const photos = watch("photos");

  const isDisabled = saving || submitting;
  const canSubmitForReview =
    mode === "create" ||
    initialData?.status === "draft" ||
    initialData?.status === "changes_requested";

  return (
    <form className="mx-auto max-w-3xl space-y-8">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <PropertyDetailsSection
        register={register}
        errors={errors}
        disabled={isDisabled}
      />

      {/* Photos */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUpload
            photos={photos ?? []}
            onChange={(newPhotos) => setValue("photos", newPhotos)}
            propertyId={savedPropertyId}
            onEnsureSaved={ensureSaved}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>

      <WaterSpeciesSection
        register={register}
        errors={errors}
        disabled={isDisabled}
        species={species ?? []}
        waterType={waterType ?? ""}
        setValue={setValue}
      />

      <PricingSection
        register={register}
        errors={errors}
        disabled={isDisabled}
        halfDayAllowed={halfDayAllowed ?? false}
        pricingMode={pricingMode ?? "rod_fee_split"}
        classification={classification}
        setValue={setValue}
      />

      <AccessInfoSection
        register={register}
        errors={errors}
        disabled={isDisabled}
        gateCodeRequired={gateCodeRequired ?? false}
      />

      <LodgingSection
        register={lodgingForm.register}
        errors={lodgingForm.formState.errors}
        disabled={isDisabled}
        watch={lodgingForm.watch}
        setValue={lodgingForm.setValue}
      />

      {!isClubCreated && (
        <ClubAssociation
          propertyId={savedPropertyId ?? initialData?.id}
          onEnsureSaved={ensureSaved}
          onInvitationSent={checkClubAssociation}
        />
      )}

      <PropertyFormActions
        saving={saving}
        submitting={submitting}
        disabled={isDisabled}
        canSubmitForReview={isClubCreated ? false : canSubmitForReview}
        statusLabel={
          initialData?.status === "changes_requested"
            ? "Resubmit for Review"
            : "Submit for Review"
        }
        onCancel={() => router.push(returnPath)}
        onSaveDraft={handleSubmit(onSaveDraft)}
        onSubmitForReview={handleSubmit(onSubmitForReview)}
      />
    </form>
  );
}
