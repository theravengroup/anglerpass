"use client";

import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type GuideProfileFormData,
  TECHNIQUE_LABELS,
  SKILL_LEVEL_LABELS,
  TECHNIQUES,
  SKILL_LEVELS,
} from "@/lib/validations/guides";

interface GuideProfileFormProps {
  form: UseFormReturn<GuideProfileFormData>;
  isEditable: boolean;
}

export default function GuideProfileForm({ form, isEditable }: GuideProfileFormProps) {
  return (
    <>
      {/* Basic Info */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Your public-facing independent guide profile</CardDescription>
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
          <CardDescription>What you offer as an independent guide</CardDescription>
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
    </>
  );
}
