"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Compass } from "lucide-react";

export default function SettingsCrossClubCard() {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Compass className="size-5 text-bronze" />
          Cross-Club Network
        </CardTitle>
        <CardDescription>
          Clubs you&apos;ve fished at through the network. Each visit earns a
          badge on your profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-bronze/10">
            <Compass className="size-5 text-bronze" />
          </div>
          <p className="mt-3 text-sm font-medium text-text-primary">
            No Cross-Club Visits Yet
          </p>
          <p className="mt-1 max-w-xs text-center text-sm text-text-secondary">
            Once you fish at a partner club through the Cross-Club Network,
            you&apos;ll earn a badge here. Explore available waters from the{" "}
            <a
              href="/angler/discover"
              className="font-medium text-bronze hover:underline"
            >
              Discover
            </a>{" "}
            page.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
