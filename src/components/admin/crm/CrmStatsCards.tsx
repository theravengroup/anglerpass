"use client";

import {
  Mail,
  MousePointerClick,
  Eye,
  AlertTriangle,
  UserX,
  Send,
} from "lucide-react";

interface CrmStatsCardsProps {
  stats: {
    total_sends: number;
    delivered_count: number;
    opened_count: number;
    clicked_count: number;
    bounced_count: number;
    unsubscribed_count?: number;
    open_rate: number;
    click_rate: number;
  };
}

const STAT_ITEMS = [
  { key: "total_sends", label: "Total Sends", icon: Send, color: "text-charcoal" },
  { key: "delivered_count", label: "Delivered", icon: Mail, color: "text-forest" },
  { key: "opened_count", label: "Opened", icon: Eye, color: "text-river" },
  { key: "clicked_count", label: "Clicked", icon: MousePointerClick, color: "text-bronze" },
  { key: "bounced_count", label: "Bounced", icon: AlertTriangle, color: "text-red-600" },
  { key: "unsubscribed_count", label: "Unsubscribed", icon: UserX, color: "text-stone" },
] as const;

export default function CrmStatsCards({ stats }: CrmStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon;
        const value = (stats as Record<string, number>)[item.key] ?? 0;

        return (
          <div
            key={item.key}
            className="rounded-lg border border-stone-light/20 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <Icon className={`size-4 ${item.color}`} />
              <span className="text-xs text-text-secondary">{item.label}</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-text-primary">
              {value.toLocaleString()}
            </p>
          </div>
        );
      })}

      {/* Rate cards */}
      <div className="rounded-lg border border-river/20 bg-river/5 p-3">
        <p className="text-xs text-text-secondary">Open Rate</p>
        <p className="mt-1 text-xl font-semibold text-river">
          {stats.open_rate}%
        </p>
      </div>
      <div className="rounded-lg border border-bronze/20 bg-bronze/5 p-3">
        <p className="text-xs text-text-secondary">Click Rate</p>
        <p className="mt-1 text-xl font-semibold text-bronze">
          {stats.click_rate}%
        </p>
      </div>
    </div>
  );
}
