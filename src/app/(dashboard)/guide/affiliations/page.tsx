"use client";

import GuideAffiliations from "@/components/guide/GuideAffiliations";

export default function GuideAffiliationsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Club Affiliations
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your affiliations with fishing clubs. Affiliated independent guides can be
          assigned to trips on club waters.
        </p>
      </div>
      <GuideAffiliations />
    </div>
  );
}
