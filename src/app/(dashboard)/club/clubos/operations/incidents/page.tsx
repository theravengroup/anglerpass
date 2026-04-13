"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  AlertTriangle,
  Plus,
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
import { INCIDENT_STATUS, INCIDENT_SEVERITY } from "@/lib/constants/status";

const INCIDENT_TYPES = [
  { value: "safety", label: "Safety" },
  { value: "property_damage", label: "Property Damage" },
  { value: "rule_violation", label: "Rule Violation" },
  { value: "environmental", label: "Environmental" },
  { value: "access_issue", label: "Access Issue" },
  { value: "member_complaint", label: "Member Complaint" },
  { value: "other", label: "Other" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

interface Incident {
  id: string;
  title: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter?: { full_name: string } | null;
  assignee?: { full_name: string } | null;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("safety");
  const [severity, setSeverity] = useState("low");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadClubId();
  }, []);

  useEffect(() => {
    if (clubId) loadIncidents();
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

  async function loadIncidents() {
    try {
      const statusParam =
        statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await fetch(
        `/api/clubos/incidents?club_id=${clubId}&limit=50${statusParam}`
      );
      const json = await res.json();
      setIncidents(json.incidents ?? []);
    } catch {
      // Show empty state
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setTitle("");
    setType("safety");
    setSeverity("low");
    setDescription("");
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!clubId || !title.trim() || !description.trim()) return;
    setSaving(true);

    try {
      const res = await fetch("/api/clubos/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          club_id: clubId,
          title,
          type,
          severity,
          description,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        await loadIncidents();
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
        <span className="text-text-primary font-medium">Incidents</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary">
            Incidents
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track and resolve safety issues, property damage, and
            rule&nbsp;violations.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-river text-white hover:bg-river/90"
        >
          <Plus className="size-4" />
          Report Incident
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "open", "investigating", "resolved", "closed"].map((s) => (
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

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="No incidents reported"
          description="When incidents are reported, they'll appear here for tracking and&nbsp;resolution."
          iconColor="text-bronze"
          iconBackground
        >
          <Button
            onClick={openCreate}
            className="bg-river text-white hover:bg-river/90"
          >
            <Plus className="size-4" />
            Report Incident
          </Button>
        </EmptyState>
      ) : (
        <Card className="border-stone-light/20">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/20 text-left text-xs text-text-light">
                    <th className="pb-2 pr-4">Incident</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Severity</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 text-right">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-light/10">
                  {incidents.map((incident) => (
                    <tr key={incident.id} className="group">
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/club/clubos/operations/incidents/${incident.id}`}
                          className="font-medium text-text-primary transition-colors group-hover:text-river"
                        >
                          {incident.title}
                        </Link>
                        {incident.reporter && (
                          <p className="text-xs text-text-light">
                            by {incident.reporter.full_name}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs capitalize text-text-secondary">
                          {incident.type.replace(/_/g, " ")}
                        </span>
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-label="Report incident" aria-modal="true">
          <DialogHeader>
            <DialogTitle>Report Incident</DialogTitle>
            <DialogDescription>
              Log a safety issue, property damage, or rule violation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inc-title">Title</Label>
              <Input
                id="inc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the incident"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="inc-type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="inc-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inc-severity">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger id="inc-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inc-desc">Description</Label>
              <Textarea
                id="inc-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened, where, and when?"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !title.trim() || !description.trim()}
              className="bg-river text-white hover:bg-river/90"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Report Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
