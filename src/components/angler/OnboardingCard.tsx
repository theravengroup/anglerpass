"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Send, MapPin, Users, ArrowRight } from "lucide-react";
import ClubBrowser from "@/components/angler/ClubBrowser";
import InviteClubForm from "@/components/angler/InviteClubForm";
import NearbyClubsList from "@/components/angler/NearbyClubsList";

type OnboardingTab = "find" | "invite" | "browse";

interface ClubInvitation {
  id: string;
  club_name: string;
  admin_email: string;
  status: string;
  created_at: string;
}

interface OnboardingCardProps {
  existingInvitations: ClubInvitation[];
}

const TABS: { id: OnboardingTab; label: string; icon: typeof Search; description: string }[] = [
  {
    id: "find",
    label: "Find a Club",
    icon: Search,
    description: "Search for your existing club on AnglerPass",
  },
  {
    id: "invite",
    label: "Invite Your Club",
    icon: Send,
    description: "Bring your club to AnglerPass — we'll reach out to them",
  },
  {
    id: "browse",
    label: "Browse by Area",
    icon: MapPin,
    description: "See clubs near you based on your profile location",
  },
];

export default function OnboardingCard({
  existingInvitations,
}: OnboardingCardProps) {
  const [activeTab, setActiveTab] = useState<OnboardingTab>("find");

  return (
    <Card className="border-bronze/20 bg-bronze/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="size-5 text-bronze" />
          Get Started with AnglerPass
        </CardTitle>
        <CardDescription>
          Join a fishing club to unlock access to private waters through the
          Cross-Club Network. Choose how you&rsquo;d like to get started:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab buttons */}
        <div className="grid grid-cols-3 gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-center transition-colors ${
                  isActive
                    ? "border-bronze bg-white text-bronze shadow-sm"
                    : "border-stone-light/20 text-text-secondary hover:border-bronze/30 hover:bg-white/50"
                }`}
              >
                <tab.icon className={`size-5 ${isActive ? "text-bronze" : "text-text-light"}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="min-h-[200px]">
          {activeTab === "find" && <ClubBrowser />}
          {activeTab === "invite" && (
            <InviteClubForm existingInvitations={existingInvitations} />
          )}
          {activeTab === "browse" && <NearbyClubsList />}
        </div>
      </CardContent>
    </Card>
  );
}
