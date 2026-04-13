"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { INCIDENT_STATUS, INCIDENT_SEVERITY } from "@/lib/constants/status";

interface Incident {
  id: string;
  club_id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  resolution: string | null;
  occurred_at: string | null;
  created_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  reporter?: { full_name: string; email: string } | null;
  assignee?: { full_name: string; email: string } | null;
}

const TIMELINE_ICONS: Record<string, typeof Clock> = {
  open: Clock,
  investigating: AlertTriangle,
  resolved: CheckCircle2,
  closed: XCircle,
};

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = params.incidentId as string;

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    loadIncident();
  }, [incidentId]);

  async function loadIncident() {
    try {
      const res = await fetch(`/api/clubos/incidents/${incidentId}`);
      if (res.ok) {
        const json = await res.json();
        setIncident(json.incident);
        setNewStatus(json.incident.status);
        setResolution(json.incident.resolution ?? "");
      }
    } catch {
      // Handle silently
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    if (!incident) return;
    setSaving(true);

    try {
      const body: Record<string, string> = {};
      if (newStatus !== incident.status) body.status = newStatus;
      if (resolution !== (incident.resolution ?? ""))
        body.resolution = resolution;

      const res = await fetch(`/api/clubos/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await loadIncident();
      }
    } catch {
      // Handle silently
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="mx-auto max-w-5xl py-12 text-center text-sm text-text-light">
        Incident not found.
      </div>
    );
  }

  // Build timeline entries
  const timeline: { label: string; date: string; icon: typeof Clock }[] = [
    {
      label: "Reported",
      date: incident.created_at,
      icon: Clock,
    },
  ];
  if (incident.occurred_at) {
    timeline.unshift({
      label: "Occurred",
      date: incident.occurred_at,
      icon: AlertTriangle,
    });
  }
  if (incident.resolved_at) {
    timeline.push({
      label: "Resolved",
      date: incident.resolved_at,
      icon: CheckCircle2,
    });
  }
  if (incident.closed_at) {
    timeline.push({
      label: "Closed",
      date: incident.closed_at,
      icon: XCircle,
    });
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
        <Link
          href="/club/clubos/operations/incidents"
          className="transition-colors hover:text-text-secondary"
        >
          Incidents
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">
          {incident.title}
        </span>
      </nav>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            {incident.title}
          </h2>
          <StatusBadge status={incident.status} config={INCIDENT_STATUS} />
          <StatusBadge
            status={incident.severity}
            config={INCIDENT_SEVERITY}
          />
        </div>
        <p className="mt-1 text-sm text-text-secondary">
          <span className="capitalize">
            {incident.type.replace(/_/g, " ")}
          </span>
          {incident.reporter && (
            <>
              {" · Reported by "}
              {incident.reporter.full_name}
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card className="border-stone-light/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">
                {incident.description}
              </p>
            </CardContent>
          </Card>

          {/* Resolution */}
          <Card className="border-stone-light/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Resolution &amp; Status
              </CardTitle>
              <CardDescription>
                Update the status and add resolution notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inc-status">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger id="inc-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">
                      Investigating
                    </SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inc-resolution">
                  Resolution Notes
                </Label>
                <Textarea
                  id="inc-resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe what was done to resolve this incident..."
                  rows={4}
                />
              </div>

              <Button
                onClick={handleUpdate}
                disabled={saving}
                className="bg-river text-white hover:bg-river/90"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                Update Incident
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — Timeline */}
        <div>
          <Card className="border-stone-light/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((entry, i) => {
                  const Icon = entry.icon;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex size-8 items-center justify-center rounded-full bg-stone-light/10">
                          <Icon className="size-4 text-text-light" />
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="h-full w-px bg-stone-light/20" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-text-primary">
                          {entry.label}
                        </p>
                        <p className="text-xs text-text-light">
                          {new Date(entry.date).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="mt-4 border-stone-light/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-text-light">Type</dt>
                  <dd className="font-medium capitalize text-text-primary">
                    {incident.type.replace(/_/g, " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-light">Severity</dt>
                  <dd>
                    <StatusBadge
                      status={incident.severity}
                      config={INCIDENT_SEVERITY}
                    />
                  </dd>
                </div>
                {incident.assignee && (
                  <div>
                    <dt className="text-text-light">Assigned To</dt>
                    <dd className="font-medium text-text-primary">
                      {incident.assignee.full_name}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
