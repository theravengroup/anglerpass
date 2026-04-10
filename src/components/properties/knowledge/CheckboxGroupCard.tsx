"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CheckboxGroupCardProps {
  title: string;
  hint: string;
  items: readonly string[];
  labels: Record<string, string>;
  selectedItems: string[];
  onToggle: (field: string, value: string) => void;
  fieldPath: string;
  columns?: string;
}

export default function CheckboxGroupCard({
  title,
  hint,
  items,
  labels,
  selectedItems,
  onToggle,
  fieldPath,
  columns = "grid-cols-2",
}: CheckboxGroupCardProps) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-text-light">{hint}</p>
        <div className={`grid gap-2 ${columns}`}>
          {items.map((item) => {
            const selected = selectedItems.includes(item);
            return (
              <label
                key={item}
                className="flex items-center gap-2 rounded-md border border-stone-light/30 px-3 py-2 text-sm cursor-pointer hover:bg-sand/30"
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggle(fieldPath, item)}
                  className="accent-forest"
                />
                {labels[item]}
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
