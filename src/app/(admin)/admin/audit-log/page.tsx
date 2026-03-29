"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  ShieldCheck,
  MapPin,
  Users,
  CalendarDays,
  FileText,
} from "lucide-react";

interface AuditEntry {
  id: number;
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const ENTITY_ICONS: Record<string, typeof MapPin> = {
  property: MapPin,
  profile: Users,
  booking: CalendarDays,
  document: FileText,
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "moderation.approved": { label: "Approved", color: "text-forest bg-forest/10" },
  "moderation.changes_requested": { label: "Changes Requested", color: "text-bronze bg-bronze/10" },
  "moderation.rejected": { label: "Rejected", color: "text-red-500 bg-red-50" },
  "user.role_changed": { label: "Role Changed", color: "text-river bg-river/10" },
  "user.suspended": { label: "Suspended", color: "text-red-500 bg-red-50" },
  "user.unsuspended": { label: "Unsuspended", color: "text-forest bg-forest/10" },
};

const ENTITY_TYPES = ["", "property", "profile", "booking"];

export default function AuditLogPage() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (entityType) params.set("entity_type", entityType);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [page, entityType]);

  useEffect(() => {
    load();
  }, [load]);

  function formatAction(action: string): { label: string; color: string } {
    if (ACTION_LABELS[action]) return ACTION_LABELS[action];
    // Generic formatting
    const parts = action.split(".");
    const label = parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    return { label, color: "text-text-secondary bg-offwhite" };
  }

  function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Audit Log
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Track all administrative actions across the platform.
          {data && (
            <span className="ml-1 font-medium">
              ({data.total} entries)
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-stone-light/25 bg-white px-3 text-sm text-text-primary focus:border-river/40 focus:outline-none focus:ring-2 focus:ring-river/15"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t ? t.charAt(0).toUpperCase() + t.slice(1) : "All Types"}
            </option>
          ))}
        </select>
      </div>

      <Card className="border-stone-light/20">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-river" />
            </div>
          ) : !data?.entries?.length ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex size-14 items-center justify-center rounded-full bg-river/10">
                <ScrollText className="size-6 text-river" />
              </div>
              <h3 className="mt-4 text-base font-medium text-text-primary">
                No audit entries
              </h3>
              <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
                Administrative actions will be logged here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-light/10">
              {data.entries.map((entry) => {
                const { label, color } = formatAction(entry.action);
                const EntityIcon =
                  ENTITY_ICONS[entry.entity_type] ?? ShieldCheck;
                const isExpanded = expandedId === entry.id;

                return (
                  <div key={entry.id} className="px-6 py-3">
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                      className="flex w-full items-center gap-4 text-left"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-offwhite">
                        <EntityIcon className="size-4 text-text-light" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {entry.actor_name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
                          >
                            {label}
                          </span>
                        </div>
                        <p className="text-xs text-text-light">
                          {entry.entity_type}
                          {entry.entity_id
                            ? ` · ${entry.entity_id.slice(0, 8)}...`
                            : ""}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-text-light">
                        {timeAgo(entry.created_at)}
                      </span>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="ml-12 mt-3 space-y-2">
                        {entry.old_data && (
                          <Card className="border-stone-light/15">
                            <CardHeader className="pb-1 pt-3">
                              <CardTitle className="text-xs text-text-light">
                                Previous
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <pre className="overflow-x-auto text-xs text-text-secondary">
                                {JSON.stringify(entry.old_data, null, 2)}
                              </pre>
                            </CardContent>
                          </Card>
                        )}
                        {entry.new_data && (
                          <Card className="border-forest/15">
                            <CardHeader className="pb-1 pt-3">
                              <CardTitle className="text-xs text-forest">
                                Updated
                              </CardTitle>
                              <CardDescription className="sr-only">
                                New data after the action
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <pre className="overflow-x-auto text-xs text-text-secondary">
                                {JSON.stringify(entry.new_data, null, 2)}
                              </pre>
                            </CardContent>
                          </Card>
                        )}
                        <p className="text-[10px] text-text-light">
                          {new Date(entry.created_at).toLocaleString()}
                          {entry.actor_id && (
                            <span> · Actor: {entry.actor_id}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-light/15 px-6 py-3">
              <p className="text-xs text-text-light">
                Page {data.page} of {data.total_pages} ({data.total} entries)
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  className="size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.total_pages}
                  className="size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
