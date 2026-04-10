"use client";

import { CheckCircle2, Clock, XCircle, Building2 } from "lucide-react";

interface ClubAccess {
  id: string;
  status: string;
  approved_at: string | null;
  created_at: string;
  clubs: {
    id: string;
    name: string;
    location: string | null;
  } | null;
}

const ACCESS_STATUS: Record<
  string,
  { label: string; icon: typeof CheckCircle2; color: string }
> = {
  pending: {
    label: "Pending Club Approval",
    icon: Clock,
    color: "text-bronze",
  },
  approved: {
    label: "Associated",
    icon: CheckCircle2,
    color: "text-forest",
  },
  declined: { label: "Declined", icon: XCircle, color: "text-red-500" },
};

interface AssociatedClubsListProps {
  associations: ClubAccess[];
}

export default function AssociatedClubsList({
  associations,
}: AssociatedClubsListProps) {
  if (associations.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-primary">
        Associated Clubs
      </p>
      <div className="space-y-2">
        {associations.map((assoc) => {
          const config =
            ACCESS_STATUS[assoc.status] ?? ACCESS_STATUS.pending;
          const Icon = config.icon;
          return (
            <div
              key={assoc.id}
              className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-offwhite/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-river" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {assoc.clubs?.name ?? "Unknown Club"}
                  </p>
                  {assoc.clubs?.location && (
                    <p className="text-xs text-text-light">
                      {assoc.clubs.location}
                    </p>
                  )}
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}
              >
                <Icon className="size-3.5" />
                {config.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
