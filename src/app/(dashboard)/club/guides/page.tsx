"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import ClubGuideAffiliations from "@/components/clubs/ClubGuideAffiliations";

export default function ClubGuidesPage() {
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/clubs/onboarding-status");
        if (res.ok) {
          const data = await res.json();
          if (data.club?.id) {
            setClubId(data.club.id);
          }
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
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (!clubId) {
    return (
      <div className="mx-auto max-w-5xl py-24 text-center">
        <p className="text-sm text-text-secondary">
          Set up your club first to manage independent guide affiliations.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Independent Guide Affiliations
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review and manage independent guide affiliation requests for your club.
        </p>
      </div>
      <ClubGuideAffiliations clubId={clubId} />
    </div>
  );
}
