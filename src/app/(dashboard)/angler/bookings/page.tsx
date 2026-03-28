import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";

export const metadata = {
  title: "Bookings",
};

export default function BookingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Bookings
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            View and manage your upcoming fishing trips.
          </p>
        </div>
        <Button className="bg-forest text-white hover:bg-forest/90">
          <Plus className="size-4" />
          Book a Trip
        </Button>
      </div>

      <Card className="border-stone-light/20">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex size-14 items-center justify-center rounded-full bg-river/10">
            <CalendarDays className="size-6 text-river" />
          </div>
          <h3 className="mt-4 text-base font-medium text-text-primary">
            No bookings yet
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
            Browse available properties and book your first fishing day through
            AnglerPass.
          </p>
          <Button className="mt-6 bg-forest text-white hover:bg-forest/90">
            <Plus className="size-4" />
            Book a Trip
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
