"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPAWN_MONTHS, MONTH_LABELS } from "@/lib/constants/property-knowledge";

interface MonthChecklistCardProps {
  title: string;
  hint: string;
  selectedMonths: string[];
  onToggle: (field: string, value: string) => void;
  fieldPath: string;
}

export default function MonthChecklistCard({
  title,
  hint,
  selectedMonths,
  onToggle,
  fieldPath,
}: MonthChecklistCardProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-text-light">{hint}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {SPAWN_MONTHS.map((month) => {
            const selected = selectedMonths.includes(month);
            return (
              <label
                key={month}
                className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(fieldPath, month)}
                  className="accent-forest"
                />
                {MONTH_LABELS[month]}
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
