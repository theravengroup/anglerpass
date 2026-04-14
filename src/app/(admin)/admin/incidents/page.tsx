"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Incident {
  id: string;
  title: string;
  body: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  affected_systems: string[];
  started_at: string;
  resolved_at: string | null;
}

const STATUSES = ["investigating", "identified", "monitoring", "resolved"] as const;
const SEVERITIES = ["minor", "major", "critical"] as const;

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUSES)[number]>("investigating");
  const [severity, setSeverity] =
    useState<(typeof SEVERITIES)[number]>("minor");
  const [affected, setAffected] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/incidents", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setIncidents(data.incidents ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title.trim() || !body.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          status,
          severity,
          affected_systems: affected
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setTitle("");
      setBody("");
      setAffected("");
      setStatus("investigating");
      setSeverity("minor");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(
    id: string,
    newStatus: Incident["status"]
  ) {
    await fetch("/api/admin/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    await load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl text-forest-deep">
          Status Page Incidents
        </h1>
        <p className="mt-1 text-sm text-stone">
          Posts here appear on the public{" "}
          <a href="/status" className="underline" target="_blank" rel="noreferrer">
            /status
          </a>{" "}
          page immediately. Keep it plain and factual.
        </p>
      </div>

      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      <Card className="p-6">
        <h2 className="mb-4 font-heading text-lg">Post new incident</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Payments temporarily unavailable"
            />
          </div>
          <div>
            <Label htmlFor="body">Body</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Investigating elevated error rates on Stripe payment intents. Bookings can still be saved as drafts."
              className="mt-1 h-28 w-full rounded-md border border-parchment bg-offwhite p-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as (typeof STATUSES)[number])
                }
                className="mt-1 block w-full rounded-md border border-parchment bg-offwhite p-2 text-sm"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as (typeof SEVERITIES)[number])
                }
                className="mt-1 block w-full rounded-md border border-parchment bg-offwhite p-2 text-sm"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="affected">
              Affected systems (comma-separated)
            </Label>
            <Input
              id="affected"
              value={affected}
              onChange={(e) => setAffected(e.target.value)}
              placeholder="Payments, Bookings"
            />
          </div>
          <Button onClick={create} disabled={creating}>
            {creating ? "Posting…" : "Post incident"}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="mb-4 font-heading text-lg">Incident history</h2>
        {loading ? (
          <p className="text-sm text-stone">Loading…</p>
        ) : incidents.length === 0 ? (
          <p className="text-sm text-stone">No incidents posted yet.</p>
        ) : (
          <ul className="space-y-3">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                        <span
                          className={
                            incident.severity === "critical"
                              ? "text-red-700"
                              : incident.severity === "major"
                                ? "text-amber-700"
                                : "text-stone"
                          }
                        >
                          {incident.severity}
                        </span>
                        <span>·</span>
                        <span>{incident.status}</span>
                      </div>
                      <h3 className="font-heading text-base">
                        {incident.title}
                      </h3>
                      <p className="mt-1 text-sm text-charcoal whitespace-pre-line">
                        {incident.body}
                      </p>
                      <p className="mt-2 font-mono text-[10px] text-stone">
                        {new Date(incident.started_at).toUTCString()}
                        {incident.resolved_at &&
                          ` → resolved ${new Date(incident.resolved_at).toUTCString()}`}
                      </p>
                    </div>
                    {incident.status !== "resolved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(incident.id, "resolved")}
                      >
                        Mark resolved
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
