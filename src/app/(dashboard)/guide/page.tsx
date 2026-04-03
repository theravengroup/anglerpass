// TODO: Convert to server component with async data fetching
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  CalendarDays,
  Star,
  DollarSign,
  UserCircle,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface GuideProfile {
  id: string;
  display_name: string;
  status: string;
  rating_avg: number;
  rating_count: number;
  trips_completed: number;
}

interface GuideBooking {
  id: string;
  booking_date: string;
  duration: string;
  party_size: number;
  guide_rate: number;
  properties: { name: string } | null;
  profiles: { display_name: string | null } | null;
}

export default function GuideDashboardPage() {
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [bookings, setBookings] = useState<GuideBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const load = useCallback(async () => {
    try {
      const [profileRes, threadsRes] = await Promise.all([
        fetch("/api/guides/profile"),
        fetch("/api/messages"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }

      if (threadsRes.ok) {
        const data = await threadsRes.json();
        const total = (data.threads ?? []).reduce(
          (sum: number, t: { unread_count: number }) => sum + t.unread_count,
          0
        );
        setUnreadMessages(total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Guide Dashboard
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Set up your guide profile to start guiding on private waters.
          </p>
        </div>
        <Card className="border-bronze/20 bg-bronze/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <UserCircle className="size-12 text-bronze" />
              <h3 className="mt-4 text-lg font-medium text-text-primary">
                Create Your Guide Profile
              </h3>
              <p className="mt-2 max-w-md text-sm text-text-secondary">
                Get started by setting up your guide profile with your bio, techniques,
                pricing, and credentials.
              </p>
              <Link
                href="/guide/profile"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-charcoal px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-charcoal/90"
              >
                Create Profile
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "text-text-light", bg: "bg-offwhite" },
    pending: { label: "Pending Verification", color: "text-bronze", bg: "bg-bronze/10" },
    verified: { label: "Verified", color: "text-river", bg: "bg-river/10" },
    live: { label: "Live", color: "text-forest", bg: "bg-forest/10" },
    suspended: { label: "Suspended", color: "text-red-600", bg: "bg-red-50" },
    rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50" },
  };
  const status = statusConfig[profile.status] ?? statusConfig.draft;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Guide Dashboard
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome back, {profile.display_name}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Status alerts */}
      {profile.status === "draft" && (
        <Card className="border-bronze/20 bg-bronze/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="size-5 shrink-0 text-bronze" />
            <div>
              <p className="text-sm font-medium text-text-primary">Complete your profile</p>
              <p className="text-sm text-text-secondary">
                Fill in your profile details and upload credentials, then submit for review.
              </p>
              <Link
                href="/guide/profile"
                className="mt-2 inline-flex text-sm font-medium text-bronze hover:underline"
              >
                Go to Profile <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.status === "pending" && (
        <Card className="border-bronze/20 bg-bronze/5">
          <CardContent className="flex items-start gap-3 py-4">
            <Loader2 className="size-5 shrink-0 animate-spin text-bronze" />
            <div>
              <p className="text-sm font-medium text-text-primary">Verification in progress</p>
              <p className="text-sm text-text-secondary">
                Your background check is being processed. You&apos;ll be notified once complete.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.status === "verified" && (
        <Card className="border-river/20 bg-river/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="size-5 shrink-0 text-river" />
            <div>
              <p className="text-sm font-medium text-text-primary">Verified — awaiting final approval</p>
              <p className="text-sm text-text-secondary">
                Your background check cleared. Our team will make your profile live shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-river" />
              <span className="text-2xl font-semibold">{profile.trips_completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="size-5 text-bronze" />
              <span className="text-2xl font-semibold">
                {profile.rating_count > 0 ? profile.rating_avg.toFixed(1) : "--"}
              </span>
              {profile.rating_count > 0 && (
                <span className="text-sm text-text-light">({profile.rating_count})</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="size-5 text-forest" />
              <span className="text-2xl font-semibold">$0</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-light/20">
          <CardHeader className="pb-2">
            <CardDescription>Messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-charcoal" />
              <span className="text-2xl font-semibold">{unreadMessages}</span>
              <span className="text-sm text-text-light">unread</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Edit Profile", href: "/guide/profile", icon: UserCircle },
          { label: "Verification", href: "/guide/verification", icon: ShieldCheck },
          { label: "Set Availability", href: "/guide/availability", icon: CalendarDays },
          { label: "View Bookings", href: "/guide/bookings", icon: CalendarDays },
          { label: "My Reviews", href: "/guide/reviews", icon: Star },
          { label: "Messages", href: "/guide/messages", icon: MessageSquare },
          { label: "Earnings", href: "/guide/earnings", icon: DollarSign },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="border-stone-light/20 transition-colors hover:border-charcoal/20 hover:bg-offwhite/50">
              <CardContent className="flex items-center gap-3 py-4">
                <item.icon className="size-5 text-text-light" />
                <span className="text-sm font-medium text-text-primary">{item.label}</span>
                <ArrowRight className="ml-auto size-4 text-text-light" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
