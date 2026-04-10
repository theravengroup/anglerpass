"use client";

import { Trash2 } from "lucide-react";
import { NODE_ICONS, type WfNode } from "./types";
import {
  TriggerProps,
  SendEmailProps,
  SendSmsProps,
  NotifyProps,
  DelayProps,
  ConditionProps,
  SplitProps,
} from "./node-props";

interface NodePropertiesProps {
  node: WfNode;
  onUpdate: (config: Record<string, unknown>) => void;
  onUpdateLabel: (label: string) => void;
  onDelete: () => void;
}

/**
 * Right-panel property editor for the selected workflow node.
 * Renders the shared label field, then delegates to a node-type-specific
 * property panel from ./node-props/.
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
