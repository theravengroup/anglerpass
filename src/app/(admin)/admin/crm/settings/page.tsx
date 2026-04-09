"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Tag,
  Clock,
  ToggleLeft,
  ToggleRight,
  Shield,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

// ─── Types ──────────────────────────────────────────────────────────

interface Topic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_required: boolean;
  display_order: number;
}

interface FrequencyCap {
  id: string;
  name: string;
  max_sends: number;
  window_hours: number;
  applies_to: string;
  is_active: boolean;
}

// ─── Page ───────────────────────────────────────────────────────────

export default function CrmSettingsPage() {
  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-8">
        <div>
          <h2 className="font-heading text-xl font-semibold text-text-primary">
            CRM Settings
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage subscription topics, frequency caps, and sending&nbsp;defaults.
          </p>
        </div>

        <TopicManager />
        <FrequencyCapManager />
      </div>
    </AdminPageGuard>
  );
}

// ─── Topic Manager ─────────────────────────────────────────────────

function TopicManager() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDefault, setNewDefault] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDefault, setEditDefault] = useState(true);
  const [editRequired, setEditRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crm/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTopic = async () => {
    if (!newSlug.trim() || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/crm/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: newSlug.trim(),
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          is_default: newDefault,
          display_order: topics.length + 1,
        }),
      });
      if (res.ok) {
        setNewSlug("");
        setNewName("");
        setNewDesc("");
        setNewDefault(true);
        setShowCreate(false);
        load();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to create topic");
      }
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditName(topic.name);
    setEditDesc(topic.description ?? "");
    setEditDefault(topic.is_default);
    setEditRequired(topic.is_required);
  };

  const saveTopic = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/crm/topics/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDesc || null,
          is_default: editDefault,
          is_required: editRequired,
        }),
      });
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const deleteTopic = async (id: string) => {
    if (!confirm("Delete this subscription topic?")) return;
    const res = await fetch(`/api/admin/crm/topics/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      load();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete topic");
    }
  };

  return (
    <div className="rounded-lg border border-stone-light/20 bg-white">
      <div className="flex items-center justify-between border-b border-stone-light/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Tag className="size-4 text-river" />
          <h3 className="text-sm font-semibold text-text-primary">
            Subscription Topics
          </h3>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-md bg-river/10 px-3 py-1.5 text-xs font-medium text-river hover:bg-river/20"
        >
          <Plus className="size-3.5" />
          Add Topic
        </button>
      </div>

      <div className="px-5 py-3">
        <p className="text-xs text-text-light">
          Users can manage their email preferences per topic. Required topics
          (like transactional) cannot be&nbsp;unsubscribed.
        </p>
      </div>

      {showCreate && (
        <div className="mx-5 mb-4 space-y-3 rounded-lg border border-river/20 bg-river/5 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Slug (unique ID)
              </label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) =>
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
                }
                placeholder="e.g. partner_updates"
                className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Display Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Partner Updates"
                className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-text-secondary">
              Description
            </label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description of this email category"
              className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={newDefault}
              onChange={(e) => setNewDefault(e.target.checked)}
              className="rounded border-stone-light/30"
            />
            Subscribe new users by default
          </label>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-md border border-stone-light/30 px-3 py-1.5 text-xs text-text-secondary hover:bg-offwhite"
            >
              Cancel
            </button>
            <button
              onClick={createTopic}
              disabled={creating || !newSlug.trim() || !newName.trim()}
              className="flex items-center gap-1 rounded-md bg-river px-3 py-1.5 text-xs font-medium text-white hover:bg-river/90 disabled:opacity-50"
            >
              {creating && <Loader2 className="size-3 animate-spin" />}
              Create Topic
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-charcoal" />
        </div>
      ) : topics.length === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-text-light">
          No subscription topics defined yet.
        </p>
      ) : (
        <div className="divide-y divide-stone-light/10">
          {topics.map((topic) => (
            <div key={topic.id} className="px-5 py-3">
              {editingId === topic.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-text-secondary">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-text-secondary">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={editDefault}
                        onChange={(e) => setEditDefault(e.target.checked)}
                        className="rounded border-stone-light/30"
                      />
                      Default on
                    </label>
                    <label className="flex items-center gap-2 text-xs text-text-secondary">
                      <input
                        type="checkbox"
                        checked={editRequired}
                        onChange={(e) => setEditRequired(e.target.checked)}
                        className="rounded border-stone-light/30"
                      />
                      Required (cannot unsubscribe)
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-stone-light/30 px-3 py-1.5 text-xs text-text-secondary hover:bg-offwhite"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTopic}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-md bg-charcoal px-3 py-1.5 text-xs font-medium text-white hover:bg-charcoal/90 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="size-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">
                        {topic.name}
                      </p>
                      <span className="rounded-full bg-charcoal/5 px-2 py-0.5 font-mono text-[10px] text-text-light">
                        {topic.slug}
                      </span>
                      {topic.is_required && (
                        <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          <Shield className="size-2.5" />
                          Required
                        </span>
                      )}
                      {topic.is_default && !topic.is_required && (
                        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] text-forest">
                          Default on
                        </span>
                      )}
                    </div>
                    {topic.description && (
                      <p className="mt-0.5 text-xs text-text-light">
                        {topic.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startEdit(topic)}
                      className="rounded p-1.5 text-text-secondary hover:bg-offwhite hover:text-text-primary"
                      aria-label="Edit topic"
                    >
                      <Save className="size-3.5" />
                    </button>
                    {!topic.is_required && (
                      <button
                        onClick={() => deleteTopic(topic.id)}
                        className="rounded p-1.5 text-stone hover:text-red-500"
                        aria-label="Delete topic"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Frequency Cap Manager ─────────────────────────────────────────

function FrequencyCapManager() {
  const [caps, setCaps] = useState<FrequencyCap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState(3);
  const [newWindow, setNewWindow] = useState(168);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crm/frequency-caps");
      if (res.ok) {
        const data = await res.json();
        setCaps(data.caps ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createCap = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/crm/frequency-caps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          max_sends: newMax,
          window_hours: newWindow,
        }),
      });
      if (res.ok) {
        setNewName("");
        setNewMax(3);
        setNewWindow(168);
        setShowCreate(false);
        load();
      }
    } finally {
      setCreating(false);
    }
  };

  const toggleCap = async (cap: FrequencyCap) => {
    await fetch("/api/admin/crm/frequency-caps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cap.id, is_active: !cap.is_active }),
    });
    load();
  };

  const formatWindow = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    if (hours === 24) return "1 day";
    if (hours < 168) return `${Math.round(hours / 24)} days`;
    if (hours === 168) return "1 week";
    return `${Math.round(hours / 168)} weeks`;
  };

  return (
    <div className="rounded-lg border border-stone-light/20 bg-white">
      <div className="flex items-center justify-between border-b border-stone-light/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-bronze" />
          <h3 className="text-sm font-semibold text-text-primary">
            Frequency Caps
          </h3>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-md bg-bronze/10 px-3 py-1.5 text-xs font-medium text-bronze hover:bg-bronze/20"
        >
          <Plus className="size-3.5" />
          Add Cap
        </button>
      </div>

      <div className="px-5 py-3">
        <p className="text-xs text-text-light">
          Limit how many marketing emails a contact receives in a given
          time window. Sends that would exceed a cap are automatically&nbsp;skipped.
        </p>
      </div>

      {showCreate && (
        <div className="mx-5 mb-4 space-y-3 rounded-lg border border-bronze/20 bg-bronze/5 p-4">
          <div>
            <label className="mb-1 block text-xs text-text-secondary">
              Rule Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Monthly Cap"
              className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary placeholder:text-text-light"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Max Sends
              </label>
              <input
                type="number"
                value={newMax}
                onChange={(e) => setNewMax(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-text-secondary">
                Window (hours)
              </label>
              <select
                value={newWindow}
                onChange={(e) => setNewWindow(Number(e.target.value))}
                className="w-full rounded-md border border-stone-light/30 px-3 py-2 text-sm text-text-primary"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>1 day</option>
                <option value={48}>2 days</option>
                <option value={72}>3 days</option>
                <option value={168}>1 week</option>
                <option value={336}>2 weeks</option>
                <option value={720}>1 month</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-md border border-stone-light/30 px-3 py-1.5 text-xs text-text-secondary hover:bg-offwhite"
            >
              Cancel
            </button>
            <button
              onClick={createCap}
              disabled={creating || !newName.trim()}
              className="flex items-center gap-1 rounded-md bg-bronze px-3 py-1.5 text-xs font-medium text-white hover:bg-bronze/90 disabled:opacity-50"
            >
              {creating && <Loader2 className="size-3 animate-spin" />}
              Create Cap
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-charcoal" />
        </div>
      ) : caps.length === 0 ? (
        <p className="px-5 py-6 text-center text-xs text-text-light">
          No frequency caps defined. Emails will be sent without&nbsp;limits.
        </p>
      ) : (
        <div className="divide-y divide-stone-light/10">
          {caps.map((cap) => (
            <div
              key={cap.id}
              className="flex items-center gap-3 px-5 py-3"
            >
              <button
                onClick={() => toggleCap(cap)}
                className="shrink-0"
                aria-label={cap.is_active ? "Disable cap" : "Enable cap"}
              >
                {cap.is_active ? (
                  <ToggleRight className="size-5 text-forest" />
                ) : (
                  <ToggleLeft className="size-5 text-stone" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    cap.is_active ? "text-text-primary" : "text-text-light"
                  }`}
                >
                  {cap.name}
                </p>
                <p className="text-xs text-text-light">
                  Max {cap.max_sends} email{cap.max_sends !== 1 ? "s" : ""} per{" "}
                  {formatWindow(cap.window_hours)}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  cap.is_active
                    ? "bg-forest/10 text-forest"
                    : "bg-stone/10 text-stone"
                }`}
              >
                {cap.is_active ? "Active" : "Disabled"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
