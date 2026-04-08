"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import KnowledgeWizard from "@/components/properties/knowledge/KnowledgeWizard";

interface PropertyBasic {
  id: string;
  name: string;
  species: string[] | null;
}

export default function ClubKnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!res.ok) throw new Error("Failed to load property");
        const { property: p } = await res.json();
        setProperty(p);
      } catch {
        setError("Could not load property. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest/30 border-t-forest" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="py-16 text-center">
        <p className="text-text-secondary" role="alert" aria-live="polite">
          {error ?? "Property not found"}
        </p>
      </div>
    );
  }

  return (
    <KnowledgeWizard
      propertyId={id}
      propertyName={property.name}
      backHref={`/club/properties`}
      existingSpecies={property.species ?? undefined}
    />
  );
}
