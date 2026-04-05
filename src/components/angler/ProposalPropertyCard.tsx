"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Droplets, MapPin } from "lucide-react";

interface ProposalPropertyCardProps {
  name: string;
  locationDescription: string | null;
  waterType: string | null;
}

export default function ProposalPropertyCard({
  name,
  locationDescription,
  waterType,
}: ProposalPropertyCardProps) {
  return (
    <Card className="border-stone-light/20">
      <CardContent className="py-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-text-light">
          Property
        </h3>
        <p className="mt-1 text-base font-medium text-text-primary">{name}</p>
        {locationDescription && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-text-secondary">
            <MapPin className="size-3.5 shrink-0" />
            {locationDescription}
          </p>
        )}
        {waterType && (
          <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
            <Droplets className="size-3.5 shrink-0" />
            {waterType}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
