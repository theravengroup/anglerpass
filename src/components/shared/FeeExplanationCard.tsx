import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

interface FeeExplanationCardProps {
  label: string;
  children: ReactNode;
}

export default function FeeExplanationCard({
  label,
  children,
}: FeeExplanationCardProps) {
  return (
    <Card className="border-stone-light/20 bg-offwhite/50">
      <CardContent className="py-5">
        <p className="text-xs leading-relaxed text-text-light">
          <strong className="text-text-secondary">{label}</strong> {children}
        </p>
      </CardContent>
    </Card>
  );
}
