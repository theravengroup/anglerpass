"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Compass,
} from "lucide-react";

interface GuideProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio: string | null;
  status: string;
  techniques: string[];
  species: string[];
  base_location: string | null;
  license_url: string | null;
  insurance_url: string | null;
  first_aid_cert_url: string | null;
  insurance_amount: string | null;
  license_state: string | null;
  rate_full_day: number | null;
  created_at: string;
}

interface Counts {
  pending: number;
  verified: number;
  live: number;
  suspended: number;
  rejected: number;
  draft: number;
}

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, verified: 0, live: 0, suspended: 0, rejected: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/admin/guides${params}`);
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides ?? []);
        setCounts(data.counts ?? counts);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filterStatus]);

  const handleAction = async (guideId: string, action: "make_live" | "reject" | "suspend" | "request_info") => {
    if ((action === "reject" || action === "suspend" || action === "request_info") && !reason.trim()) {
      alert("Please provide a reason");
      return;
    }

    setActionLoading(guideId);
    try {
      const res = await fetch("/api/admin/guides", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guide_id: guideId,
          action,
          reason: reason.trim() || undefined,
        }),
      });

      if (res.ok) {
        setReason("");
        load();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error ?? "Action failed");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const statusFilters = [
    { value: "pending", label: "Pending", count: counts.pending },
    { value: "verified", label: "Verified", count: counts.verified },
    { value: "live", label: "Live", count: counts.live },
    { value: "rejected", label: "Rejected", count: counts.rejected },
    { value: "suspended", label: "Suspended", count: counts.suspended },
    { value: null, label: "All", count: Object.values(counts).reduce((a, b) => a + b, 0) },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Guide Management
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review and manage guide profiles.
        </p>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((sf) => (
          <button
            key={sf.label}
            onClick={() => setFilterStatus(sf.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === sf.value
                ? "bg-charcoal text-white"
                : "bg-offwhite text-text-secondary hover:bg-charcoal/10"
            }`}
          >
            {sf.label} ({sf.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      ) : guides.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Compass className="size-8 text-text-light" />
            <p className="mt-3 text-sm text-text-secondary">
              No guides in this category
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {guides.map((guide) => (
            <Card key={guide.id} className="border-stone-light/20">
              <CardContent className="space-y-4 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">
                      {guide.display_name}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-secondary">
                      {guide.base_location && (
                        <span>{guide.base_location}</span>
                      )}
                      {guide.rate_full_day && (
                        <span>${guide.rate_full_day}/day</span>
                      )}
                      <span>
                        Submitted{" "}
                        {new Date(guide.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {guide.bio && (
                      <p className="mt-2 line-clamp-2 text-xs text-text-secondary">
                        {guide.bio}
                      </p>
                    )}
                  </div>
                  <GuideStatusBadge status={guide.status} />
                </div>

                {/* Credentials */}
                <div className="flex gap-3">
                  <CredentialBadge
                    label="License"
                    hasUrl={!!guide.license_url}
                    state={guide.license_state}
                  />
                  <CredentialBadge
                    label="Insurance"
                    hasUrl={!!guide.insurance_url}
                    amount={guide.insurance_amount}
                  />
                  <CredentialBadge
                    label="First Aid"
                    hasUrl={!!guide.first_aid_cert_url}
                  />
                </div>

                {/* Techniques */}
                {guide.techniques.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {guide.techniques.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-offwhite px-2 py-0.5 text-[10px] text-text-secondary"
                      >
                        {t.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions — Pending: waiting on background check */}
                {guide.status === "pending" && (
                  <div className="border-t border-stone-light/15 pt-3">
                    <p className="text-xs text-text-light">
                      Background check in progress. No admin action needed until verification completes.
                    </p>
                  </div>
                )}

                {/* Actions — Verified: ready for admin to make live or reject */}
                {guide.status === "verified" && (
                  <div className="space-y-3 border-t border-stone-light/15 pt-3">
                    <textarea
                      className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Reason (required for reject / request info)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-forest text-white hover:bg-forest/90"
                        onClick={() => handleAction(guide.id, "make_live")}
                        disabled={actionLoading === guide.id}
                      >
                        {actionLoading === guide.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        Make Live
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => handleAction(guide.id, "reject")}
                        disabled={actionLoading === guide.id}
                      >
                        <XCircle className="size-3.5" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-bronze/30 text-bronze hover:bg-bronze/5"
                        onClick={() => handleAction(guide.id, "request_info")}
                        disabled={actionLoading === guide.id}
                      >
                        <AlertTriangle className="size-3.5" />
                        Request Info
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions — Live: can suspend */}
                {guide.status === "live" && (
                  <div className="border-t border-stone-light/15 pt-3">
                    <div className="flex gap-2">
                      <textarea
                        className="flex min-h-[30px] flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground"
                        placeholder="Reason for suspension"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => handleAction(guide.id, "suspend")}
                        disabled={actionLoading === guide.id}
                      >
                        Suspend
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function GuideStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    draft: { label: "Draft", color: "text-text-light", bg: "bg-offwhite", icon: Clock },
    pending: { label: "Pending", color: "text-bronze", bg: "bg-bronze/10", icon: Clock },
    verified: { label: "Verified", color: "text-river", bg: "bg-river/10", icon: CheckCircle2 },
    live: { label: "Live", color: "text-forest", bg: "bg-forest/10", icon: CheckCircle2 },
    suspended: { label: "Suspended", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
    rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  };
  const c = config[status] ?? config.draft;
  const Icon = c.icon;

  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.color}`}>
      <Icon className="size-3" />
      {c.label}
    </span>
  );
}

function CredentialBadge({
  label,
  hasUrl,
  state,
  amount,
}: {
  label: string;
  hasUrl: boolean;
  state?: string | null;
  amount?: string | null;
}) {
  return (
    <span
      className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium ${
        hasUrl ? "bg-forest/10 text-forest" : "bg-red-50 text-red-400"
      }`}
    >
      <FileText className="size-3" />
      {label}
      {hasUrl ? " ✓" : " ✗"}
      {state && ` (${state})`}
      {amount && ` ${amount}`}
    </span>
  );
}
