"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  CalendarDays,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Loader2,
  FileDown,
  Mail,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  CLUB_EVENT_STATUS,
  EVENT_REGISTRATION_STATUS,
} from "@/lib/constants/status";
import StatCardGrid from "@/components/shared/StatCardGrid";
import type { StatCardItem } from "@/components/shared/StatCardGrid";

interface ClubEvent {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  type: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  status: string;
  rsvp_limit: number | null;
  rsvp_deadline: string | null;
  registered_count: number;
  waitlist_count: number;
  attended_count: number;
  waitlist_enabled: boolean;
  guest_allowed: boolean;
  guest_limit_per_member: number;
}

interface Registration {
  id: string;
  membership_id: string;
  status: string;
  guest_count: number;
  notes: string | null;
  registered_at: string;
  checked_in_at: string | null;
  waitlist_position: number | null;
  membership: {
    id: string;
    user_id: string;
    profile: { full_name: string; email: string };
  };
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  async function loadEventData() {
    try {
      const [eventRes, regsRes] = await Promise.all([
        fetch(`/api/clubos/events/${eventId}`),
        fetch(`/api/clubos/events/${eventId}/registrations`),
      ]);

      if (eventRes.ok) {
        const eventJson = await eventRes.json();
        setEvent(eventJson.event);
      }

      if (regsRes.ok) {
        const regsJson = await regsRes.json();
        setRegistrations(regsJson.registrations ?? []);
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(regId: string, status: "attended" | "no_show") {
    setCheckingIn(regId);
    try {
      const res = await fetch(`/api/clubos/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrations: [{ registration_id: regId, status }],
        }),
      });

      if (res.ok) {
        await loadEventData();
      }
    } catch {
      // Handle silently
    } finally {
      setCheckingIn(null);
    }
  }

  async function handleExportAttendees() {
    if (!event) return;
    try {
      const res = await fetch("/api/clubos/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: event.club_id,
          format: "csv",
          resource: "registrations",
          event_id: eventId,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendees-${eventId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Handle silently
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-text-light">
        Event not found.
      </div>
    );
  }

  const registered = registrations.filter((r) => r.status === "registered");
  const waitlisted = registrations.filter((r) => r.status === "waitlisted");
  const attended = registrations.filter((r) => r.status === "attended");
  const noShows = registrations.filter((r) => r.status === "no_show");

  const stats: StatCardItem[] = [
    {
      label: "Registered",
      value: String(registered.length),
      description: event.rsvp_limit
        ? `of ${event.rsvp_limit} capacity`
        : "No limit set",
      icon: Users,
      color: "text-river",
      bg: "bg-river/10",
    },
    {
      label: "Waitlisted",
      value: String(waitlisted.length),
      description: event.waitlist_enabled ? "Waitlist active" : "No waitlist",
      icon: Clock,
      color: "text-bronze",
      bg: "bg-bronze/10",
    },
    {
      label: "Checked In",
      value: String(attended.length),
      description: "Marked as attended",
      icon: CheckCircle2,
      color: "text-forest",
      bg: "bg-forest/10",
    },
    {
      label: "No-Shows",
      value: String(noShows.length),
      description: "Did not attend",
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
  ];

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
        <Link
          href="/club/clubos/operations"
          className="transition-colors hover:text-text-secondary"
        >
          Operations
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href="/club/clubos/operations/events"
          className="transition-colors hover:text-text-secondary"
        >
          Events
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">{event.title}</span>
      </nav>

      {/* Event Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-2xl font-semibold text-text-primary">
              {event.title}
            </h2>
            <StatusBadge status={event.status} config={CLUB_EVENT_STATUS} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" />
              {new Date(event.starts_at).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {!event.all_day && (
                <span className="text-text-light">
                  {" "}at{" "}
                  {new Date(event.starts_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {event.location}
              </span>
            )}
            <span className="rounded-full bg-river/10 px-2 py-0.5 text-xs font-medium capitalize text-river">
              {event.type}
            </span>
          </div>
          {event.description && (
            <p className="mt-3 max-w-2xl text-sm text-text-secondary">
              {event.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAttendees}
          >
            <FileDown className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatCardGrid stats={stats} />

      {/* Registered Attendees */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-river" />
            Registered Attendees
          </CardTitle>
          <CardDescription>
            {registered.length} registered
            {event.rsvp_limit ? ` of ${event.rsvp_limit}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registered.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-light">
              No registrations yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Member</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Guests</th>
                    <th className="pb-2 pr-4">Registered</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {registered.map((reg) => (
                    <tr key={reg.id}>
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-text-primary">
                          {reg.membership?.profile?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-text-light">
                          {reg.membership?.profile?.email}
                        </p>
                      </td>
                      <td className="py-2.5 pr-4">
                        <StatusBadge
                          status={reg.status}
                          config={EVENT_REGISTRATION_STATUS}
                        />
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {reg.guest_count > 0 ? `+${reg.guest_count}` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(reg.registered_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        {reg.status === "registered" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCheckIn(reg.id, "attended")
                              }
                              disabled={checkingIn === reg.id}
                              className="text-forest hover:text-forest"
                            >
                              {checkingIn === reg.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <UserCheck className="size-3.5" />
                              )}
                              Check In
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCheckIn(reg.id, "no_show")
                              }
                              disabled={checkingIn === reg.id}
                              className="text-red-500 hover:text-red-500"
                            >
                              <UserX className="size-3.5" />
                              No-Show
                            </Button>
                          </div>
                        )}
                        {reg.status === "attended" && (
                          <span className="text-xs text-forest">
                            Checked in{" "}
                            {reg.checked_in_at
                              ? new Date(
                                  reg.checked_in_at
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        )}
                        {reg.status === "no_show" && (
                          <span className="text-xs text-red-500">
                            Marked no-show
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

      {/* Waitlist */}
      {waitlisted.length > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-bronze" />
              Waitlist
            </CardTitle>
            <CardDescription>
              {waitlisted.length} member{waitlisted.length !== 1 ? "s" : ""}{" "}
              waiting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {waitlisted
                .sort(
                  (a, b) =>
                    (a.waitlist_position ?? 999) -
                    (b.waitlist_position ?? 999)
                )
                .map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between rounded-lg border border-stone-light/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-bronze/10 text-xs font-bold text-bronze">
                        {reg.waitlist_position ?? "—"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {reg.membership?.profile?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-text-light">
                          Joined{" "}
                          {new Date(reg.registered_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status="waitlisted"
                      config={EVENT_REGISTRATION_STATUS}
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
