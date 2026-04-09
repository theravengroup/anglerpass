"use client";

import type { CampaignStatus } from "@/lib/crm/types";

const STATUS_STYLES: Record<CampaignStatus, { label: string; bg: string; text: string }> = {
  draft: { label: "Draft", bg: "bg-stone/10", text: "text-stone" },
  active: { label: "Active", bg: "bg-forest/10", text: "text-forest" },
  paused: { label: "Paused", bg: "bg-amber-50", text: "text-amber-700" },
  completed: { label: "Completed", bg: "bg-river/10", text: "text-river" },
  archived: { label: "Archived", bg: "bg-charcoal/10", text: "text-charcoal" },
};

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
}

export default function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
