import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, CalendarDays, Users, Plus, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Property Management",
};

const stats = [
  {
    label: "Your Properties",
    value: "0",
    description: "Listed on AnglerPass",
    icon: MapPin,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  {
    label: "Pending Bookings",
    value: "0",
    description: "Awaiting your review",
    icon: CalendarDays,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    label: "Active Members",
    value: "0",
    description: "Across all properties",
    icon: Users,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
];

export default function LandownerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Property Management
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your private water properties, review bookings, and track
          member access.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-stone-light/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-text-secondary">
                  {stat.label}
                </CardDescription>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`size-[18px] ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight text-text-primary">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-text-light">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Card */}
      <Card className="border-bronze/20 bg-bronze/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="size-5 text-bronze" />
            Add Your First Property
          </CardTitle>
          <CardDescription>
            List your private water on AnglerPass to start managing access,
            bookings, and memberships in one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-forest text-white hover:bg-forest/90">
            Add Property
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
