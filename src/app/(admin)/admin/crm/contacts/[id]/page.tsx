"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MousePointerClick,
  TrendingUp,
  Tag,
  Plus,
  X,
  Phone,
  Clock,
  Bell,
  GitBranch,
  DollarSign,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";

interface ContactDetail {
  contact: {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    phone_number: string | null;
    sms_opt_in: boolean;
    created_at: string;
  };
  email_stats: {
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
    total_unsubscribed: number;
  };
  tags: string[];
  conversions: {
    items: Array<{
      id: string;
      event_name: string;
      event_category: string;
      value_cents: number;
      created_at: string;
    }>;
    total_value_cents: number;
    total_count: number;
  };
  timeline: Array<{
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    source_type: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [data, setData] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/contacts/${contactId}`);
      if (!res.ok) {
        router.push("/admin/crm/contacts");
        return;
      }
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [contactId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const addTag = async () => {
    if (!newTag.trim()) return;
    await fetch(`/api/admin/crm/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ add_tags: [newTag.trim()] }),
    });
    setNewTag("");
    load();
  };

  const removeTag = async (tag: string) => {
    await fetch(`/api/admin/crm/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remove_tags: [tag] }),
    });
    load();
  };

  if (loading) {
    return (
      <AdminPageGuard path="/admin/crm">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      </AdminPageGuard>
    );
  }

  if (!data) return null;

  const { contact, email_stats, tags, conversions, timeline } = data;
  const openRate =
    email_stats.total_sent > 0
      ? ((email_stats.total_opened / email_stats.total_sent) * 100).toFixed(1)
      : "0";
  const clickRate =
    email_stats.total_sent > 0
      ? ((email_stats.total_clicked / email_stats.total_sent) * 100).toFixed(1)
      : "0";

  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/admin/crm/contacts")}
            className="mb-3 flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="size-3.5" />
            All Contacts
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-2xl font-semibold text-text-primary">
                {contact.display_name || contact.email}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                <span>{contact.email}</span>
                {contact.phone_number && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {contact.phone_number}
                    {contact.sms_opt_in && (
                      <span className="rounded bg-forest/10 px-1 text-[9px] font-medium text-forest">
                        SMS
                      </span>
                    )}
                  </span>
                )}
                <span className="capitalize">{contact.role}</span>
                <span>
                  Joined {new Date(contact.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Mail className="size-4 text-forest" />}
            label="Emails Sent"
            value={email_stats.total_sent}
          />
          <StatCard
            icon={<MousePointerClick className="size-4 text-river" />}
            label="Open Rate"
            value={`${openRate}%`}
            sub={`${email_stats.total_opened} opens`}
          />
          <StatCard
            icon={<TrendingUp className="size-4 text-bronze" />}
            label="Click Rate"
            value={`${clickRate}%`}
            sub={`${email_stats.total_clicked} clicks`}
          />
          <StatCard
            icon={<DollarSign className="size-4 text-forest" />}
            label="Conversions"
            value={conversions.total_count}
            sub={
              conversions.total_value_cents > 0
                ? `$${(conversions.total_value_cents / 100).toFixed(2)}`
                : undefined
            }
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Timeline */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">
              Activity Timeline
            </h3>
            {timeline.length === 0 ? (
              <div className="rounded-lg border border-stone-light/20 p-6 text-center">
                <Clock className="mx-auto size-6 text-stone" />
                <p className="mt-2 text-xs text-text-secondary">
                  No activity recorded yet
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {timeline.map((event, i) => (
                  <TimelineEvent key={event.id} event={event} isLast={i === timeline.length - 1} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Tags + Conversions */}
          <div className="space-y-6">
            {/* Tags */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-text-primary">
                Tags
              </h3>
              <div className="rounded-lg border border-stone-light/20 bg-white p-3">
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest"
                    >
                      <Tag className="size-2.5" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-forest/20"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-xs text-text-light">No tags yet</p>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 rounded-md border border-stone-light/30 px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-light"
                  />
                  <button
                    onClick={addTag}
                    disabled={!newTag.trim()}
                    className="rounded-md bg-forest px-2.5 py-1.5 text-xs font-medium text-white hover:bg-forest-deep disabled:opacity-50"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Conversions */}
            {conversions.items.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-text-primary">
                  Recent Conversions
                </h3>
                <div className="space-y-2">
                  {conversions.items.slice(0, 5).map((conv) => (
                    <div
                      key={conv.id}
                      className="rounded-lg border border-stone-light/20 bg-white p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-text-primary">
                          {conv.event_name}
                        </p>
                        {conv.value_cents > 0 && (
                          <span className="text-xs font-semibold text-forest">
                            ${(conv.value_cents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-text-light">
                        {conv.event_category} &middot;{" "}
                        {new Date(conv.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPageGuard>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-light/20 bg-white p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-[10px] text-text-light">{sub}</p>}
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  email_sent: <Mail className="size-3.5 text-forest" />,
  email_opened: <Mail className="size-3.5 text-river" />,
  email_clicked: <MousePointerClick className="size-3.5 text-bronze" />,
  email_bounced: <Mail className="size-3.5 text-red-500" />,
  sms_sent: <Phone className="size-3.5 text-forest" />,
  notification_sent: <Bell className="size-3.5 text-bronze" />,
  workflow_enrolled: <GitBranch className="size-3.5 text-river" />,
  workflow_completed: <GitBranch className="size-3.5 text-forest" />,
  conversion: <TrendingUp className="size-3.5 text-forest" />,
  tag_added: <Tag className="size-3.5 text-charcoal" />,
  signup: <Plus className="size-3.5 text-forest" />,
};

function TimelineEvent({
  event,
  isLast,
}: {
  event: {
    id: string;
    activity_type: string;
    title: string;
    description: string | null;
    created_at: string;
  };
  isLast: boolean;
}) {
  const icon = ACTIVITY_ICONS[event.activity_type] ?? (
    <Clock className="size-3.5 text-stone" />
  );

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-stone-light/30 bg-white">
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-stone-light/30" />}
      </div>
      <div className={`pb-4 ${isLast ? "" : ""}`}>
        <p className="text-xs font-medium text-text-primary">{event.title}</p>
        {event.description && (
          <p className="mt-0.5 text-[10px] text-text-secondary">
            {event.description}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-text-light">
          {formatTimeAgo(new Date(event.created_at))}
        </p>
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}
