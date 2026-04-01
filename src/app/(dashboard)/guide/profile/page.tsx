"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  guideProfileSchema,
  type GuideProfileFormData,
  TECHNIQUE_LABELS,
  SKILL_LEVEL_LABELS,
  TECHNIQUES,
  SKILL_LEVELS,
} from "@/lib/validations/guides";

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
        // Populate form
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
        // Reload profile to get updated URLs
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
        {/* Basic Info */}
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Your public-facing guide profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                {...form.register("display_name")}
                placeholder="e.g. John Smith Fly Fishing"
                disabled={!isEditable}
              />
              {form.formState.errors.display_name && (
                <p className="text-xs text-red-500">{form.formState.errors.display_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                {...form.register("bio")}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tell anglers about yourself, your experience, and what makes your trips special..."
                disabled={!isEditable}
              />
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="text-base">Services</CardTitle>
            <CardDescription>What you offer as a guide</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Techniques</Label>
              <div className="flex flex-wrap gap-2">
                {TECHNIQUES.map((t) => {
                  const selected = form.watch("techniques")?.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const current = form.getValues("techniques") ?? [];
                        form.setValue(
                          "techniques",
                          selected ? current.filter((x) => x !== t) : [...current, t]
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-charcoal text-white"
                          : "bg-offwhite text-text-secondary hover:bg-charcoal/10"
                      }`}
                      disabled={!isEditable}
                    >
                      {TECHNIQUE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skill Levels</Label>
              <div className="flex flex-wrap gap-2">
                {SKILL_LEVELS.map((s) => {
                  const selected = form.watch("skill_levels")?.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const current = form.getValues("skill_levels") ?? [];
                        form.setValue(
                          "skill_levels",
                          selected ? current.filter((x) => x !== s) : [...current, s]
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "bg-charcoal text-white"
                          : "bg-offwhite text-text-secondary hover:bg-charcoal/10"
                      }`}
                      disabled={!isEditable}
                    >
                      {SKILL_LEVEL_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max_anglers">Max Anglers per Trip</Label>
                <Input
                  id="max_anglers"
                  type="number"
                  {...form.register("max_anglers", { valueAsNumber: true })}
                  min={1}
                  max={20}
                  disabled={!isEditable}
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="gear_included"
                  {...form.register("gear_included")}
                  className="size-4 rounded border-stone-light"
                  disabled={!isEditable}
                />
                <Label htmlFor="gear_included">Gear Included</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="base_location">Base Location</Label>
                <Input
                  id="base_location"
                  {...form.register("base_location")}
                  placeholder="e.g. Bozeman, MT"
                  disabled={!isEditable}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_region">Service Region</Label>
                <Input
                  id="service_region"
                  {...form.register("service_region")}
                  placeholder="e.g. Southwest Montana"
                  disabled={!isEditable}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
            <CardDescription>
              Set your rates. AnglerPass adds a 10% service fee on top, paid by the angler. You keep 100% of your listed rate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rate_full_day">Full Day Rate ($)</Label>
                <Input
                  id="rate_full_day"
                  type="number"
                  step="0.01"
                  {...form.register("rate_full_day", { valueAsNumber: true })}
                  placeholder="e.g. 600"
                  disabled={!isEditable}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate_half_day">Half Day Rate ($)</Label>
                <Input
                  id="rate_half_day"
                  type="number"
                  step="0.01"
                  {...form.register("rate_half_day", { valueAsNumber: true })}
                  placeholder="e.g. 400"
                  disabled={!isEditable}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate_description">Rate Description (optional)</Label>
              <Input
                id="rate_description"
                {...form.register("rate_description")}
                placeholder="e.g. Includes lunch. Drift boat trips start at $700."
                disabled={!isEditable}
              />
            </div>
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="text-base">Credentials</CardTitle>
            <CardDescription>
              Upload your certifications for admin review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { type: "license", label: "Guide/Outfitter License", urlKey: "license_url" },
              { type: "insurance", label: "Liability Insurance", urlKey: "insurance_url" },
              { type: "first_aid", label: "First Aid / CPR", urlKey: "first_aid_cert_url" },
            ].map((cred) => (
              <div key={cred.type} className="flex items-center justify-between rounded-lg border border-stone-light/20 p-3">
                <div className="flex items-center gap-3">
                  <FileText className="size-5 text-text-light" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{cred.label}</p>
                    {(profile as Record<string, unknown>)?.[cred.urlKey] ? (
                      <p className="text-xs text-forest">Uploaded</p>
                    ) : (
                      <p className="text-xs text-text-light">Not uploaded</p>
                    )}
                  </div>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCredentialUpload(cred.type, file);
                    }}
                    disabled={uploading === cred.type || !isEditable}
                  />
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-light/30 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-offwhite">
                    {uploading === cred.type ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Upload className="size-3" />
                    )}
                    {(profile as Record<string, unknown>)?.[cred.urlKey] ? "Replace" : "Upload"}
                  </span>
                </label>
              </div>
            ))}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="license_state">License State</Label>
                <Input
                  id="license_state"
                  {...form.register("license_state")}
                  placeholder="e.g. Montana"
                  disabled={!isEditable}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance_amount">Insurance Coverage</Label>
                <Input
                  id="insurance_amount"
                  {...form.register("insurance_amount")}
                  placeholder="e.g. $1M/$2M"
                  disabled={!isEditable}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="has_motorized_vessel"
                {...form.register("has_motorized_vessel")}
                className="size-4 rounded border-stone-light"
                disabled={!isEditable}
              />
              <Label htmlFor="has_motorized_vessel">
                I operate a motorized vessel (USCG license required)
              </Label>
            </div>
          </CardContent>
        </Card>

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
