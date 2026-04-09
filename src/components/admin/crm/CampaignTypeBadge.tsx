"use client";

import { Radio, Repeat, Zap } from "lucide-react";
import type { CampaignType } from "@/lib/crm/types";

const TYPE_META: Record<CampaignType, { label: string; icon: typeof Radio; color: string }> = {
  broadcast: { label: "Broadcast", icon: Radio, color: "text-river" },
  drip: { label: "Drip", icon: Repeat, color: "text-forest" },
  triggered: { label: "Triggered", icon: Zap, color: "text-bronze" },
};

interface CampaignTypeBadgeProps {
  type: CampaignType;
}

export default function CampaignTypeBadge({ type }: CampaignTypeBadgeProps) {
  const meta = TYPE_META[type] ?? TYPE_META.broadcast;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.color}`}>
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  );
}
