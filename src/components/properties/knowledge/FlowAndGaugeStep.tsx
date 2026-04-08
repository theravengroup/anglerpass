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

interface KnowledgeStepProps {
  register: UseFormRegister<PropertyKnowledgeFormData>;
  errors: FieldErrors<PropertyKnowledgeFormData>;
  watch: UseFormWatch<PropertyKnowledgeFormData>;
  setValue: UseFormSetValue<PropertyKnowledgeFormData>;
  control: Control<PropertyKnowledgeFormData>;
}

export default function FlowAndGaugeStep({
  register,
  errors,
}: KnowledgeStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Flow data lets Compass AI check real-time USGS conditions and advise
        anglers whether it&apos;s a good day to fish.
      </p>

      {/* USGS Gauge Info */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            USGS Gauge Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flow_gauge_id">USGS Gauge ID</Label>
              <Input
                id="flow_gauge_id"
                placeholder="e.g. 09058000"
                {...register("flow_and_gauge.usgs_gauge_id")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flow_gauge_name">Gauge Name</Label>
              <Input
                id="flow_gauge_name"
                placeholder="e.g. Colorado River at Dotsero, CO"
                {...register("flow_and_gauge.gauge_name")}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="flow_gauge_url">Gauge URL</Label>
            <Input
              id="flow_gauge_url"
              placeholder="https://waterdata.usgs.gov/..."
              {...register("flow_and_gauge.gauge_url")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Optimal Flows */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Optimal Flow Ranges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Optimal Wade Fishing Flow (CFS)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min CFS"
                {...register("flow_and_gauge.optimal_wade_cfs_min", {
                  valueAsNumber: true,
                })}
              />
              <Input
                type="number"
                placeholder="Max CFS"
                {...register("flow_and_gauge.optimal_wade_cfs_max", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Optimal Float Fishing Flow (CFS)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min CFS"
                {...register("flow_and_gauge.optimal_float_cfs_min", {
                  valueAsNumber: true,
                })}
              />
              <Input
                type="number"
                placeholder="Max CFS"
                {...register("flow_and_gauge.optimal_float_cfs_max", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="flow_max_safe_wade">Max Safe Wade Flow (CFS)</Label>
              <Input
                id="flow_max_safe_wade"
                type="number"
                placeholder="CFS"
                {...register("flow_and_gauge.max_safe_wade_cfs", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flow_base">Typical Base Flow (CFS)</Label>
              <Input
                id="flow_base"
                type="number"
                placeholder="CFS"
                {...register("flow_and_gauge.base_flow_cfs", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stress Temperature */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Stress Temperature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flow_stress_temp">
              Stress Temperature (&deg;F)
            </Label>
            <Input
              id="flow_stress_temp"
              type="number"
              placeholder="e.g. 68"
              {...register("flow_and_gauge.stress_temp_f", {
                valueAsNumber: true,
              })}
            />
            <p className="text-xs text-text-light">
              Water temp above which catch-and-release is strongly recommended
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
            Additional Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional notes about flow conditions, gauge quirks, or seasonal patterns..."
            className="min-h-24"
            {...register("flow_and_gauge.notes")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
