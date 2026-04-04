"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import type { PropertySectionProps } from "./property-form-types";

interface LodgingSectionProps extends PropertySectionProps {
  lodgingAvailable: boolean;
}

export default function LodgingSection({
  register,
  errors,
  lodgingAvailable,
}: LodgingSectionProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bronze/10">
            <Home className="size-4 text-bronze" />
          </div>
          <div>
            <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
              Lodging
            </CardTitle>
            <p className="mt-1 text-xs text-text-light">
              If your property offers on-site lodging through Airbnb or VRBO,
              enable this to display it on your listing.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-t border-stone-light/20 pt-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-4 rounded border-stone-light/30 accent-forest"
              {...register("lodging_available")}
            />
            <span className="text-sm font-medium text-text-primary">
              Lodging available on this property
            </span>
          </label>
        </div>

        {lodgingAvailable && (
          <div className="space-y-2">
            <Label htmlFor="lodging_url">Airbnb or VRBO listing link</Label>
            <Input
              id="lodging_url"
              type="url"
              placeholder="Paste your Airbnb or VRBO URL here"
              {...register("lodging_url")}
            />
            {errors.lodging_url && (
              <p className="text-sm text-red-600">
                {errors.lodging_url.message}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
