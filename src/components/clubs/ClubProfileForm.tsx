"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { clubSchema, type ClubFormData } from "@/lib/validations/clubs";

interface ClubProfileFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ClubFormData> & { id?: string };
  invitationToken?: string | null;
  onSuccess?: (club: { id: string; name: string }) => void;
}

export default function ClubProfileForm({
  mode,
  initialData,
  invitationToken,
  onSuccess,
}: ClubProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      location: initialData?.location ?? "",
      rules: initialData?.rules ?? "",
      website: initialData?.website ?? "",
    },
  });

  async function onSubmit(data: ClubFormData) {
    setError(null);
    setSaving(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/clubs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            invitation_token: invitationToken ?? undefined,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Failed to create club");
          return;
        }

        setClubId(json.club.id);
        onSuccess?.(json.club);
      } else {
        // Edit mode — PATCH
        const id = clubId ?? initialData?.id;
        if (!id) {
          setError("Club not found");
          return;
        }
        const res = await fetch(`/api/clubs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Failed to update club");
          return;
        }

        onSuccess?.(json.club);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Club Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Club Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Club Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. South Platte Anglers Club"
              {...register("name")}
              disabled={saving}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell members about your club — its mission, history, and what makes it special"
              {...register("description")}
              disabled={saving}
            />
            {errors.description && (
              <p className="text-xs text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Location / Region</Label>
              <Input
                id="location"
                placeholder="e.g. South Platte River Valley, CO"
                {...register("location")}
                disabled={saving}
              />
              {errors.location && (
                <p className="text-xs text-red-600">
                  {errors.location.message}
                </p>
              )}
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourclub.com"
                {...register("website")}
                disabled={saving}
              />
              {errors.website && (
                <p className="text-xs text-red-600">
                  {errors.website.message}
                </p>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label htmlFor="rules">Club Rules & Code of Conduct</Label>
            <textarea
              id="rules"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Catch and release only, barbless hooks, respect private property..."
              {...register("rules")}
              disabled={saving}
            />
            {errors.rules && (
              <p className="text-xs text-red-600">{errors.rules.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={saving}
          className="bg-river text-white hover:bg-river/90"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {mode === "create" ? "Create Club" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
