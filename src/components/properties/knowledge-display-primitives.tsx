"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="font-[family-name:var(--font-heading)] text-lg">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {children}
        </dl>
      </CardContent>
    </Card>
  );
}

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <dt className="text-xs font-medium text-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-sm text-text-primary">{children}</dd>
    </div>
  );
}

export function NotProvided() {
  return <span className="text-text-light italic">Not provided</span>;
}

export function FieldValue({ value }: { value: string }) {
  return value === "Not provided" ? <NotProvided /> : <>{value}</>;
}

/**
 * Safely access a nested key from an unknown object.
 */
export function get(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object") return (obj as Record<string, unknown>)[key];
  return undefined;
}
