"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

export interface SearchClub {
  id: string;
  name: string;
  location: string | null;
  subscription_tier: string;
}

interface ClubSearchResultProps {
  club: SearchClub;
  proposing: boolean;
  onPropose: (clubId: string) => void;
}

const TIER_LABELS: Record<string, string> = {
  starter: "Starter",
  standard: "Standard",
  pro: "Pro",
};

export default function ClubSearchResult({
  club,
  proposing,
  onPropose,
}: ClubSearchResultProps) {
  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex items-center justify-between py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{club.name}</p>
            <span className="text-xs text-text-light">
              {TIER_LABELS[club.subscription_tier] ?? club.subscription_tier}
            </span>
          </div>
          {club.location && (
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin className="size-3" />
              {club.location}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <Button
            size="sm"
            className="bg-river text-white hover:bg-river/90"
            disabled={proposing}
            onClick={() => onPropose(club.id)}
          >
            {proposing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Proposing...
              </>
            ) : (
              "Propose Partnership"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
