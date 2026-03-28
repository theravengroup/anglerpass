import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, MapPin, ArrowRight, Settings } from "lucide-react";

export const metadata = {
  title: "Club Management",
};

const stats = [
  {
    label: "Total Members",
    value: "0",
    description: "Active club members",
    icon: Users,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  {
    label: "Upcoming Reservations",
    value: "0",
    description: "Scheduled this month",
    icon: CalendarDays,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    label: "Active Properties",
    value: "0",
    description: "Managed by your club",
    icon: MapPin,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
];

export default function ClubPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Club Management
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage members, reservations, and property access for your fishing
          club.
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
            <Settings className="size-5 text-bronze" />
            Set Up Your Club
          </CardTitle>
          <CardDescription>
            Configure your club profile, invite members, and connect properties
            to start managing access through AnglerPass.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-forest text-white hover:bg-forest/90">
            Get Started
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
