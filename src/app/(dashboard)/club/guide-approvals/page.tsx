"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Compass,
  FileText,
} from "lucide-react";

interface GuideApproval {
  id: string;
  guide_id: string;
  property_id: string;
  status: string;
  requested_at: string;
  decline_reason: string | null;
  guide_profiles: {
    id: string;
    display_name: string;
    profile_photo_url: string | null;
    techniques: string[];
    species: string[];
    rating_avg: number;
    rating_count: number;
    license_url: string | null;
    insurance_url: string | null;
    first_aid_cert_url: string | null;
  } | null;
  properties: { name: string } | null;
}

export default function ClubGuideApprovalsPage() {
  const [approvals, setApprovals] = useState<GuideApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubId, setClubId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [declineReason, setDeclineReason] = useState("");

  async function loadClub() {
    try {
      // Get user's club
      const res = await fetch("/api/clubs/mine");
      if (res.ok) {
        const data = await res.json();
        if (data.club) {
          setClubId(data.club.id);
        }
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadClub();
  }, []);

  async function loadApprovals() {
    if (!clubId) return;
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/clubs/${clubId}/guide-approvals${params}`);
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, [clubId, filterStatus]);

  const handleAction = async (approvalId: string, action: "approve" | "decline" | "revoke") => {
    if (!clubId) return;
    setActionLoading(approvalId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/guide-approvals`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approval_id: approvalId,
          action,
          decline_reason: declineReason.trim() || undefined,
        }),
      });

      if (res.ok) {
        setDeclineReason("");
        loadApprovals();
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Independent Guide Approvals
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage independent guide access requests for your club&apos;s waters.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "declined", label: "Declined" },
          { value: "", label: "All" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === f.value
                ? "bg-river text-white"
                : "bg-offwhite text-text-secondary hover:bg-river/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-river" />
        </div>
      ) : approvals.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Compass className="size-8 text-text-light" />
            <p className="mt-3 text-sm text-text-secondary">
              No independent guide approval requests
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => {
            const guide = approval.guide_profiles;
            const isLoading = actionLoading === approval.id;

            return (
              <Card key={approval.id} className="border-stone-light/20">
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-charcoal/10 text-sm font-semibold text-charcoal">
                        {guide?.display_name?.charAt(0) ?? "?"}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-text-primary">
                          {guide?.display_name ?? "Unknown Independent Guide"}
                        </h3>
                        <p className="text-xs text-text-secondary">
                          Requesting access to{" "}
                          <span className="font-medium text-forest">
                            {approval.properties?.name ?? "a property"}
                          </span>
                        </p>
                        {guide && (
                          <div className="mt-1 flex items-center gap-3 text-xs text-text-light">
                            {guide.rating_count > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="size-3 fill-bronze text-bronze" />
                                {Number(guide.rating_avg).toFixed(1)} ({guide.rating_count})
                              </span>
                            )}
                            {/* Credentials */}
                            <span className="flex items-center gap-1">
                              <FileText className="size-3" />
                              {guide.license_url ? "Licensed" : "No license"}
                            </span>
                            <span>
                              {guide.insurance_url ? "Insured" : "No insurance"}
                            </span>
                            <span>
                              {guide.first_aid_cert_url ? "First Aid ✓" : "No First Aid"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ApprovalStatusBadge status={approval.status} />
                  </div>

                  {/* Techniques */}
                  {guide?.techniques && guide.techniques.length > 0 && (
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

                  {/* Pending actions */}
                  {approval.status === "pending" && (
                    <div className="flex items-center gap-2 border-t border-stone-light/15 pt-3">
                      <input
                        className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground"
                        placeholder="Decline reason (optional)"
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                      />
                      <Button
                        size="sm"
                        className="bg-forest text-white hover:bg-forest/90"
                        onClick={() => handleAction(approval.id, "approve")}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => handleAction(approval.id, "decline")}
                        disabled={isLoading}
                      >
                        <XCircle className="size-3.5" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {/* Approved actions */}
                  {approval.status === "approved" && (
                    <div className="border-t border-stone-light/15 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-500 hover:bg-red-50"
                        onClick={() => handleAction(approval.id, "revoke")}
                        disabled={isLoading}
                      >
                        Revoke Access
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ApprovalStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
    pending: { label: "Pending", color: "text-bronze", bg: "bg-bronze/10", icon: Clock },
    approved: { label: "Approved", color: "text-forest", bg: "bg-forest/10", icon: CheckCircle2 },
    declined: { label: "Declined", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
    revoked: { label: "Revoked", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  };
  const c = config[status] ?? config.pending;
  const Icon = c.icon;

  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.bg} ${c.color}`}>
      <Icon className="size-3" />
      {c.label}
    </span>
  );
}
