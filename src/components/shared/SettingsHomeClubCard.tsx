"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────

interface ClubMembership {
  id: string;
  role: string;
  status: string;
  joined_at: string | null;
  clubs: {
    id: string;
    name: string;
    logo_url: string | null;
    location: string | null;
  } | null;
}

interface SettingsHomeClubCardProps {
  memberships: ClubMembership[];
}

// ─── Component ──────────────────────────────────────────────────────

export default function SettingsHomeClubCard({
  memberships,
}: SettingsHomeClubCardProps) {
  const homeClub = memberships.find((m) => m.status === "active");
  const pendingClub = memberships.find((m) => m.status === "pending");

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5 text-river" />
          Home Club
        </CardTitle>
        <CardDescription>
          Your home club is your primary fishing club. Through the Cross-Club
          Network, you can fish at partner clubs without needing separate
          memberships.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {homeClub ? (
          <div className="flex items-center justify-between rounded-lg border border-river/20 bg-river/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-river/10 text-base font-semibold text-river">
                {homeClub.clubs?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {homeClub.clubs?.name ?? "Unknown Club"}
                </p>
                {homeClub.clubs?.location && (
                  <p className="flex items-center gap-1 text-xs text-text-light">
                    <MapPin className="size-3" />
                    {homeClub.clubs.location}
                  </p>
                )}
                {homeClub.joined_at && (
                  <p className="mt-0.5 text-xs text-text-light">
                    Member since{" "}
                    {new Date(homeClub.joined_at).toLocaleDateString(
                      "en-US",
                      { month: "long", year: "numeric" }
                    )}
                  </p>
                )}
              </div>
            </div>
            <span className="rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest">
              Home Club
            </span>
          </div>
        ) : pendingClub ? (
          <div className="flex items-center justify-between rounded-lg border border-bronze/20 bg-bronze/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-bronze/10 text-base font-semibold text-bronze">
                {pendingClub.clubs?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {pendingClub.clubs?.name ?? "Unknown Club"}
                </p>
                {pendingClub.clubs?.location && (
                  <p className="flex items-center gap-1 text-xs text-text-light">
                    <MapPin className="size-3" />
                    {pendingClub.clubs.location}
                  </p>
                )}
              </div>
            </div>
            <span className="rounded-full bg-bronze/10 px-2.5 py-1 text-xs font-medium text-bronze">
              Pending Approval
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-river/10">
              <Users className="size-5 text-river" />
            </div>
            <p className="mt-3 text-sm font-medium text-text-primary">
              No Home Club Yet
            </p>
            <p className="mt-1 max-w-xs text-center text-sm text-text-secondary">
              Find and join a club to unlock access to private waters through
              the Cross-Club Network.
            </p>
            <a
              href="/angler/discover"
              className="mt-3 text-sm font-medium text-river hover:underline"
            >
              Find a Club &rarr;
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
