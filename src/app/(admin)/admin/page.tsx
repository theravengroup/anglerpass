import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ShieldCheck, MapPin, Inbox } from "lucide-react";

export const metadata = {
  title: "Admin Console",
};

const stats = [
  {
    label: "Total Users",
    value: "0",
    description: "Registered accounts",
    icon: Users,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  {
    label: "Pending Reviews",
    value: "0",
    description: "Awaiting moderation",
    icon: ShieldCheck,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    label: "Total Properties",
    value: "0",
    description: "Listed on platform",
    icon: MapPin,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  {
    label: "Waitlist Signups",
    value: "0",
    description: "Pending invitations",
    icon: Inbox,
    color: "text-charcoal",
    bg: "bg-charcoal/10",
  },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Admin Console
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Platform overview and management tools.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Recent Activity */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>
            Latest events across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <p className="text-sm text-text-secondary">
              No recent activity to display.
            </p>
            <p className="mt-1 text-xs text-text-light">
              Activity will appear here as users interact with the platform.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
