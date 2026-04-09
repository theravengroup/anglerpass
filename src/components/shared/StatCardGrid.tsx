import type { LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export interface StatCardItem {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind text color class, e.g. "text-bronze" */
  color: string;
  /** Tailwind bg class, e.g. "bg-bronze/10" */
  bg: string;
}

interface StatCardGridProps {
  stats: StatCardItem[];
}

export default function StatCardGrid({ stats }: StatCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-stone-light/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-text-secondary">
                {stat.label}
              </CardDescription>
              <div
                className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`size-[18px] ${stat.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-text-primary">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-text-light">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
