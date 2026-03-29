"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  CalendarDays,
  MapPin,
  ArrowRight,
  Settings,
  Loader2,
  UserPlus,
  Bell,
} from "lucide-react";
import Link from "next/link";

interface ClubData {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  subscription_tier: string;
}

interface ClubStats {
  active_members: number;
  pending_members: number;
  active_properties: number;
  pending_properties: number;
}

export default function ClubPage() {
  const router = useRouter();
  const [club, setClub] = useState<ClubData | null>(null);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasClub, setHasClub] = useState<boolean | null>(null);

  const loadClub = useCallback(async () => {
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) return;

      const data = await res.json();
      if (!data.owned?.length) {
        setHasClub(false);
        setLoading(false);
        return;
      }

      setHasClub(true);
      const owned = data.owned[0];

      // Fetch detailed stats
      const detailRes = await fetch(`/api/clubs/${owned.id}`);
      if (detailRes.ok) {
        const detail = await detailRes.json();
        setClub(detail.club);
        setStats(detail.stats);
      } else {
        setClub(owned);
      }
    } catch {
      setHasClub(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClub();
  }, [loadClub]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  // No club yet — show setup CTA
  if (!hasClub || !club) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Club Management
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage members, reservations, and property access for your fishing
            club.
          </p>
        </div>

        <Card className="border-river/20 bg-river/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="size-5 text-river" />
              Set Up Your Club
            </CardTitle>
            <CardDescription>
              Create your club profile to start managing members, coordinating
              property access, and running your club through AnglerPass.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="bg-river text-white hover:bg-river/90"
              onClick={() => router.push("/club/setup")}
            >
              Get Started
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: "Active Members",
      value: String(stats?.active_members ?? 0),
      description:
        stats?.pending_members
          ? `${stats.pending_members} pending`
          : "Manage your roster",
      icon: Users,
      color: "text-forest",
      bg: "bg-forest/10",
      href: "/club/members",
    },
    {
      label: "Upcoming Reservations",
      value: "0",
      description: "Scheduling coming soon",
      icon: CalendarDays,
      color: "text-river",
      bg: "bg-river/10",
      href: "#",
    },
    {
      label: "Active Properties",
      value: String(stats?.active_properties ?? 0),
      description:
        stats?.pending_properties
          ? `${stats.pending_properties} pending approval`
          : "Managed by your club",
      icon: MapPin,
      color: "text-bronze",
      bg: "bg-bronze/10",
      href: "/club/properties",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            {club.name}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {club.location ?? "Club dashboard"}
          </p>
        </div>
        <Link href="/club/settings">
          <Button variant="outline" size="sm">
            <Settings className="size-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-stone-light/20 transition-colors hover:border-stone-light/40">
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
          </Link>
        ))}
      </div>

      {/* Action items */}
      {((stats?.pending_members ?? 0) > 0 ||
        (stats?.pending_properties ?? 0) > 0) && (
        <Card className="border-bronze/20 bg-bronze/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-bronze" />
              Needs Your Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.pending_members ?? 0) > 0 && (
              <Link
                href="/club/members"
                className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-white px-4 py-3 transition-colors hover:bg-offwhite/50"
              >
                <div className="flex items-center gap-3">
                  <UserPlus className="size-4 text-forest" />
                  <span className="text-sm text-text-primary">
                    {stats!.pending_members} pending member
                    {stats!.pending_members !== 1 ? "s" : ""} to review
                  </span>
                </div>
                <ArrowRight className="size-4 text-text-light" />
              </Link>
            )}
            {(stats?.pending_properties ?? 0) > 0 && (
              <Link
                href="/club/properties"
                className="flex items-center justify-between rounded-lg border border-stone-light/20 bg-white px-4 py-3 transition-colors hover:bg-offwhite/50"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-bronze" />
                  <span className="text-sm text-text-primary">
                    {stats!.pending_properties} property association
                    {stats!.pending_properties !== 1 ? "s" : ""} to approve
                  </span>
                </div>
                <ArrowRight className="size-4 text-text-light" />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/club/members">
          <Card className="border-stone-light/20 transition-colors hover:border-stone-light/40">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-forest/10">
                <UserPlus className="size-5 text-forest" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Invite Members
                </p>
                <p className="text-xs text-text-light">
                  Grow your club by inviting anglers
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/club/properties">
          <Card className="border-stone-light/20 transition-colors hover:border-stone-light/40">
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bronze/10">
                <MapPin className="size-5 text-bronze" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Manage Properties
                </p>
                <p className="text-xs text-text-light">
                  View and approve property associations
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
