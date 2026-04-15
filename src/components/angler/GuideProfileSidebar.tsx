import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface GuideProfileSidebarProps {
  guide: {
    rate_full_day: number | null;
    rate_half_day: number | null;
    rate_description: string | null;
    trips_completed: number | null;
    response_time_hours: number | null;
  };
  watersCount: number;
}

export default function GuideProfileSidebar({
  guide,
  watersCount,
}: GuideProfileSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Rate Card */}
      <Card className="border-charcoal/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-charcoal" />
            Independent Guide Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {guide.rate_full_day && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Full Day</span>
              <span className="text-lg font-semibold text-text-primary">
                ${guide.rate_full_day}
              </span>
            </div>
          )}
          {guide.rate_half_day && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Half Day</span>
              <span className="text-lg font-semibold text-text-primary">
                ${guide.rate_half_day}
              </span>
            </div>
          )}
          {guide.rate_description && (
            <p className="text-xs text-text-light">{guide.rate_description}</p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="border-stone-light/20">
        <CardContent className="space-y-3 pt-5">
          {watersCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-forest" />
              <span className="text-text-secondary">
                Available at{" "}
                <span className="font-medium text-text-primary">
                  {watersCount} water{watersCount !== 1 ? "s" : ""}
                </span>
              </span>
            </div>
          )}
          {guide.trips_completed !== null && guide.trips_completed > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-bronze" />
              <span className="text-text-secondary">
                <span className="font-medium text-text-primary">
                  {guide.trips_completed}
                </span>{" "}
                trips completed
              </span>
            </div>
          )}
          {guide.response_time_hours !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-river" />
              <span className="text-text-secondary">
                Responds within{" "}
                <span className="font-medium text-text-primary">
                  {guide.response_time_hours}h
                </span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <Link href="/angler/discover">
        <Button className="w-full bg-charcoal text-white hover:bg-charcoal/90">
          Book This Independent Guide
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </Link>
      <p className="text-center text-[10px] text-text-light">
        Independent guides are booked through property pages when scheduling a trip.
      </p>
    </div>
  );
}
