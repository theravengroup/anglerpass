"use client";

import type {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  Control,
} from "react-hook-form";
import type { PropertyKnowledgeFormData } from "@/lib/validations/property-knowledge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CATCH_RELEASE_OPTIONS,
  CATCH_RELEASE_LABELS,
  HOOK_RULE_OPTIONS,
  HOOK_RULE_LABELS,
  METHOD_RESTRICTION_OPTIONS,
  METHOD_RESTRICTION_LABELS,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function RegulationsAndRulesStep({
  register,
  watch,
  setValue,
}: KnowledgeStepProps) {
  const catchRelease = watch("regulations_and_rules.catch_release");
  const stateLicenseRequired = watch(
    "regulations_and_rules.state_license_required"
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Regulations help Compass AI inform anglers about what to expect and how
        to fish responsibly on your property.
      </p>

      {/* Core Regulations */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Core Regulations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Catch and Release Policy</Label>
            <Select
              value={catchRelease ?? ""}
              onValueChange={(val) =>
                setValue("regulations_and_rules.catch_release", val, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                {CATCH_RELEASE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {CATCH_RELEASE_LABELS[opt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {catchRelease === "harvest_allowed" && (
            <div className="space-y-2 rounded-lg border border-stone-light/10 bg-parchment-light/30 p-4">
              <Label htmlFor="reg_creel_limit">
                Daily Creel Limit (fish per day)
              </Label>
              <Input
                id="reg_creel_limit"
                type="number"
                placeholder="e.g. 2"
                {...register("regulations_and_rules.creel_limit", {
                  valueAsNumber: true,
                })}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Hook Rules</Label>
              <Select
                value={watch("regulations_and_rules.hook_rules") ?? ""}
                onValueChange={(val) =>
                  setValue("regulations_and_rules.hook_rules", val, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hook rules" />
                </SelectTrigger>
                <SelectContent>
                  {HOOK_RULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {HOOK_RULE_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Method Restriction</Label>
              <Select
                value={
                  watch("regulations_and_rules.method_restriction") ?? ""
                }
                onValueChange={(val) =>
                  setValue("regulations_and_rules.method_restriction", val, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_RESTRICTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {METHOD_RESTRICTION_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closures & Handling */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Closures & Fish Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg_seasonal_closures">Seasonal Closures</Label>
            <Textarea
              id="reg_seasonal_closures"
              placeholder="e.g. Closed to fishing October 15 - November 30 for spawning"
              className="min-h-20"
              {...register("regulations_and_rules.seasonal_closures")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg_handling">Handling Requirements</Label>
            <Textarea
              id="reg_handling"
              placeholder="e.g. Wet hands before handling, use rubber net, keep fish in water for photos"
              className="min-h-20"
              {...register("regulations_and_rules.handling_requirements")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg_wading">Wading Restrictions</Label>
            <Input
              id="reg_wading"
              placeholder="e.g. No wading in spawning areas March-May"
              {...register("regulations_and_rules.wading_restrictions")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Club-Specific Rules */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Club-Specific Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional rules set by the managing club"
            className="min-h-24"
            {...register("regulations_and_rules.club_specific_rules")}
          />
        </CardContent>
      </Card>

      {/* State License */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            State Fishing License
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-stone-light/30"
              checked={stateLicenseRequired ?? false}
              onChange={(e) =>
                setValue(
                  "regulations_and_rules.state_license_required",
                  e.target.checked,
                  { shouldDirty: true }
                )
              }
            />
            State fishing license required
          </label>

          {stateLicenseRequired && (
            <div className="space-y-2">
              <Label htmlFor="reg_license_url">State License URL</Label>
              <Input
                id="reg_license_url"
                placeholder="https://..."
                {...register("regulations_and_rules.state_license_url")}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
