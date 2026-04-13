"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  FileText,
  CalendarDays,
  Users,
  DollarSign,
  ClipboardList,
  Activity,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXPORT_TYPES = [
  {
    value: "events",
    label: "Events",
    description: "All club events with RSVP counts",
    icon: CalendarDays,
    color: "text-river",
    bg: "bg-river/10",
  },
  {
    value: "registrations",
    label: "Event Attendance",
    description: "Attendees for a specific event",
    icon: Users,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  {
    value: "incidents",
    label: "Incidents",
    description: "Incident reports with severity and resolution",
    icon: ClipboardList,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    value: "waivers",
    label: "Waiver Signatures",
    description: "Signed waivers with member details",
    icon: FileText,
    color: "text-bronze",
    bg: "bg-bronze/10",
  },
  {
    value: "activity",
    label: "Member Activity",
    description: "Activity log for engagement analysis",
    icon: Activity,
    color: "text-charcoal",
    bg: "bg-charcoal/10",
  },
];

interface ExportHistoryEntry {
  resource: string;
  format: string;
  row_count: number;
  occurred_at: string;
}

export default function ExportsPage() {
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [selectedType, setSelectedType] = useState("events");
  const [format, setFormat] = useState("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) {
      loadEvents();
      loadHistory();
    }
  }, [clubId]);

  async function loadClubId() {
    try {
      const res = await fetch("/api/clubs");
      const json = await res.json();
      const club =
        json.owned?.[0] ?? json.staff_of?.[0] ?? json.member_of?.[0];
      if (club) setClubId(club.id);
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents() {
    try {
      const res = await fetch(`/api/clubos/events?club_id=${clubId}&limit=100`);
      const json = await res.json();
      setEvents(
        (json.events ?? []).map((e: { id: string; title: string }) => ({
          id: e.id,
          title: e.title,
        }))
      );
    } catch {
      // Handle silently
    }
  }

  async function loadHistory() {
    try {
      const res = await fetch(
        `/api/clubos/activity?club_id=${clubId}&event_type=data_exported&limit=20`
      );
      const json = await res.json();
      setHistory(
        (json.events ?? []).map(
          (e: { metadata: Record<string, unknown>; occurred_at: string }) => ({
            resource: String(e.metadata?.resource ?? ""),
            format: String(e.metadata?.format ?? ""),
            row_count: Number(e.metadata?.row_count ?? 0),
            occurred_at: e.occurred_at,
          })
        )
      );
    } catch {
      // Handle silently
    }
  }

  async function handleExport() {
    if (!clubId) return;
    setExporting(true);
    setExported(false);

    try {
      const body: Record<string, string> = {
        club_id: clubId,
        format,
        resource: selectedType,
      };
      if (dateFrom) body.date_from = dateFrom;
      if (dateTo) body.date_to = dateTo;
      if (selectedType === "registrations" && eventId) {
        body.event_id = eventId;
      }

      const res = await fetch("/api/clubos/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedType}-export.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        setExported(true);
        setTimeout(() => setExported(false), 3000);
        await loadHistory();
      }
    } catch {
      // Handle silently
    } finally {
      setExporting(false);
    }
  }

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
        <span className="text-text-primary font-medium">Data Exports</span>
      </nav>

      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Data Exports
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Export club data as CSV or PDF for reporting and&nbsp;analysis.
        </p>
      </div>

      {/* Export Builder */}
      <Card className="border-stone-light/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileDown className="size-4 text-river" />
            New Export
          </CardTitle>
          <CardDescription>
            Choose what to export and in which format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Type Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPORT_TYPES.map((exportType) => (
              <button
                key={exportType.value}
                onClick={() => setSelectedType(exportType.value)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedType === exportType.value
                    ? "border-river/30 bg-river/5"
                    : "border-stone-light/20 hover:border-stone-light/40"
                }`}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${exportType.bg}`}
                >
                  <exportType.icon
                    className={`size-5 ${exportType.color}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {exportType.label}
                  </p>
                  <p className="text-xs text-text-light">
                    {exportType.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Event selector for registrations */}
          {selectedType === "registrations" && (
            <div className="space-y-2">
              <Label htmlFor="export-event">Event</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger id="export-event">
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Format + Date Range */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="export-format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="export-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="size-3.5" />
                      CSV
                    </span>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <span className="flex items-center gap-2">
                      <FileText className="size-3.5" />
                      PDF
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-from">From (optional)</Label>
              <Input
                id="export-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-to">To (optional)</Label>
              <Input
                id="export-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Export Button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleExport}
              disabled={
                exporting ||
                (selectedType === "registrations" && !eventId)
              }
              className="bg-river text-white hover:bg-river/90"
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              Export{" "}
              {EXPORT_TYPES.find((t) => t.value === selectedType)?.label ??
                "Data"}
            </Button>
            {exported && (
              <span className="flex items-center gap-1 text-sm text-forest">
                <CheckCircle2 className="size-4" />
                Downloaded
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      {history.length > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Export History</CardTitle>
            <CardDescription>Recent data exports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Format</th>
                    <th className="pb-2 pr-4">Rows</th>
                    <th className="pb-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {history.map((entry, i) => (
                    <tr key={i}>
                      <td className="py-2.5 pr-4 font-medium capitalize text-text-primary">
                        {entry.resource}
                      </td>
                      <td className="py-2.5 pr-4 uppercase text-text-secondary">
                        {entry.format}
                      </td>
                      <td className="py-2.5 pr-4 text-text-secondary">
                        {entry.row_count.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-text-secondary">
                        {new Date(entry.occurred_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
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
