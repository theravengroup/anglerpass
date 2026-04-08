"use client";

import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AvailabilityCalendar from "@/components/properties/AvailabilityCalendar";
import { CalendarDays, Info } from "lucide-react";

export default function PropertyAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = use(params);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-forest" />
            Property Availability
          </CardTitle>
          <CardDescription>
            Manage when this property is available for bookings. Click dates to
            select them, then block, mark for maintenance, or reopen as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityCalendar propertyId={propertyId} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 text-sm text-text-secondary">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-river" />
            <div className="space-y-1">
              <p>
                <strong className="text-text-primary">Available</strong> dates
                accept new bookings. This is the default state.
              </p>
              <p>
                <strong className="text-text-primary">Blocked</strong> dates
                prevent new bookings. Existing bookings are not cancelled.
              </p>
              <p>
                <strong className="text-text-primary">Maintenance</strong> marks
                dates when the property is being serviced. Functions the same as
                blocked.
              </p>
              <p>
                <strong className="text-text-primary">Booked</strong> dates have
                confirmed or pending reservations and cannot be blocked.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
