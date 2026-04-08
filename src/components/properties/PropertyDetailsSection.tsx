"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PropertySectionProps } from "./property-form-types";

export default function PropertyDetailsSection({
  register,
  errors,
}: PropertySectionProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          Property Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Property Name *</Label>
          <Input
            id="name"
            placeholder="e.g. Fourmile Creek"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location_description">Location Description</Label>
          <Textarea
            id="location_description"
            placeholder="e.g. The property is located 1.3 miles south of Fairplay and 2.1 miles west of the junction of Hwy. 285 and CR 18."
            rows={3}
            {...register("location_description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coordinates">GPS Coordinates</Label>
          <p className="text-xs text-text-light">
            Enter as decimal degrees: latitude, longitude (e.g. 39.2242,
            -105.9731)
          </p>
          <Input
            id="coordinates"
            placeholder="e.g. 39.2242, -105.9731"
            {...register("coordinates")}
          />
          {errors.coordinates && (
            <p className="text-sm text-red-600">
              {errors.coordinates.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description of Fishing Spot</Label>
          <Textarea
            id="description"
            placeholder="e.g. This section of Fourmile Creek contains two stream miles of a creek dotted with beaver ponds. It offers fast action for a large population of wild browns and an occasional rainbow."
            rows={5}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Guest Capacity */}
        <div className="space-y-4 rounded-lg border border-stone-light/20 bg-offwhite/30 p-4">
          <div>
            <p className="text-sm font-medium text-text-primary">
              Guest Capacity
            </p>
            <p className="mt-0.5 text-xs text-text-light">
              Set limits for how many anglers (rods) and total people can be on
              your property per day. Non-fishing guests (e.g. family members)
              are not charged a rod fee but count toward the total.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_rods">Max Rods (Anglers) *</Label>
              <Input
                id="max_rods"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 4"
                {...register("max_rods", { valueAsNumber: true })}
              />
              {errors.max_rods && (
                <p className="text-sm text-red-600">
                  {errors.max_rods.message}
                </p>
              )}
              <p className="text-xs text-text-light">
                Maximum anglers fishing at the same time.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_guests">Max Total People *</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 10"
                {...register("max_guests", { valueAsNumber: true })}
              />
              {errors.max_guests && (
                <p className="text-sm text-red-600">
                  {errors.max_guests.message}
                </p>
              )}
              <p className="text-xs text-text-light">
                Total people on property (anglers + non-fishing guests).
              </p>
            </div>
          </div>
        </div>

        {/* Booking Limits */}
        <div className="space-y-4 rounded-lg border border-stone-light/20 bg-offwhite/30 p-4">
          <div>
            <p className="text-sm font-medium text-text-primary">
              Booking Limits
            </p>
            <p className="mt-0.5 text-xs text-text-light">
              Optional controls to limit how often members can book and how far
              in advance. Leave blank for no restrictions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_bookings_per_member_per_month">
                Max Bookings per Member / Month
              </Label>
              <Input
                id="max_bookings_per_member_per_month"
                type="number"
                min="1"
                step="1"
                placeholder="No limit"
                {...register("max_bookings_per_member_per_month", {
                  valueAsNumber: true,
                })}
              />
              {errors.max_bookings_per_member_per_month && (
                <p className="text-sm text-red-600">
                  {errors.max_bookings_per_member_per_month.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="advance_booking_days">
                Advance Booking Window (Days)
              </Label>
              <Input
                id="advance_booking_days"
                type="number"
                min="1"
                step="1"
                placeholder="No limit"
                {...register("advance_booking_days", {
                  valueAsNumber: true,
                })}
              />
              {errors.advance_booking_days && (
                <p className="text-sm text-red-600">
                  {errors.advance_booking_days.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
