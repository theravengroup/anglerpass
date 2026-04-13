"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CalendarDays,
  Plus,
  List,
  Calendar,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { CLUB_EVENT_STATUS } from "@/lib/constants/status";

const EVENT_TYPES = [
  { value: "tournament", label: "Tournament" },
  { value: "outing", label: "Outing" },
  { value: "meeting", label: "Meeting" },
  { value: "workday", label: "Workday" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

interface ClubEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  status: string;
  rsvp_limit: number | null;
  registered_count: number;
  waitlist_count: number;
  attended_count: number;
  waitlist_enabled: boolean;
  guest_allowed: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("outing");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [rsvpLimit, setRsvpLimit] = useState("");
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [guestAllowed, setGuestAllowed] = useState(false);
  const [eventStatus, setEventStatus] = useState("draft");

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadEvents();
  }, [clubId, statusFilter]);

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

  async function loadEvents() {
    try {
      const statusParam =
        statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await fetch(
        `/api/clubos/events?club_id=${clubId}&limit=50${statusParam}`
      );
      const json = await res.json();
      setEvents(json.events ?? []);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setTitle("");
    setType("outing");
    setDescription("");
    setLocation("");
    setStartsAt("");
    setEndsAt("");
    setRsvpLimit("");
    setWaitlistEnabled(false);
    setGuestAllowed(false);
    setEventStatus("draft");
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!clubId || !title.trim() || !startsAt) return;
    setSaving(true);

    try {
      const res = await fetch("/api/clubos/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: clubId,
          title,
          type,
          description: description || undefined,
          location: location || undefined,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
          rsvp_limit: rsvpLimit ? parseInt(rsvpLimit, 10) : undefined,
          waitlist_enabled: waitlistEnabled,
          guest_allowed: guestAllowed,
          status: eventStatus,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        await loadEvents();
      }
    } catch {
      // Handle silently
    } finally {
      setSaving(false);
    }
  }

  // Group events by month for calendar view
  const eventsByMonth = events.reduce<Record<string, ClubEvent[]>>(
    (acc, event) => {
      const month = new Date(event.starts_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(event);
      return acc;
    },
    {}
  );

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
        <Link
          href="/club/clubos/operations"
          className="transition-colors hover:text-text-secondary"
        >
          Operations
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Events</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Events
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Schedule and manage club events, outings, and&nbsp;tournaments.
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border border-stone-light/20">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1 rounded-l-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "list"
                  ? "bg-river/10 text-river"
                  : "text-text-light hover:text-text-secondary"
              }`}
            >
              <List className="size-3.5" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1 rounded-r-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "calendar"
                  ? "bg-river/10 text-river"
                  : "text-text-light hover:text-text-secondary"
              }`}
            >
              <Calendar className="size-3.5" />
              Calendar
            </button>
          </div>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-river text-white hover:bg-river/90"
          >
            <Plus className="size-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "published", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-river/10 text-river"
                : "text-text-light hover:text-text-secondary"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Events */}
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events yet"
          description="Create your first event to start managing RSVPs, waitlists, and&nbsp;attendance."
          iconColor="text-river"
          iconBackground
        >
          <Button
            onClick={openCreate}
            className="bg-river text-white hover:bg-river/90"
          >
            <Plus className="size-4" />
            Create Event
          </Button>
        </EmptyState>
      ) : view === "list" ? (
        <Card className="border-stone-light/20">
          <CardContent className="pt-6">
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
                  {events.map((event) => (
                    <tr key={event.id} className="group">
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/club/clubos/operations/events/${event.id}`}
                          className="font-medium text-text-primary transition-colors group-hover:text-river"
                        >
                          {event.title}
                        </Link>
                        {event.location && (
                          <p className="flex items-center gap-1 text-xs text-text-light">
                            <MapPin className="size-3" />
                            {event.location}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {new Date(event.starts_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
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
                            +{event.waitlist_count}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Calendar View — grouped by month */
        <div className="space-y-6">
          {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
            <Card key={month} className="border-stone-light/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{month}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/club/clubos/operations/events/${event.id}`}
                      className="flex items-center gap-4 rounded-lg border border-stone-light/20 p-3 transition-colors hover:border-river/30"
                    >
                      <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-river/10">
                        <span className="text-xs font-medium text-river">
                          {new Date(event.starts_at).toLocaleDateString(
                            "en-US",
                            { month: "short" }
                          )}
                        </span>
                        <span className="text-lg font-bold leading-none text-river">
                          {new Date(event.starts_at).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 grow">
                        <p className="text-sm font-medium text-text-primary">
                          {event.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-light">
                          <span className="capitalize">{event.type}</span>
                          {event.location && (
                            <>
                              <span>&middot;</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="size-3" />
                                {event.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <StatusBadge
                          status={event.status}
                          config={CLUB_EVENT_STATUS}
                        />
                        <p className="mt-1 text-xs text-text-light">
                          {event.registered_count} RSVPs
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          aria-label="Create event"
          aria-modal="true"
        >
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
            <DialogDescription>
              Schedule a new club event for your members.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="evt-title">Title</Label>
              <Input
                id="evt-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Spring Season Opener"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evt-type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="evt-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evt-status">Status</Label>
                <Select value={eventStatus} onValueChange={setEventStatus}>
                  <SelectTrigger id="evt-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evt-location">Location</Label>
              <Input
                id="evt-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., North Fork Access Point"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="evt-starts">Starts</Label>
                <Input
                  id="evt-starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evt-ends">Ends (optional)</Label>
                <Input
                  id="evt-ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evt-rsvp">RSVP Limit (optional)</Label>
              <Input
                id="evt-rsvp"
                type="number"
                min="1"
                value={rsvpLimit}
                onChange={(e) => setRsvpLimit(e.target.value)}
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={waitlistEnabled}
                  onChange={(e) => setWaitlistEnabled(e.target.checked)}
                  className="size-4 rounded border-stone-light/30"
                />
                Enable waitlist
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={guestAllowed}
                  onChange={(e) => setGuestAllowed(e.target.checked)}
                  className="size-4 rounded border-stone-light/30"
                />
                Allow guests
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evt-desc">Description (optional)</Label>
              <Textarea
                id="evt-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add event details, what to bring, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !title.trim() || !startsAt}
              className="bg-river text-white hover:bg-river/90"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
