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
  Star,
  DollarSign,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { getProfile } from "@/lib/auth/get-profile";

export const metadata = {
  title: "Dashboard",
};

// ─── Role-specific configuration ────────────────────────────────────

interface StatItem {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface StepItem {
  label: string;
  description: string;
  href: string;
  done: false;
}

const ROLE_STATS: Record<string, StatItem[]> = {
  landowner: [
    { label: "Properties", value: "0", description: "Active listings", icon: MapPin, color: "text-forest", bg: "bg-forest/10" },
    { label: "Bookings", value: "0", description: "Upcoming trips", icon: CalendarDays, color: "text-bronze", bg: "bg-bronze/10" },
    { label: "Connections", value: "0", description: "Club partnerships", icon: Users, color: "text-river", bg: "bg-river/10" },
  ],
  club_admin: [
    { label: "Members", value: "0", description: "Active members", icon: Users, color: "text-river", bg: "bg-river/10" },
    { label: "Properties", value: "0", description: "Associated waters", icon: MapPin, color: "text-forest", bg: "bg-forest/10" },
    { label: "Bookings", value: "0", description: "This month", icon: CalendarDays, color: "text-bronze", bg: "bg-bronze/10" },
  ],
  angler: [
    { label: "Upcoming Trips", value: "0", description: "Scheduled this month", icon: CalendarDays, color: "text-river", bg: "bg-river/10" },
    { label: "Properties", value: "0", description: "Available to book", icon: MapPin, color: "text-forest", bg: "bg-forest/10" },
    { label: "Memberships", value: "0", description: "Club memberships", icon: Users, color: "text-bronze", bg: "bg-bronze/10" },
  ],
  guide: [
    { label: "Upcoming Trips", value: "0", description: "Guiding this week", icon: CalendarDays, color: "text-river", bg: "bg-river/10" },
    { label: "Rating", value: "--", description: "Average rating", icon: Star, color: "text-bronze", bg: "bg-bronze/10" },
    { label: "Earnings", value: "$0", description: "This month", icon: DollarSign, color: "text-forest", bg: "bg-forest/10" },
  ],
};

const ROLE_STEPS: Record<string, StepItem[]> = {
  landowner: [
    { label: "Complete your profile", description: "Add your name and contact details", href: "/dashboard/settings", done: false },
    { label: "Add your first property", description: "List a property with photos, rates, and availability", href: "/landowner/properties/new", done: false },
    { label: "Track your bookings", description: "View upcoming trips and earnings from your waters", href: "/landowner/bookings", done: false },
    { label: "Upload documents", description: "Add waivers and agreements for your properties", href: "/landowner/documents", done: false },
  ],
  club_admin: [
    { label: "Complete your profile", description: "Add your name and contact details", href: "/dashboard/settings", done: false },
    { label: "Set up your club", description: "Configure your club name, description, and settings", href: "/club/settings", done: false },
    { label: "Invite members", description: "Add anglers to your club by email", href: "/club/members", done: false },
    { label: "Associate properties", description: "Connect with landowner properties for club access", href: "/club/properties", done: false },
  ],
  angler: [
    { label: "Complete your profile", description: "Add your name, location, and fishing preferences", href: "/dashboard/settings", done: false },
    { label: "Explore private waters", description: "Browse available properties and membership opportunities", href: "/angler/discover", done: false },
    { label: "Make your first booking", description: "Reserve a fishing day at a private property", href: "/angler/bookings", done: false },
  ],
  guide: [
    { label: "Complete your guide profile", description: "Add your bio, techniques, species, and pricing", href: "/guide/profile", done: false },
    { label: "Upload credentials", description: "License, insurance, and First Aid certification", href: "/guide/profile", done: false },
    { label: "Set your pricing and availability", description: "Configure rates and block off unavailable dates", href: "/guide/availability", done: false },
    { label: "Request water approvals from clubs", description: "Ask clubs to approve you for their waters", href: "/guide/profile", done: false },
    { label: "Wait for admin review", description: "Our team will review your credentials and approve your profile", href: "/guide/profile", done: false },
  ],
};

const DEFAULT_STATS: StatItem[] = ROLE_STATS.angler;
const DEFAULT_STEPS: StepItem[] = ROLE_STEPS.angler;

// ─── Page ───────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const profile = await getProfile();
  const role = profile?.role ?? "angler";
  const displayName = profile?.display_name;

  const stats = ROLE_STATS[role] ?? DEFAULT_STATS;
  const steps = ROLE_STEPS[role] ?? DEFAULT_STEPS;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          {displayName ? `Welcome back, ${displayName}` : "Welcome to AnglerPass"}
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
            {steps.map((step, i) => (
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
