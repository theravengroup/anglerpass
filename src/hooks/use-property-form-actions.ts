"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "@/lib/validations/properties";
import { MIN_PHOTOS } from "@/lib/validations/properties";
import type { LodgingFormData } from "@/lib/validations/lodging";

interface UsePropertyFormActionsOptions {
  mode: "create" | "edit";
  clubId?: string;
  initialData?: PropertyFormData & { id?: string; status?: string };
  lodgingForm: UseFormReturn<LodgingFormData>;
  getCurrentName: () => string | undefined;
}

export function usePropertyFormActions({
  mode,
  clubId,
  initialData,
  lodgingForm,
  getCurrentName,
}: UsePropertyFormActionsOptions) {
  const isClubCreated = !!clubId;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPropertyId, setSavedPropertyId] = useState<string | undefined>(
    initialData?.id
  );
  const [hasClubInvitation, setHasClubInvitation] = useState(false);

  const apiBase = isClubCreated
    ? `/api/clubs/${clubId}/properties/create`
    : "/api/properties";

  const returnPath = isClubCreated ? "/club/properties" : "/landowner/properties";

  // Fetch lodging data on mount (edit mode)
  useEffect(() => {
    const pid = savedPropertyId ?? initialData?.id;
    if (!pid) return;

    async function fetchLodging() {
      try {
        const res = await fetch(`/api/properties/${pid}/lodging`);
        if (!res.ok) return;
        const { lodging } = await res.json();
        if (!lodging) return;

        lodgingForm.reset({
          is_active: lodging.is_active ?? false,
          lodging_name: lodging.lodging_name ?? "",
          lodging_type: lodging.lodging_type ?? "",
          lodging_type_other: lodging.lodging_type_other ?? "",
          lodging_description: lodging.lodging_description ?? "",
          sleeps: lodging.sleeps ?? null,
          bedrooms: lodging.bedrooms ?? null,
          bathrooms: lodging.bathrooms != null ? Number(lodging.bathrooms) : null,
          amenities: lodging.amenities ?? {},
          nightly_rate_min: lodging.nightly_rate_min ?? null,
          nightly_rate_max: lodging.nightly_rate_max ?? null,
          min_nights: lodging.min_nights ?? 1,
          pet_policy: lodging.pet_policy ?? "not_allowed",
          checkin_time: lodging.checkin_time ?? "",
          checkout_time: lodging.checkout_time ?? "",
          external_listing_url: lodging.external_listing_url ?? "",
        });
      } catch {
        // Non-critical
      }
    }

    fetchLodging();
  }, [savedPropertyId, initialData?.id]);

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

  // Auto-save draft when photos are added before first save
  async function ensureSaved(): Promise<string | null> {
    if (savedPropertyId) return savedPropertyId;

    const name = getCurrentName()?.trim();
    if (!name) return null;

    try {
      const res = await fetch(apiBase, {
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

  async function saveLodging(propertyId: string): Promise<boolean> {
    const lodgingData = lodgingForm.getValues();
    const isActive = lodgingData.is_active;
    const hasData = lodgingData.lodging_name || lodgingData.lodging_type || lodgingData.external_listing_url;
    if (!isActive && !hasData) return true;

    try {
      const res = await fetch(`/api/properties/${propertyId}/lodging`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lodgingData),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error ?? "Failed to save lodging");
        return false;
      }

      return true;
    } catch {
      setError("Failed to save lodging data");
      return false;
    }
  }

  async function saveProperty(data: PropertyFormData) {
    setSaving(true);
    setError(null);

    try {
      // Sync lodging_available from lodging form to property
      const lodgingActive = lodgingForm.getValues("is_active");
      const lodgingUrl = lodgingForm.getValues("external_listing_url");
      data.lodging_available = lodgingActive;
      data.lodging_url = lodgingUrl || "";

      const url =
        mode === "create" && !savedPropertyId
          ? apiBase
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

      const propertyId = result.property.id;
      if (!savedPropertyId) {
        setSavedPropertyId(propertyId);
      }

      // Save lodging data to separate table
      const lodgingOk = await saveLodging(propertyId);
      if (!lodgingOk) return null;

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
      router.push(returnPath);
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

    if (!isClubCreated && !hasClubInvitation) {
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

      router.push(returnPath);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setSubmitting(false);
    }
  }

  return {
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
  };
}
