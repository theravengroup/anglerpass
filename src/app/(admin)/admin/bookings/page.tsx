"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Ban,
  Loader2,
  Save,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import type { BookingStanding } from "@/lib/constants/booking-limits";

interface StandingRow {
  user_id: string;
  standing: string;
  concurrent_cap: number;
  cancellation_score: number;
  cancellation_score_updated_at: string | null;
  updated_by: string | null;
  reason: string | null;
  updated_at: string;
  display_name: string | null;
}

const STANDING_META: Record<
  BookingStanding,
  { label: string; icon: typeof ShieldCheck; color: string; bg: string }
> = {
  good: {
    label: "Good",
    icon: ShieldCheck,
    color: "text-forest",
    bg: "bg-forest/10",
  },
  warned: {
    label: "Warned",
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  restricted: {
    label: "Restricted",
    icon: ShieldAlert,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  suspended: {
    label: "Suspended",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

function StandingBadge({ standing }: { standing: BookingStanding }) {
  const meta = STANDING_META[standing] ?? STANDING_META.good;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.color}`}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}

function OverrideForm({
  row,
  onSaved,
}: {
  row: StandingRow;
  onSaved: () => void;
}) {
  const [standing, setStanding] = useState(row.standing);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!reason.trim()) {
      setError("A reason is required for standing overrides.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/booking-standing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: row.user_id,
          standing,
          reason: reason.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-parchment bg-offwhite p-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-text-secondary">
          Standing
        </label>
        <select
          value={standing}
          onChange={(e) => setStanding(e.target.value)}
          className="rounded-md border border-parchment px-2 py-1 text-sm"
        >
          <option value="good">Good</option>
          <option value="warned">Warned</option>
          <option value="restricted">Restricted</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-text-secondary">
          Reason (required)
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Manual review — good-faith cancellations"
          className="mt-1 w-full rounded-md border border-parchment px-3 py-1.5 text-sm"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest-deep disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Save className="size-3.5" />
        )}
        Save Override
      </button>
    </div>
  );
}

function BookingsAdminContent() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  function fetchStandings() {
    setLoading(true);
    const url = showAll
      ? "/api/admin/booking-standing?all=true"
      : "/api/admin/booking-standing";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load standings");
        return res.json();
      })
      .then((data) => setStandings(data.standings ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchStandings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-bronze" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter toggle */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="rounded border-parchment"
          />
          Show all users (including good standing)
        </label>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-parchment bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-parchment text-left text-xs text-text-secondary">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Standing</th>
                <th className="px-6 py-3 font-medium text-right">
                  Cancel Rate
                </th>
                <th className="px-6 py-3 font-medium text-right">Cap</th>
                <th className="px-6 py-3 font-medium">Last Updated</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-text-light"
                  >
                    {showAll
                      ? "No booking standing records found."
                      : "No flagged users. All members are in good standing."}
                  </td>
                </tr>
              ) : (
                standings.map((row) => (
                  <tr
                    key={row.user_id}
                    className="border-b border-parchment/50 last:border-0"
                  >
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-text-primary">
                        {row.display_name || "Unknown"}
                      </div>
                      <div className="text-xs text-text-light">
                        {row.user_id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <StandingBadge
                        standing={row.standing as BookingStanding}
                      />
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-medium text-text-primary">
                      {(row.cancellation_score * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-text-primary">
                      {row.concurrent_cap}
                    </td>
                    <td className="px-6 py-3 text-xs text-text-light">
                      {row.cancellation_score_updated_at
                        ? new Date(
                            row.cancellation_score_updated_at
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() =>
                          setExpandedUser(
                            expandedUser === row.user_id
                              ? null
                              : row.user_id
                          )
                        }
                        className="text-xs font-medium text-river hover:text-river-light"
                      >
                        {expandedUser === row.user_id
                          ? "Close"
                          : "Override"}
                      </button>
                      {expandedUser === row.user_id && (
                        <div className="mt-3">
                          <OverrideForm
                            row={row}
                            onSaved={() => {
                              setExpandedUser(null);
                              fetchStandings();
                            }}
                          />
                        </div>
                      )}
                      {row.reason && expandedUser !== row.user_id && (
                        <p className="mt-1 text-xs text-text-light italic">
                          {row.reason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <AdminPageGuard path="/admin/bookings">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-river/10">
            <CalendarDays className="size-5 text-river" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-forest-deep">
              Booking Management
            </h1>
            <p className="text-sm text-text-secondary">
              Review flagged members, override booking standing, and manage
              abuse prevention
            </p>
          </div>
        </div>

        <BookingsAdminContent />
      </div>
    </AdminPageGuard>
  );
}
