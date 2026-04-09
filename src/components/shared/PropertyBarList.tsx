import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface BarListItem {
  name: string;
  value: number;
  /** Text shown on the right side, e.g. "$1,200 · 5 trips" */
  detail: string;
  /** Optional secondary line below the bar */
  subDetail?: ReactNode;
}

interface PropertyBarListProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** Tailwind text color for the icon */
  iconColor?: string;
  items: BarListItem[];
  /** Tailwind bg class for bars, e.g. "bg-bronze" */
  barColor: string;
  emptyMessage: string;
  /** Max items to display (default 8) */
  limit?: number;
}

export default function PropertyBarList({
  title,
  description,
  icon: Icon,
  iconColor,
  items,
  barColor,
  emptyMessage,
  limit = 8,
}: PropertyBarListProps) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className={`size-4 ${iconColor ?? ""}`} />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-light">
            {emptyMessage}
          </p>
        ) : (
          items.slice(0, limit).map((item) => {
            const pct =
              maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-text-primary">
                    {item.name}
                  </span>
                  <span className="text-text-secondary">{item.detail}</span>
                </div>
                {/* Dynamic width requires inline style -- percentage computed from data */}
                <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                  <div
                    className={`h-full rounded-full ${barColor} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {item.subDetail && (
                  <div className="flex justify-between text-xs text-text-light">
                    {item.subDetail}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
