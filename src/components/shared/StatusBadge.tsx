import type { StatusConfig } from "@/lib/constants/status";

interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusConfig>;
  /** Fallback key to use when status is not found in config. Defaults to first entry. */
  fallbackKey?: string;
}

export function StatusBadge({ status, config, fallbackKey }: StatusBadgeProps) {
  const resolved =
    config[status] ??
    (fallbackKey ? config[fallbackKey] : undefined) ??
    Object.values(config)[0];

  if (!resolved) return null;

  const Icon = resolved.icon;

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${resolved.bg} ${resolved.color}`}
    >
      <Icon className="size-3" />
      {resolved.label}
    </span>
  );
}
