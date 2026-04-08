import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, CalendarDays, Users, Clock, UserCheck } from "lucide-react";

interface CorporateOverviewCardProps {
  membership: {
    company_name: string | null;
    status: string;
    dues_status: string | null;
    joined_at: string;
    club_id: string;
  };
  club: {
    name: string;
    location: string | null;
  };
  summary: {
    activeEmployees: number;
    pendingInvitations: number;
    totalTeamSize: number;
  };
}

export function CorporateOverviewCard({
  membership,
  club,
  summary,
}: CorporateOverviewCardProps) {
  const joinedDate = new Date(membership.joined_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const stats = [
    {
      label: "Active Employees",
      value: summary.activeEmployees,
      icon: UserCheck,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Pending Invitations",
      value: summary.pendingInvitations,
      icon: Clock,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Total Team Size",
      value: summary.totalTeamSize,
      icon: Users,
      color: "text-river",
      bg: "bg-river/10",
    },
  ];

  return (
    <Card className="border-stone-light/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-bronze/10">
            <Building2 className="size-6 text-bronze" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              {membership.company_name ?? "Corporate Membership"}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
              <Link
                href={`/angler/discover`}
                className="flex items-center gap-1 hover:text-river"
              >
                <MapPin className="size-3.5" />
                {club.name}
                {club.location ? ` · ${club.location}` : ""}
              </Link>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Member since {joinedDate}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-stone-light/20 pt-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-text-primary">
                  {stat.value}
                </p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
