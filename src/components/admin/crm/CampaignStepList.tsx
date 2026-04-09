"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import CampaignStepCard from "@/components/admin/crm/CampaignStepCard";
import type { StepRow } from "@/types/campaign";

interface CampaignStepListProps {
  steps: StepRow[];
  campaignId: string;
  editable: boolean;
  onUpdated: () => void;
  /** Show the EmailQualityPanel inside step editing (CRM version only) */
  showQualityPanel?: boolean;
}

export default function CampaignStepList({
  steps,
  campaignId,
  editable,
  onUpdated,
  showQualityPanel = false,
}: CampaignStepListProps) {
  return (
    <div className="rounded-lg border border-stone-light/20 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">
          Email Steps ({steps.length})
        </h3>
        {editable && (
          <AddStepButton
            campaignId={campaignId}
            nextOrder={steps.length + 1}
            onAdded={onUpdated}
          />
        )}
      </div>

      {steps.length === 0 ? (
        <p className="py-4 text-center text-xs text-text-light">
          No steps yet. Add your first email step to&nbsp;get&nbsp;started.
        </p>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => (
            <CampaignStepCard
              key={step.id}
              step={step}
              campaignId={campaignId}
              editable={editable}
              onUpdated={onUpdated}
              showQualityPanel={showQualityPanel}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Step Button (private to this file) ────────────────────────

function AddStepButton({
  campaignId,
  nextOrder,
  onAdded,
}: {
  campaignId: string;
  nextOrder: number;
  onAdded: () => void;
}) {
  const [adding, setAdding] = useState(false);

  const addStep = async () => {
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step_order: nextOrder,
          subject: `Email Step ${nextOrder}`,
          html_body: "<p>Write your email content here...</p>",
          delay_minutes: nextOrder === 1 ? 0 : 1440,
        }),
      });
      if (res.ok) {
        onAdded();
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <button
      onClick={addStep}
      disabled={adding}
      className="flex items-center gap-1.5 rounded-md bg-charcoal/10 px-3 py-1.5 text-xs font-medium text-charcoal hover:bg-charcoal/20 disabled:opacity-50"
    >
      {adding ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Plus className="size-3.5" />
      )}
      Add Step
    </button>
  );
}
