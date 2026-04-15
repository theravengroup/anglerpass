import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface BookingSuccessCardProps {
  guideName?: string;
}

export default function BookingSuccessCard({ guideName }: BookingSuccessCardProps) {
  return (
    <Card className="border-forest/20 bg-forest/5">
      <CardContent className="flex flex-col items-center py-8">
        <CheckCircle2 className="size-10 text-forest" />
        <h3 className="mt-3 text-base font-medium text-text-primary">
          Booking Confirmed!
        </h3>
        <p className="mt-1 text-center text-sm text-text-secondary">
          Your booking is confirmed. Access details are available in your bookings.
          {guideName && (
            <> Your independent guide {guideName} will be in touch before your trip.</>
          )}
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/angler/bookings">
            <Button
              variant="outline"
              size="sm"
              className="border-forest text-forest"
            >
              View My Bookings
            </Button>
          </Link>
          <Link href="/angler/discover">
            <Button variant="outline" size="sm">
              Keep Browsing
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
