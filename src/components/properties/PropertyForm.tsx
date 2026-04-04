"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  propertySchema,
  type PropertyFormData,
  MIN_PHOTOS,
} from "@/lib/validations/properties";
import PhotoUpload from "@/components/properties/PhotoUpload";
import ClubAssociation from "@/components/properties/ClubAssociation";
import PropertyDetailsSection from "@/components/properties/PropertyDetailsSection";
import WaterSpeciesSection from "@/components/properties/WaterSpeciesSection";
import PricingSection from "@/components/properties/PricingSection";
import AccessInfoSection from "@/components/properties/AccessInfoSection";
import LodgingSection from "@/components/properties/LodgingSection";
import PropertyFormActions from "@/components/properties/PropertyFormActions";

interface PropertyFormProps {
  initialData?: PropertyFormData & { id?: string; status?: string };
  mode: "create" | "edit";
}

export default function PropertyForm({ initialData, mode }: PropertyFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPropertyId, setSavedPropertyId] = useState<string | undefined>(
    initialData?.id
  );
  const [hasClubInvitation, setHasClubInvitation] = useState(false);

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

  // Check for existing club invitations/associations
  async function checkClubAssociation() {
    const pid = savedPropertyId ?? initialData?.id;
    if (!pid) return;
    try {
      const [invRes, assocRes] = await Promise.all([
        fetch(`/api/clubs/invite?property_id=${pid}`),
        fetch(`/api/properties/${pid}/clubs`),
      ]);

      let hasLink = false;

      if (invRes.ok) {
        const data = await invRes.json();
        if ((data.invitations ?? []).length > 0) hasLink = true;
      }

      if (assocRes.ok) {
        const data = await assocRes.json();
        if ((data.associations ?? []).length > 0) hasLink = true;
      }

      setHasClubInvitation(hasLink);
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    checkClubAssociation();
  }, [savedPropertyId, initialData?.id]);

  const species = watch("species");
  const waterType = watch("water_type");
  const halfDayAllowed = watch("half_day_allowed");
  const lodgingAvailable = watch("lodging_available");
  const gateCodeRequired = watch("gate_code_required");
  const photos = watch("photos");
  const currentName = watch("name");

  // Auto-save draft when photos are added before first save
  async function ensureSaved(): Promise<string | null> {
    if (savedPropertyId) return savedPropertyId;

    const name = currentName?.trim();
    if (!name) return null;

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const result = await res.json();
      if (!res.ok) return null;

      setSavedPropertyId(result.property.id);
      return result.property.id;
    } catch {
      return null;
    }
  }

  async function saveProperty(data: PropertyFormData) {
    setSaving(true);
    setError(null);

    try {
      const url =
        mode === "create" && !savedPropertyId
          ? "/api/properties"
          : `/api/properties/${savedPropertyId ?? initialData?.id}`;
      const method = mode === "create" && !savedPropertyId ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Failed to save property");
        return null;
      }

      if (!savedPropertyId) {
        setSavedPropertyId(result.property.id);
      }

      return result.property;
    } catch {
      setError("An unexpected error occurred");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function onSaveDraft(data: PropertyFormData) {
    const property = await saveProperty(data);
    if (property) {
      router.push("/landowner/properties");
      router.refresh();
    }
  }

  async function onSubmitForReview(data: PropertyFormData) {
    if ((data.photos?.length ?? 0) < MIN_PHOTOS) {
      setError(
        `At least ${MIN_PHOTOS} photos are required to submit for review.`
      );
      return;
    }

    if (
      data.rate_adult_full_day == null ||
      data.rate_youth_full_day == null ||
      data.rate_child_full_day == null
    ) {
      setError(
        "Full-day rates for Adult, Youth, and Child are required to submit for review."
      );
      return;
    }

    if (data.max_rods == null || data.max_guests == null) {
      setError(
        "Both Max Rods and Max Guests are required to submit for review."
      );
      return;
    }

    if (data.max_rods > data.max_guests) {
      setError(
        "Max Rods cannot exceed Max Guests (total people on property)."
      );
      return;
    }

    if (!hasClubInvitation) {
      setError(
        "At least one club must be invited or associated before submitting for review. Use the Club Association section below to invite your club."
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const property = await saveProperty(data);
      if (!property) {
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_review" }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error ?? "Failed to submit for review");
        setSubmitting(false);
        return;
      }

      router.push("/landowner/properties");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setSubmitting(false);
    }
  }

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
      />

      <AccessInfoSection
        register={register}
        errors={errors}
        disabled={isDisabled}
        gateCodeRequired={gateCodeRequired ?? false}
      />

      <LodgingSection
        register={register}
        errors={errors}
        disabled={isDisabled}
        lodgingAvailable={lodgingAvailable ?? false}
      />

      <ClubAssociation
        propertyId={savedPropertyId ?? initialData?.id}
        onEnsureSaved={ensureSaved}
        onInvitationSent={checkClubAssociation}
      />

      <PropertyFormActions
        saving={saving}
        submitting={submitting}
        disabled={isDisabled}
        canSubmitForReview={canSubmitForReview}
        statusLabel={
          initialData?.status === "changes_requested"
            ? "Resubmit for Review"
            : "Submit for Review"
        }
        onCancel={() => router.push("/landowner/properties")}
        onSaveDraft={handleSubmit(onSaveDraft)}
        onSubmitForReview={handleSubmit(onSubmitForReview)}
      />
    </form>
  );
}
