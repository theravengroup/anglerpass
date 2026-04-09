import type { WorkflowNodeType } from "@/lib/crm/types";

/** Client-side node representation */
export interface WfNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
  x: number;
  y: number;
}

/** Client-side edge representation */
export interface WfEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceHandle: string;
}

/** Palette item definition */
export interface NodePaletteItem {
  type: WorkflowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const NODE_PALETTE: NodePaletteItem[] = [
  {
    type: "send_email",
    label: "Send Email",
    description: "Send an email to the contact",
    icon: "✉",
    color: "text-forest bg-forest/10",
  },
  {
    type: "send_sms",
    label: "Send SMS",
    description: "Send a text message",
    icon: "📱",
    color: "text-forest-deep bg-forest/10",
  },
  {
    type: "notify",
    label: "In-App Notify",
    description: "Push an in-app notification",
    icon: "🔔",
    color: "text-bronze bg-bronze/10",
  },
  {
    type: "delay",
    label: "Delay",
    description: "Wait a specified duration",
    icon: "⏱",
    color: "text-bronze bg-bronze/10",
  },
  {
    type: "condition",
    label: "If / Else",
    description: "Branch based on a condition",
    icon: "⑂",
    color: "text-river bg-river/10",
  },
  {
    type: "split",
    label: "A/B Split",
    description: "Random percentage split",
    icon: "%",
    color: "text-charcoal bg-charcoal/10",
  },
  {
    type: "end",
    label: "End",
    description: "Exit the workflow",
    icon: "◼",
    color: "text-red-500 bg-red-50",
  },
];

export const NODE_COLORS: Record<WorkflowNodeType, string> = {
  trigger: "border-amber-400 bg-amber-50",
  send_email: "border-forest bg-forest/5",
  send_sms: "border-forest-deep bg-forest/5",
  notify: "border-bronze bg-bronze/5",
  delay: "border-bronze bg-bronze-light/10",
  condition: "border-river bg-river/5",
  split: "border-charcoal bg-charcoal/5",
  end: "border-red-300 bg-red-50",
};

export const NODE_ICONS: Record<WorkflowNodeType, string> = {
  trigger: "⚡",
  send_email: "✉",
  send_sms: "📱",
  notify: "🔔",
  delay: "⏱",
  condition: "⑂",
  split: "%",
  end: "◼",
};
