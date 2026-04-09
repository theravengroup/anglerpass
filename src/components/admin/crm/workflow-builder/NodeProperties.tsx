"use client";

import { Trash2 } from "lucide-react";
import { NODE_ICONS, type WfNode } from "./types";
import type { WorkflowNodeType } from "@/lib/crm/types";
import { TRIGGER_EVENT_LABELS } from "@/lib/crm/types";

interface NodePropertiesProps {
  node: WfNode;
  onUpdate: (config: Record<string, unknown>) => void;
  onUpdateLabel: (label: string) => void;
  onDelete: () => void;
}

/**
 * Right-panel property editor for the selected workflow node.
 */
export default function NodeProperties({
  node,
  onUpdate,
  onUpdateLabel,
  onDelete,
}: NodePropertiesProps) {
  const c = node.config;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{NODE_ICONS[node.type]}</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {node.type.replace("_", " ")}
          </span>
        </div>
        {node.type !== "trigger" && (
          <button
            onClick={onDelete}
            className="rounded p-1 text-stone hover:text-red-500"
            aria-label="Delete node"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {/* Label */}
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Label</label>
        <input
          type="text"
          value={node.label}
          onChange={(e) => onUpdateLabel(e.target.value)}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        />
      </div>

      {/* Type-specific properties */}
      {node.type === "trigger" && (
        <TriggerProps config={c} onUpdate={onUpdate} />
      )}
      {node.type === "send_email" && (
        <SendEmailProps config={c} onUpdate={onUpdate} />
      )}
      {node.type === "send_sms" && (
        <SendSmsProps config={c} onUpdate={onUpdate} />
      )}
      {node.type === "notify" && (
        <NotifyProps config={c} onUpdate={onUpdate} />
      )}
      {node.type === "delay" && (
        <DelayProps config={c} onUpdate={onUpdate} />
      )}
      {node.type === "condition" && (
        <ConditionProps config={c} onUpdate={onUpdate} />
      )}
      {node.type === "split" && (
        <SplitProps config={c} onUpdate={onUpdate} />
      )}
    </div>
  );
}

// ─── Trigger Properties ────────────────────────────────────────────

function TriggerProps({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-secondary">
        Trigger Event
      </label>
      <select
        value={(config.event as string) ?? ""}
        onChange={(e) => onUpdate({ ...config, event: e.target.value || null })}
        className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
      >
        <option value="">Select event...</option>
        {Object.entries(TRIGGER_EVENT_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Send Email Properties ─────────────────────────────────────────

function SendEmailProps({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Subject</label>
        <input
          type="text"
          value={(config.subject as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, subject: e.target.value })}
          placeholder="Email subject line..."
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Email Body (HTML)
        </label>
        <textarea
          value={(config.html_body as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, html_body: e.target.value })}
          rows={6}
          placeholder="<p>Hi {{ user.name }},</p>"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-light"
        />
        <p className="mt-1 text-[10px] text-text-light">
          Supports Liquid templates: {"{{ user.name }}"}, {"{% if %}"}, etc.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          From Name
        </label>
        <input
          type="text"
          value={(config.from_name as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, from_name: e.target.value })}
          placeholder="AnglerPass"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
    </div>
  );
}

// ─── Send SMS Properties ──────────────────────────────────────────

function SendSmsProps({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Message
        </label>
        <textarea
          value={(config.message as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, message: e.target.value })}
          rows={4}
          placeholder="Hi {{ user.name }}, your booking is confirmed!"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
        <p className="mt-1 text-[10px] text-text-light">
          Max 1600 chars. Supports Liquid templates.
        </p>
      </div>
      <div className="rounded-md bg-amber-50 p-2">
        <p className="text-[10px] text-amber-700">
          SMS requires user to have a phone number and SMS&nbsp;opt-in enabled.
        </p>
      </div>
    </div>
  );
}

// ─── Notify (In-App) Properties ───────────────────────────────────

function NotifyProps({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Title</label>
        <input
          type="text"
          value={(config.title as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, title: e.target.value })}
          placeholder="Welcome to AnglerPass!"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Body (optional)
        </label>
        <textarea
          value={(config.body as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, body: e.target.value })}
          rows={3}
          placeholder="Here's how to get started..."
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Action URL (optional)
        </label>
        <input
          type="text"
          value={(config.action_url as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, action_url: e.target.value })}
          placeholder="/dashboard or https://..."
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Category
        </label>
        <select
          value={(config.category as string) ?? "workflow"}
          onChange={(e) => onUpdate({ ...config, category: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="general">General</option>
          <option value="marketing">Marketing</option>
          <option value="booking">Booking</option>
          <option value="system">System</option>
          <option value="workflow">Workflow</option>
        </select>
      </div>
    </div>
  );
}

// ─── Delay Properties ──────────────────────────────────────────────

function DelayProps({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <label className="mb-1 block text-xs text-text-secondary">
          Duration
        </label>
        <input
          type="number"
          value={(config.duration as number) ?? 1}
          onChange={(e) =>
            onUpdate({ ...config, duration: Math.max(1, Number(e.target.value)) })
          }
          min={1}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-xs text-text-secondary">Unit</label>
        <select
          value={(config.unit as string) ?? "days"}
          onChange={(e) => onUpdate({ ...config, unit: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="minutes">Minutes</option>
          <option value="hours">Hours</option>
          <option value="days">Days</option>
        </select>
      </div>
    </div>
  );
}

// ─── Condition Properties ──────────────────────────────────────────

function ConditionProps({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Field</label>
        <select
          value={(config.field as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, field: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="">Select field...</option>
          <option value="user.role">User Role</option>
          <option value="user.has_booking">Has Booking</option>
          <option value="user.booking_count">Booking Count</option>
          <option value="engagement.opened_last_email">Opened Last Email</option>
          <option value="engagement.clicked_last_email">Clicked Last Email</option>
          <option value="user.days_since_signup">Days Since Signup</option>
          <option value="user.club_member">Is Club Member</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">
          Operator
        </label>
        <select
          value={(config.operator as string) ?? "eq"}
          onChange={(e) => onUpdate({ ...config, operator: e.target.value })}
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary"
        >
          <option value="eq">Equals</option>
          <option value="neq">Not Equals</option>
          <option value="gt">Greater Than</option>
          <option value="lt">Less Than</option>
          <option value="contains">Contains</option>
          <option value="exists">Exists</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs text-text-secondary">Value</label>
        <input
          type="text"
          value={(config.value as string) ?? ""}
          onChange={(e) => onUpdate({ ...config, value: e.target.value })}
          placeholder="e.g. angler, true, 5"
          className="w-full rounded-md border border-stone-light/30 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-light"
        />
      </div>
      <p className="text-[10px] text-text-light">
        &ldquo;Yes&rdquo; path when condition matches, &ldquo;No&rdquo; path&nbsp;otherwise.
      </p>
    </div>
  );
}

// ─── Split Properties ──────────────────────────────────────────────

function SplitProps({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (c: Record<string, unknown>) => void;
}) {
  const pct = (config.split_percent as number) ?? 50;

  return (
    <div>
      <label className="mb-1 block text-xs text-text-secondary">
        Split Percentage
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={10}
          max={90}
          step={5}
          value={pct}
          onChange={(e) =>
            onUpdate({ ...config, split_percent: Number(e.target.value) })
          }
          className="flex-1"
        />
        <span className="w-20 text-xs text-text-primary">
          A:{pct}% B:{100 - pct}%
        </span>
      </div>
    </div>
  );
}
