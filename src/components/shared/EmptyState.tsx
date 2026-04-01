import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Optional accent color class for the icon (e.g. "text-bronze", "text-forest"). Defaults to "text-text-light". */
  iconColor?: string;
  /** Whether to show the icon inside a rounded background circle. Defaults to false. */
  iconBackground?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  iconColor = "text-text-light",
  iconBackground = false,
}: EmptyStateProps) {
  return (
    <Card className="border-stone-light/20">
      <CardContent className="flex flex-col items-center justify-center py-16">
        {iconBackground ? (
          <div className="flex size-14 items-center justify-center rounded-full bg-current/10">
            <Icon className={`size-6 ${iconColor}`} />
          </div>
        ) : (
          <Icon className={`size-8 ${iconColor}`} />
        )}
        <h3 className="mt-4 text-base font-medium text-text-primary">
          {title}
        </h3>
        {description && (
          <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
            {description}
          </p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </CardContent>
    </Card>
  );
}
