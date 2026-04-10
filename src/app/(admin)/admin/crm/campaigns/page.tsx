"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Mail,
  Eye,
  MousePointerClick,
  Search,
  Users,
  Trash2,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import CampaignStatusBadge from "@/components/admin/crm/CampaignStatusBadge";
import CampaignTypeBadge from "@/components/admin/crm/CampaignTypeBadge";
import type { CampaignStatus, CampaignType } from "@/lib/crm/types";

// ─── Types ──────────────────────────────────────────────────────────

interface CampaignRow {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  created_at: string;
  started_at: string | null;
  total_sends: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  open_rate: number;
  click_rate: number;
  step_count: number;
}

interface SegmentRow {
  id: string;
  name: string;
  description: string | null;
  is_dynamic: boolean;
  cached_count: number | null;
  cached_at: string | null;
  created_at: string;
}

type Tab = "campaigns" | "segments";

const STATUS_FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];

// ─── Page ───────────────────────────────────────────────────────────

export default function CrmCampaignsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("campaigns");

  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-stone-light/20">
          <TabButton
            active={tab === "campaigns"}
            onClick={() => setTab("campaigns")}
            icon={<Mail className="size-4" />}
            label="Campaigns"
          />
          <TabButton
            active={tab === "segments"}
            onClick={() => setTab("segments")}
            icon={<Users className="size-4" />}
            label="Segments"
          />
        </div>

        {/* Content */}
        {tab === "campaigns" ? (
          <CampaignList onNavigate={(id) => router.push(`/admin/crm/campaigns/${id}`)} />
        ) : (
          <SegmentList />
        )}
      </div>
    </AdminPageGuard>
  );
}

// ─── Tab Button ─────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-forest text-forest"
          : "border-transparent text-text-secondary hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Campaign List ──────────────────────────────────────────────────

function CampaignList({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/campaigns?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const createCampaign = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Campaign",
          type: "broadcast",
          from_name: "AnglerPass",
          from_email: "hello@anglerpass.com",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onNavigate(data.campaign.id);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.label}
              onClick={() => setStatusFilter(sf.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === sf.value
                  ? "bg-charcoal text-white"
                  : "bg-offwhite text-text-secondary hover:bg-charcoal/10"
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        <button
          onClick={createCampaign}
          disabled={creating}
          className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-2 text-xs font-medium text-white hover:bg-forest-deep disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-lg border border-stone-light/20 p-8 text-center">
          <Mail className="mx-auto size-8 text-stone" />
          <p className="mt-2 text-sm text-text-secondary">No campaigns yet</p>
          <p className="mt-1 text-xs text-text-light">
            Create your first campaign to start reaching your&nbsp;audience.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate(c.id)}
              className="flex w-full items-center gap-4 rounded-lg border border-stone-light/20 bg-white p-4 text-left transition-colors hover:border-stone-light/40 hover:bg-offwhite/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {c.name}
                  </p>
                  <CampaignStatusBadge status={c.status} />
                  <CampaignTypeBadge type={c.type} />
                </div>
                <p className="mt-0.5 text-xs text-text-light">
                  {c.step_count} step{c.step_count !== 1 ? "s" : ""}
                  {c.started_at
                    ? ` · Started ${new Date(c.started_at).toLocaleDateString()}`
                    : ` · Created ${new Date(c.created_at).toLocaleDateString()}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4 text-xs text-text-secondary">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {c.total_sends}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  {c.open_rate}%
                </span>
                <span className="flex items-center gap-1">
                  <MousePointerClick className="size-3.5" />
                  {c.click_rate}%
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Segment List ───────────────────────────────────────────────────

function SegmentList() {
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/segments");
      if (res.ok) {
        const data = await res.json();
        setSegments(data.segments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSegment = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          is_dynamic: true,
          rules: [
            {
              match: "all",
              conditions: [{ field: "role", op: "eq", value: "angler" }],
            },
          ],
        }),
      });
      if (res.ok) {
        setNewName("");
        setShowCreate(false);
        load();
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteSegment = async (id: string) => {
    const res = await fetch(`/api/admin/segments/${id}`, { method: "DELETE" });
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete segment");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Audience segments for targeting campaigns.
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-md bg-river/10 px-3 py-2 text-xs font-medium text-river hover:bg-river/20"
        >
          <Plus className="size-3.5" />
          New Segment
        </button>
      </div>

      {showCreate && (
        <div className="flex items-center gap-2 rounded-lg border border-river/20 bg-river/5 p-3">
          <Search className="size-4 text-river" />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Segment name (e.g. Active Anglers, New Signups)..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-light focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && createSegment()}
          />
          <button
            onClick={createSegment}
            disabled={creating || !newName.trim()}
            className="rounded-md bg-river px-3 py-1.5 text-xs font-medium text-white hover:bg-river/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      ) : segments.length === 0 ? (
        <div className="rounded-lg border border-stone-light/20 p-8 text-center">
          <Users className="mx-auto size-8 text-stone" />
          <p className="mt-2 text-sm text-text-secondary">
            No segments defined
          </p>
          <p className="mt-1 text-xs text-text-light">
            Create segments to target specific audiences with&nbsp;campaigns.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {segments.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-lg border border-stone-light/20 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {s.name}
                </p>
                {s.description && (
                  <p className="mt-0.5 truncate text-xs text-text-light">
                    {s.description}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-text-light">
                  Created {new Date(s.created_at).toLocaleDateString()}
                  {s.cached_at &&
                    ` · Updated ${new Date(s.cached_at).toLocaleDateString()}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="flex items-center gap-1 rounded-full bg-river/10 px-2.5 py-0.5 text-xs font-medium text-river">
                  <Users className="size-3" />
                  {s.cached_count?.toLocaleString() ?? "—"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    s.is_dynamic
                      ? "bg-forest/10 text-forest"
                      : "bg-stone/10 text-stone"
                  }`}
                >
                  {s.is_dynamic ? "Dynamic" : "Static"}
                </span>
                <button
                  onClick={() => {
                    if (confirm("Delete this segment?")) {
                      deleteSegment(s.id);
                    }
                  }}
                  className="rounded p-1 text-stone hover:text-red-500"
                  aria-label="Delete segment"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
