"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Info } from "lucide-react";
import type { PropertySectionProps } from "./property-form-types";

interface AccessInfoSectionProps extends PropertySectionProps {
  gateCodeRequired: boolean;
}

export default function AccessInfoSection({
  register,
  gateCodeRequired,
}: AccessInfoSectionProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-charcoal/10">
            <Lock className="size-4 text-charcoal" />
          </div>
          <div>
            <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
              Access Information
            </CardTitle>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-text-light">
              <Info className="size-3" />
              This information is private. It is never displayed on your public
              listing. Access notes are sent only in the booking confirmation,
              and gate codes are sent via SMS on the day of the booking.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="access_notes">Access Notes</Label>
          <Textarea
            id="access_notes"
            placeholder="e.g. Turn left at the red barn on CR 18, drive 0.4 miles to the locked gate. Park in the gravel lot on the right. Walk-in access only beyond the gate."
            rows={4}
            {...register("access_notes")}
          />
        </div>

        <div className="border-t border-stone-light/20 pt-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-4 rounded border-stone-light/30 accent-forest"
              {...register("gate_code_required")}
            />
            <span className="text-sm font-medium text-text-primary">
              Gate code required for access
            </span>
          </label>
        </div>

        {gateCodeRequired && (
          <div className="space-y-2">
            <Label htmlFor="gate_code">Gate Code</Label>
            <p className="text-xs text-text-light">
              Sent to the angler via SMS on the day of their booking.
            </p>
            <Input
              id="gate_code"
              placeholder="e.g. 4582"
              {...register("gate_code")}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
