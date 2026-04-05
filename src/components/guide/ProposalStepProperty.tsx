"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";

interface ApprovedProperty {
  property_id: string;
  property_name: string;
  location_description: string | null;
}

export function ProposalStepProperty({
  selectedPropertyId,
  onSelect,
}: {
  selectedPropertyId: string | null;
  onSelect: (id: string, name: string) => void;
}) {
  const [properties, setProperties] = useState<ApprovedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/guides/water-approvals");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.approvals ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-charcoal" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Card className="border-stone-light/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="size-6 text-text-light" />
          <p className="mt-3 text-sm text-text-secondary">
            No approved waters found. You need water approvals before creating
            proposals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">
        Select the property for this guided trip.
      </p>
      <div className="space-y-2">
        {properties.map((p) => {
          const isSelected = p.property_id === selectedPropertyId;
          return (
            <button
              key={p.property_id}
              type="button"
              onClick={() => onSelect(p.property_id, p.property_name)}
              className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? "border-charcoal bg-charcoal/5"
                  : "border-stone-light/20 hover:border-charcoal/30"
              }`}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-charcoal/10">
                <MapPin className="size-4 text-charcoal" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">
                  {p.property_name}
                </p>
                {p.location_description && (
                  <p className="text-xs text-text-light">
                    {p.location_description}
                  </p>
                )}
              </div>
              {isSelected && (
                <CheckCircle2 className="size-5 shrink-0 text-charcoal" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
