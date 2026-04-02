"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  Star,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Types ──────────────────────────────────────────────────────────

interface FlaggedReview {
  id: string;
  review_id: string;
  flagged_by_user_id: string | null;
  flagged_by_role: string;
  flag_reason: string;
  flag_notes: string | null;
  flagged_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution: string | null;
  trip_reviews: {
    id: string;
    overall_rating: number;
    review_text: string;
    status: string;
    submitted_at: string | null;
    published_at: string | null;
    angler_user_id: string;
    property_id: string;
    trip_completed: boolean;
    would_fish_again: boolean;
    properties: { name: string } | null;
    profiles: { display_name: string | null } | null;
  } | null;
}

// ─── Constants ──────────────────────────────────────────────────────

const FLAG_REASON_LABELS: Record<string, string> = {
  threat: "Threat or Threatening Language",
  hate_speech: "Hate Speech",
  doxxing: "Personal Information (Doxxing)",
  illegal_conduct: "Illegal Conduct",
  extortion: "Extortion",
  irrelevant: "Irrelevant Content",
  factually_impossible: "Factually Impossible",
  other: "Other",
};

const ROLE_LABELS: Record<string, string> = {
  landowner: "Landowner",
  club_admin: "Club Admin",
  anglerpass_staff: "Auto-Flag (System)",
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const SEVENTY_TWO_HOURS = 72 * 60 * 60 * 1000;

// ─── Component ──────────────────────────────────────────────────────

export default function ReviewModerationPage() {
  const [flags, setFlags] = useState<FlaggedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchFlags();
  }, []);

  async function fetchFlags() {
    try {
      const res = await fetch("/api/admin/review-flags");
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }

  async function acknowledgeFlag(flagId: string) {
    setActionLoading(flagId);
    try {
      const res = await fetch("/api/admin/review-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_id: flagId }),
      });
      if (res.ok) {
        await fetchFlags();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function resolveFlag(
    reviewId: string,
    resolution: string,
    flagId: string
  ) {
    setActionLoading(flagId);
    try {
      const res = await fetch(`/api/trip-reviews/${reviewId}/flag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution,
          moderation_reason: moderationNote[flagId] || "",
        }),
      });
      if (res.ok) {
        setModerationNote((prev) => {
          const next = { ...prev };
          delete next[flagId];
          return next;
        });
        await fetchFlags();
      }
    } finally {
      setActionLoading(null);
    }
  }

  function getUrgencyClass(flag: FlaggedReview): string {
    const now = Date.now();
    const flaggedAt = new Date(flag.flagged_at).getTime();
    const elapsed = now - flaggedAt;

    // Past 72h without resolution
    if (elapsed > SEVENTY_TWO_HOURS) {
      return "border-l-4 border-l-red-500 bg-red-50/50";
    }

    // Acknowledged but approaching 72h (past 48h)
    if (flag.acknowledged_at && elapsed > 48 * 60 * 60 * 1000) {
      return "border-l-4 border-l-orange-500 bg-orange-50/50";
    }

    // Past 24h without acknowledgment
    if (!flag.acknowledged_at && elapsed > TWENTY_FOUR_HOURS) {
      return "border-l-4 border-l-red-500 bg-red-50/50";
    }

    // Within 24h acknowledgment window
    if (!flag.acknowledged_at) {
      return "border-l-4 border-l-yellow-500 bg-yellow-50/50";
    }

    // Acknowledged, within normal timeframe
    return "border-l-4 border-l-forest/40 bg-white";
  }

  function formatElapsed(dateStr: string): string {
    const elapsed = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    if (hours < 1) return "< 1 hour ago";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h ago`;
  }

  function getReviewerFirstName(displayName: string | null): string {
    if (!displayName) return "Anonymous";
    return displayName.trim().split(/\s+/)[0] || "Anonymous";
  }

  // ─── Loading ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-text-light" />
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────────────

  if (flags.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Review Moderation
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Review flagged trip reviews and take moderation action.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-light/20 bg-white py-16">
          <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
            <ShieldAlert className="size-6 text-forest" />
          </div>
          <h3 className="mt-4 text-base font-medium text-text-primary">
            No flagged reviews
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
            Flagged reviews from landowners, club admins, and the auto-flag
            system will appear here.
          </p>
        </div>
      </div>
    );
  }

  // ─── Queue ──────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Review Moderation
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Review flagged trip reviews and take moderation action.
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700"
        >
          {flags.length} pending
        </Badge>
      </div>

      <div className="space-y-4">
        {flags.map((flag) => {
          const review = flag.trip_reviews;
          if (!review) return null;

          const urgencyClass = getUrgencyClass(flag);
          const isLoading = actionLoading === flag.id;
          const reviewerName = getReviewerFirstName(
            review.profiles?.display_name ?? null
          );
          const propertyName = review.properties?.name ?? "Unknown Property";

          return (
            <div
              key={flag.id}
              className={`rounded-xl p-5 ${urgencyClass}`}
            >
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {propertyName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-light">
                    <span>Reviewer: {reviewerName}</span>
                    <span className="text-stone-light">·</span>
                    <span>
                      Status:{" "}
                      <span className="font-medium text-text-secondary">
                        {review.status}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Flag reason badge */}
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-700"
                  >
                    {FLAG_REASON_LABELS[flag.flag_reason] ?? flag.flag_reason}
                  </Badge>

                  {/* Acknowledged badge */}
                  {flag.acknowledged_at ? (
                    <Badge
                      variant="outline"
                      className="border-forest/20 bg-forest/5 text-forest"
                    >
                      <CheckCircle2 className="mr-1 size-3" />
                      Acknowledged
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-yellow-300 bg-yellow-50 text-yellow-800"
                    >
                      <Clock className="mr-1 size-3" />
                      Awaiting acknowledgment
                    </Badge>
                  )}
                </div>
              </div>

              {/* Flag metadata */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-light">
                <span>
                  Flagged by:{" "}
                  <span className="font-medium text-text-secondary">
                    {ROLE_LABELS[flag.flagged_by_role] ?? flag.flagged_by_role}
                  </span>
                </span>
                <span className="text-stone-light">·</span>
                <span>
                  {new Date(flag.flagged_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-stone-light">·</span>
                <span className="font-medium">
                  {formatElapsed(flag.flagged_at)}
                </span>
              </div>

              {/* Flag notes */}
              {flag.flag_notes && (
                <div className="mt-2 rounded-lg bg-white/60 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-text-light">
                    <MessageSquare className="size-3" />
                    Flag notes
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {flag.flag_notes}
                  </p>
                </div>
              )}

              {/* Review content */}
              <div className="mt-3 rounded-lg border border-stone-light/15 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3 ${
                          s <= review.overall_rating
                            ? "fill-bronze text-bronze"
                            : "fill-transparent text-stone-light/40"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-light">
                    {review.trip_completed
                      ? "Completed trip"
                      : "Incomplete trip"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {review.review_text}
                </p>
              </div>

              {/* Moderation note input */}
              <div className="mt-3">
                <textarea
                  placeholder="Add moderation note (optional)..."
                  value={moderationNote[flag.id] ?? ""}
                  onChange={(e) =>
                    setModerationNote((prev) => ({
                      ...prev,
                      [flag.id]: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-stone-light/20 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-light/50 focus:border-river/40 focus:outline-none focus:ring-1 focus:ring-river/20"
                  rows={2}
                />
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {/* Acknowledge */}
                {!flag.acknowledged_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeFlag(flag.id)}
                    disabled={isLoading}
                    className="border-yellow-300 text-yellow-800 hover:bg-yellow-50"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                    ) : (
                      <Clock className="mr-1.5 size-3" />
                    )}
                    Acknowledge
                  </Button>
                )}

                {/* Uphold — dismiss flag, review stays published */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    resolveFlag(review.id, "dismissed", flag.id)
                  }
                  disabled={isLoading}
                  className="border-forest/20 text-forest hover:bg-forest/5"
                >
                  <Eye className="mr-1.5 size-3" />
                  Uphold Review
                </Button>

                {/* Suppress — hide from public */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    resolveFlag(review.id, "suppressed", flag.id)
                  }
                  disabled={isLoading}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <EyeOff className="mr-1.5 size-3" />
                  Suppress
                </Button>

                {/* Remove */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    resolveFlag(review.id, "removed", flag.id)
                  }
                  disabled={isLoading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-1.5 size-3" />
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
