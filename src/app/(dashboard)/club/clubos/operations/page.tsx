"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CalendarDays,
  Users,
  AlertTriangle,
  FileDown,
  Plus,
  Clock,
  Wrench,
  ListOrdered,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCardGrid from "@/components/shared/StatCardGrid";
import type { StatCardItem } from "@/components/shared/StatCardGrid";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  CLUB_EVENT_STATUS,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
} from "@/lib/constants/status";

interface ClubEvent {
  id: string;
  title: string;
  type: string;
  status: string;
  starts_at: string;
  registered_count: number;
  rsvp_limit: number | null;
  waitlist_count: number;
}

interface Incident {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  created_at: string;
}

export default function OperationsDashboardPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadData();
  }, [clubId]);

  async function loadClubId() {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      const club =
        json.owned?.[0] ?? json.staff_of?.[0] ?? json.member_of?.[0];
      if (club) setClubId(club.id);
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  async function loadData() {
    try {
      const [eventsRes, incidentsRes, waitlistsRes] = await Promise.all([
        fetch(
          `/api/clubos/events?club_id=${clubId}&upcoming=true&limit=5`
        ),
        fetch(
          `/api/clubos/incidents?club_id=${clubId}&limit=5`
        ),
        fetch(
          `/api/clubos/waitlists?club_id=${clubId}&status=waiting`
        ),
      ]);

      const [eventsJson, incidentsJson, waitlistsJson] = await Promise.all([
        eventsRes.ok ? eventsRes.json() : { events: [] },
        incidentsRes.ok ? incidentsRes.json() : { incidents: [] },
        waitlistsRes.ok ? waitlistsRes.json() : { entries: [] },
      ]);

      setEvents(eventsJson.events ?? []);
      setIncidents(incidentsJson.incidents ?? []);
      setWaitlistCount(waitlistsJson.entries?.length ?? 0);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }

  const upcomingEvents = events.filter((e) => e.status === "published");
  const openIncidents = incidents.filter(
    (i) => i.status === "open" || i.status === "investigating"
  );
  const totalRsvps = upcomingEvents.reduce(
    (sum, e) => sum + e.registered_count,
    0
  );

  const stats: StatCardItem[] = [
    {
      label: "Upcoming Events",
      value: String(upcomingEvents.length),
      description: "Published events",
      icon: CalendarDays,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Total RSVPs",
      value: String(totalRsvps),
      description: "Across upcoming events",
      icon: Users,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "Waitlist Entries",
      value: String(waitlistCount),
      description: "Waiting for a spot",
      icon: ListOrdered,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Open Incidents",
      value: String(openIncidents.length),
      description: "Require attention",
      icon: AlertTriangle,
      color: openIncidents.length > 0 ? "text-red-500" : "text-charcoal",
      bg: openIncidents.length > 0 ? "bg-red-50" : "bg-charcoal/10",
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-text-light">
        <Link
          href="/club/clubos"
          className="transition-colors hover:text-text-secondary"
        >
          ClubOS
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Operations</span>
      </nav>

      {/* Header + Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Operations
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage events, waitlists, waivers, incidents, and
            data&nbsp;exports.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-river text-white hover:bg-river/90"
        >
          <Link href="/club/clubos/operations/events">
            <CalendarDays className="size-4" />
            Manage Events
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatCardGrid stats={stats} />

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/club/clubos/operations/events">
          <Card className="border-stone-light/20 transition-colors hover:border-river/30">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-river/10">
                <Plus className="size-5 text-river" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Create Event
                </p>
                <p className="text-xs text-text-light">
                  Schedule a club event
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/club/clubos/operations/waitlists">
          <Card className="border-stone-light/20 transition-colors hover:border-river/30">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-bronze/10">
                <ListOrdered className="size-5 text-bronze" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Manage Waitlists
                </p>
                <p className="text-xs text-text-light">
                  Membership &amp; property
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/club/clubos/operations/exports">
          <Card className="border-stone-light/20 transition-colors hover:border-river/30">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-forest/10">
                <FileDown className="size-5 text-forest" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Export Data
                </p>
                <p className="text-xs text-text-light">
                  CSV or PDF reports
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming Events */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-river" />
            Upcoming Events
          </CardTitle>
          <CardDescription>
            Next events on your club calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-light">
              No upcoming events scheduled.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Event</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 text-right">RSVPs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {upcomingEvents.map((event) => (
                    <tr key={event.id} className="group">
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/club/clubos/operations/events/${event.id}`}
                          className="font-medium text-text-primary transition-colors group-hover:text-river"
                        >
                          {event.title}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(event.starts_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="rounded-full bg-river/10 px-2 py-0.5 text-xs font-medium capitalize text-river">
                          {event.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge
                          status={event.status}
                          config={CLUB_EVENT_STATUS}
                        />
                      </td>
                      <td className="py-2.5 text-right text-text-secondary">
                        {event.registered_count}
                        {event.rsvp_limit
                          ? `/${event.rsvp_limit}`
                          : ""}
                        {event.waitlist_count > 0 && (
                          <span className="ml-1 text-xs text-bronze">
                            +{event.waitlist_count} waitlist
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      {openIncidents.length > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-red-500" />
              Open Incidents
            </CardTitle>
            <CardDescription>
              Incidents requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Incident</th>
                    <th className="pb-2 pr-4">Severity</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 text-right">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {openIncidents.map((incident) => (
                    <tr key={incident.id} className="group">
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/club/clubos/operations/incidents/${incident.id}`}
                          className="font-medium text-text-primary transition-colors group-hover:text-river"
                        >
                          {incident.title}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge
                          status={incident.severity}
                          config={INCIDENT_SEVERITY}
                        />
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge
                          status={incident.status}
                          config={INCIDENT_STATUS}
                        />
                      </td>
                      <td className="py-2.5 text-right text-text-secondary">
                        {new Date(incident.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
