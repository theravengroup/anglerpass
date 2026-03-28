import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Heart,
  Users,
  ArrowRight,
  Compass,
} from "lucide-react";

export const metadata = {
  title: "Your Fishing Dashboard",
};

const stats = [
  {
    label: "Upcoming Trips",
    value: "0",
    description: "Booked fishing days",
    icon: CalendarDays,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    label: "Saved Properties",
    value: "0",
    description: "On your watchlist",
    icon: Heart,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  {
    label: "Memberships",
    value: "0",
    description: "Active club memberships",
    icon: Users,
    color: "text-forest",
    bg: "bg-forest/10",
  },
];

export default function AnglerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Your Fishing Dashboard
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Track your trips, saved properties, and club memberships.
        </p>
      </div>

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

      <Card className="border-bronze/20 bg-bronze/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="size-5 text-bronze" />
            Discover Private Waters
          </CardTitle>
          <CardDescription>
            Browse exclusive private fishing properties and find your next
            unforgettable day on the water.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-forest text-white hover:bg-forest/90">
            Browse Properties
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
