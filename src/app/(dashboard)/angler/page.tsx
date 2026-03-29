"use client";

import { useEffect, useState } from "react";
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
  CalendarDays,
  Users,
  ArrowRight,
  Compass,
  Loader2,
  MapPin,
} from "lucide-react";

interface DashboardData {
  upcomingTrips: number;
  memberships: number;
  nextBooking: {
    property_name: string;
    booking_date: string;
  } | null;
}

export default function AnglerPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch bookings and memberships in parallel
        const [bookingsRes, clubsRes] = await Promise.all([
          fetch("/api/bookings?role=angler"),
          fetch("/api/clubs"),
        ]);

        let upcomingTrips = 0;
        let nextBooking = null;

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          const upcoming = (bookingsData.bookings ?? []).filter(
            (b: { status: string; booking_date: string }) =>
              ["pending", "confirmed"].includes(b.status) &&
              new Date(b.booking_date) >= new Date()
          );
          upcomingTrips = upcoming.length;
          if (upcoming.length > 0) {
            const next = upcoming[0];
            nextBooking = {
              property_name:
                next.properties?.name ?? "Unknown Property",
              booking_date: next.booking_date,
            };
          }
        }

        let memberships = 0;
        if (clubsRes.ok) {
          const clubsData = await clubsRes.json();
          memberships = (clubsData.member_of ?? []).length + (clubsData.owned ?? []).length;
        }

        setData({ upcomingTrips, memberships, nextBooking });
      } catch {
        setData({ upcomingTrips: 0, memberships: 0, nextBooking: null });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  const stats = [
    {
      label: "Upcoming Trips",
      value: String(data?.upcomingTrips ?? 0),
      description: "Booked fishing days",
      icon: CalendarDays,
      color: "text-river",
      bg: "bg-river/10",
      href: "/angler/bookings",
    },
    {
      label: "Memberships",
      value: String(data?.memberships ?? 0),
      description: "Active club memberships",
      icon: Users,
      color: "text-forest",
      bg: "bg-forest/10",
      href: "#",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Your Fishing Dashboard
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Track your trips and club memberships.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
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

      {/* Next trip */}
      {data?.nextBooking && (
        <Card className="border-forest/20 bg-forest/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4 text-forest" />
              Next Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary">
              <strong>{data.nextBooking.property_name}</strong> on{" "}
              {new Date(data.nextBooking.booking_date).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              )}
            </p>
            <Link href="/angler/bookings">
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-forest text-forest"
              >
                View Details
                <ArrowRight className="ml-1 size-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Discover CTA */}
      <Card className="border-bronze/20 bg-bronze/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="size-5 text-bronze" />
            Discover Private Waters
          </CardTitle>
          <CardDescription>
            Browse exclusive private fishing properties available through your
            club memberships and book your next day on the water.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/angler/discover">
            <Button className="bg-bronze text-white hover:bg-bronze/90">
              Browse Properties
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
