import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle2,
  Circle,
} from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

const stats = [
  {
    label: "Properties",
    value: "0",
    description: "Active listings",
    icon: MapPin,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  {
    label: "Upcoming Trips",
    value: "0",
    description: "Scheduled this month",
    icon: CalendarDays,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    label: "Connections",
    value: "0",
    description: "Club memberships",
    icon: Users,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
];

const gettingStartedSteps = [
  {
    label: "Complete your profile",
    description: "Add your name, location, and fishing preferences",
    href: "/dashboard/settings",
    done: false,
  },
  {
    label: "Choose your role",
    description: "Set up as a landowner, club manager, or angler",
    href: "/dashboard/settings",
    done: false,
  },
  {
    label: "Explore private waters",
    description: "Browse available properties and membership opportunities",
    href: "/angler/discover",
    done: false,
  },
  {
    label: "Make your first booking",
    description: "Reserve a fishing day at a private property",
    href: "/angler/bookings",
    done: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Welcome to AnglerPass
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your platform for private water access. Here is an overview of your
          account.
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

      {/* Getting Started */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
          <CardDescription>
            Complete these steps to get the most out of AnglerPass
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gettingStartedSteps.map((step, i) => (
              <Link
                key={i}
                href={step.href}
                className="flex items-start gap-3 rounded-lg border border-stone-light/15 p-4 transition-colors hover:border-stone-light/30 hover:bg-offwhite/50"
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-forest" />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-stone-light" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {step.description}
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" className="shrink-0" asChild>
                  <span>
                    <ArrowRight className="size-4 text-text-light" />
                  </span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
