import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Megaphone,
  Wrench,
  HeartPulse,
  Activity,
  ArrowRight,
} from "lucide-react";

const modules = [
  {
    title: "Communications",
    description: "Broadcasts, targeted messaging, newsletters, and templates.",
    placeholder: "No campaigns sent yet",
    icon: Megaphone,
    color: "text-river",
    bg: "bg-river/10",
    href: "/club/clubos/communications",
    cta: "Set Up",
  },
  {
    title: "Operations",
    description: "Events, RSVPs, waitlists, waivers, and incident tracking.",
    placeholder: "No upcoming events",
    icon: Wrench,
    color: "text-bronze",
    bg: "bg-bronze/10",
    href: "/club/clubos/operations",
    cta: "Set Up",
  },
  {
    title: "Membership Health",
    description:
      "Engagement scores, renewal risk flags, and activity trends.",
    placeholder: "Connect member data to see insights",
    icon: HeartPulse,
    color: "text-forest",
    bg: "bg-forest/10",
    href: "/club/clubos/membership",
    cta: "View",
  },
  {
    title: "Property Activity",
    description:
      "Booking patterns, utilization rates, and seasonal trends.",
    placeholder: "Booking data will appear here",
    icon: Activity,
    color: "text-charcoal",
    bg: "bg-charcoal/10",
    href: "/club/clubos/property",
    cta: "View",
  },
];

export default function ClubOsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          ClubOS
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your club&rsquo;s operating system &mdash; communications, operations,
          and member intelligence in one&nbsp;place.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {modules.map((mod) => (
          <Card
            key={mod.title}
            className="border-stone-light/20 transition-colors hover:border-stone-light/40"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${mod.bg}`}
                >
                  <mod.icon className={`size-5 ${mod.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {mod.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-stone-light/30 bg-offwhite/50 px-4 py-6 text-center">
                <p className="text-sm text-text-light">{mod.placeholder}</p>
              </div>
              <Link
                href={mod.href}
                className={`mt-4 inline-flex items-center gap-1.5 text-sm font-medium ${mod.color} transition-colors hover:opacity-80`}
              >
                {mod.cta}
                <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
