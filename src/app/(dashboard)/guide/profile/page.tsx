"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  guideProfileSchema,
  type GuideProfileFormData,
} from "@/lib/validations/guides";
import GuideProfileForm from "@/components/guide/GuideProfileForm";
import GuideCredentials from "@/components/guide/GuideCredentials";

export default function GuideProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const form = useForm<GuideProfileFormData>({
    resolver: zodResolver(guideProfileSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      techniques: [],
      species: [],
      skill_levels: [],
      max_anglers: 2,
      gear_included: true,
      gear_details: "",
      languages: ["English"],
      base_location: "",
      service_region: "",
      closest_airports: "",
      rate_full_day: undefined,
      rate_half_day: undefined,
      rate_description: "",
      lead_time_days: 1,
      license_state: "",
      insurance_amount: "",
      has_motorized_vessel: false,
    },
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/guides/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        const p = data.profile;
        form.reset({
          display_name: p.display_name ?? "",
          bio: p.bio ?? "",
          techniques: p.techniques ?? [],
          species: p.species ?? [],
          skill_levels: p.skill_levels ?? [],
          max_anglers: p.max_anglers ?? 2,
          gear_included: p.gear_included ?? true,
          gear_details: p.gear_details ?? "",
          languages: p.languages ?? ["English"],
          base_location: p.base_location ?? "",
          service_region: p.service_region ?? "",
          closest_airports: p.closest_airports ?? "",
          rate_full_day: p.rate_full_day ? Number(p.rate_full_day) : undefined,
          rate_half_day: p.rate_half_day ? Number(p.rate_half_day) : undefined,
          rate_description: p.rate_description ?? "",
          lead_time_days: p.lead_time_days ?? 1,
          license_state: p.license_state ?? "",
          insurance_amount: p.insurance_amount ?? "",
          has_motorized_vessel: p.has_motorized_vessel ?? false,
        });
      }
    } catch {
      // Not found = new profile
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    load();
  }, [load]);

  const onSave = async (data: GuideProfileFormData) => {
    setSaving(true);
    setMessage(null);
    try {
      const method = profile ? "PATCH" : "POST";
      const res = await fetch("/api/guides/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setProfile(result.profile);
        setMessage({ type: "success", text: "Profile saved successfully!" });
      } else {
        const err = await res.json().catch(() => null);
        setMessage({ type: "error", text: err?.error ?? "Failed to save profile" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/guides/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending_review" }),
      });

      if (res.ok) {
        const result = await res.json();
        setProfile(result.profile);
        setMessage({ type: "success", text: "Profile submitted for review!" });
      } else {
        const err = await res.json().catch(() => null);
        setMessage({ type: "error", text: err?.error ?? "Failed to submit for review" });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCredentialUpload = async (type: string, file: File) => {
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/guides/credentials", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await load();
        setMessage({ type: "success", text: `${type} uploaded successfully!` });
      } else {
        const err = await res.json().catch(() => null);
        setMessage({ type: "error", text: err?.error ?? "Upload failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  const profileStatus: string = (profile as Record<string, unknown>)?.status as string ?? "draft";
  const isEditable = profileStatus === "draft" || profileStatus === "rejected";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Guide Profile
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {profile
            ? "Update your guide profile information."
            : "Set up your guide profile to start guiding on AnglerPass."}
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-forest/20 bg-forest/5 text-forest"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          {message.text}
        </div>
      )}

      {profileStatus === "rejected" && !!(profile as Record<string, unknown>)?.rejection_reason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="size-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-600">Profile Rejected</p>
              <p className="text-sm text-red-500">
                {(profile as Record<string, unknown>).rejection_reason as string}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <GuideProfileForm form={form} isEditable={isEditable} />

        <GuideCredentials
          form={form}
          profile={profile}
          isEditable={isEditable}
          uploading={uploading}
          onCredentialUpload={handleCredentialUpload}
        />

        {/* Actions */}
        <div className="flex gap-3">
          {isEditable && (
            <>
              <Button type="submit" disabled={saving} className="bg-charcoal text-white hover:bg-charcoal/90">
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                {profile ? "Save Changes" : "Create Profile"}
              </Button>

              {profile && (profileStatus as string) !== "pending_review" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmitForReview}
                  disabled={submitting}
                  className="border-forest/30 text-forest hover:bg-forest/5"
                >
                  {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Submit for Review
                </Button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
}
