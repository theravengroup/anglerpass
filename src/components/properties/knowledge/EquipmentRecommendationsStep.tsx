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
  ROD_WEIGHTS,
  WADER_TYPE_OPTIONS,
  WADER_TYPE_LABELS,
  BOOT_TYPE_OPTIONS,
  BOOT_TYPE_LABELS,
  ESSENTIAL_FLY_CATEGORIES,
  ESSENTIAL_FLY_CATEGORY_LABELS,
} from "@/lib/constants/property-knowledge";

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function EquipmentRecommendationsStep({
  register,
  watch,
  setValue,
}: KnowledgeStepProps) {
  const essentialFlyCategories =
    watch("equipment_recommendations.essential_fly_categories") ?? [];
  const netRecommended = watch("equipment_recommendations.net_recommended");
  const wadingStaffRecommended = watch(
    "equipment_recommendations.wading_staff_recommended"
  );
  const strikeIndicatorUseful = watch(
    "equipment_recommendations.strike_indicator_useful"
  );

  function toggleFlyCategory(category: string) {
    const current = essentialFlyCategories ?? [];
    const next = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setValue("equipment_recommendations.essential_fly_categories", next, {
      shouldDirty: true,
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Equipment recommendations help Compass AI tell anglers exactly what to
        pack for their trip.
      </p>

      {/* Rod Setup */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Rod Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Primary Rod Weight</Label>
              <Select
                value={
                  watch("equipment_recommendations.rod_weight_primary") ?? ""
                }
                onValueChange={(val) =>
                  setValue(
                    "equipment_recommendations.rod_weight_primary",
                    val,
                    { shouldDirty: true }
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  {ROD_WEIGHTS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}-weight
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Secondary Rod Weight</Label>
              <Select
                value={
                  watch("equipment_recommendations.rod_weight_secondary") ?? ""
                }
                onValueChange={(val) =>
                  setValue(
                    "equipment_recommendations.rod_weight_secondary",
                    val,
                    { shouldDirty: true }
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  {ROD_WEIGHTS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}-weight
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rod Length Range (ft)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min ft"
                {...register(
                  "equipment_recommendations.rod_length_ft_min",
                  { valueAsNumber: true }
                )}
              />
              <Input
                type="number"
                placeholder="Max ft"
                {...register(
                  "equipment_recommendations.rod_length_ft_max",
                  { valueAsNumber: true }
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wading Gear */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Wading Gear
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Wader Type</Label>
              <Select
                value={
                  watch("equipment_recommendations.wader_type") ?? ""
                }
                onValueChange={(val) =>
                  setValue("equipment_recommendations.wader_type", val, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select wader type" />
                </SelectTrigger>
                <SelectContent>
                  {WADER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {WADER_TYPE_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Boot Type</Label>
              <Select
                value={
                  watch("equipment_recommendations.boot_type") ?? ""
                }
                onValueChange={(val) =>
                  setValue("equipment_recommendations.boot_type", val, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select boot type" />
                </SelectTrigger>
                <SelectContent>
                  {BOOT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {BOOT_TYPE_LABELS[opt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fly Box Essentials */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Fly Box Essentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Essential Fly Categories</Label>
            <div className="flex flex-wrap gap-2">
              {ESSENTIAL_FLY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleFlyCategory(cat)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    essentialFlyCategories.includes(cat)
                      ? "border-forest bg-forest/10 text-forest"
                      : "border-stone-light/30 text-text-secondary hover:border-stone-light/50"
                  }`}
                >
                  {ESSENTIAL_FLY_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="equip_fly_size">Fly Size Range</Label>
              <Input
                id="equip_fly_size"
                placeholder="e.g. 12-22"
                {...register("equipment_recommendations.fly_size_range")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equip_tippet">Tippet Range</Label>
              <Input
                id="equip_tippet"
                placeholder="e.g. 4X-6X"
                {...register("equipment_recommendations.tippet_range")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equip_leader">Leader Length</Label>
              <Input
                id="equip_leader"
                placeholder="e.g. 9ft-12ft"
                {...register("equipment_recommendations.leader_length")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equip_specific_flies">
              Specific Fly Recommendations
            </Label>
            <Textarea
              id="equip_specific_flies"
              placeholder="e.g. Parachute Adams #16, Elk Hair Caddis #14, Pheasant Tail #18, Woolly Bugger #8"
              className="min-h-20"
              {...register(
                "equipment_recommendations.specific_fly_recommendations"
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Gear */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Additional Gear
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stone-light/30"
                checked={netRecommended ?? false}
                onChange={(e) =>
                  setValue(
                    "equipment_recommendations.net_recommended",
                    e.target.checked,
                    { shouldDirty: true }
                  )
                }
              />
              Net recommended
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stone-light/30"
                checked={wadingStaffRecommended ?? false}
                onChange={(e) =>
                  setValue(
                    "equipment_recommendations.wading_staff_recommended",
                    e.target.checked,
                    { shouldDirty: true }
                  )
                }
              />
              Wading staff recommended
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-stone-light/30"
                checked={strikeIndicatorUseful ?? false}
                onChange={(e) =>
                  setValue(
                    "equipment_recommendations.strike_indicator_useful",
                    e.target.checked,
                    { shouldDirty: true }
                  )
                }
              />
              Strike indicator useful
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equip_notes">Gear Notes</Label>
            <Textarea
              id="equip_notes"
              placeholder="Any additional gear tips or recommendations..."
              className="min-h-20"
              {...register("equipment_recommendations.gear_notes")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
