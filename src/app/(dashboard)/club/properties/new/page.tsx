"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PropertyForm from "@/components/properties/PropertyForm";
import { FetchError } from "@/components/shared/FetchError";

export default function ClubNewPropertyPage() {
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function init() {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      if (data.owned?.length) {
        setClubId(data.owned[0].id);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error || !clubId) {
    return (
      <div className="mx-auto max-w-5xl">
        <FetchError
          message="Could not load club information."
          onRetry={init}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Add Property for Landowner
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Create a property listing on behalf of a landowner. Once saved, you can
          invite them to claim ownership and complete their onboarding.
        </p>
      </div>

      <PropertyForm mode="create" clubId={clubId} />
    </div>
  );
}
