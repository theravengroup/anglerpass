"use client";

import { ArrowLeft, Loader2, Play, Pause, Send } from "lucide-react";
import CampaignStatusBadge from "@/components/admin/crm/CampaignStatusBadge";
import CampaignTypeBadge from "@/components/admin/crm/CampaignTypeBadge";
import type { CampaignStatus, CampaignType } from "@/lib/crm/types";

interface CampaignHeaderProps {
  name: string;
  status: CampaignStatus;
  type: CampaignType;
  startedAt: string | null;
  hasSteps: boolean;
  isEditable: boolean;
  actionLoading: string | null;
  backLabel?: string;
  onBack: () => void;
  onTestSend: () => void;
  onActivate: () => void;
  onPause: () => void;
  /** Optional extra class for the heading font */
  headingClassName?: string;
}

export default function CampaignHeader({
  name,
  status,
  type,
  startedAt,
  hasSteps,
  isEditable,
  actionLoading,
  backLabel = "All Campaigns",
  onBack,
  onTestSend,
  onActivate,
  onPause,
  headingClassName = "font-heading",
}: CampaignHeaderProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="size-3.5" />
        {backLabel}
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2
              className={`${headingClassName} text-2xl font-semibold text-text-primary`}
            >
              {name}
            </h2>
            <CampaignStatusBadge status={status} />
            <CampaignTypeBadge type={type} />
          </div>
          {startedAt && (
            <p className="mt-1 text-xs text-text-light">
              Started {new Date(startedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasSteps && (
            <button
              onClick={onTestSend}
              disabled={actionLoading === "test"}
              className="flex items-center gap-1.5 rounded-md border border-stone-light/30 px-3 py-2 text-xs font-medium text-text-secondary hover:bg-offwhite disabled:opacity-50"
            >
              <Send className="size-3.5" />
              Test Send
            </button>
          )}

          {isEditable && (
            <button
              onClick={onActivate}
              disabled={actionLoading === "activate"}
              className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-2 text-xs font-medium text-white hover:bg-forest-deep disabled:opacity-50"
            >
              {actionLoading === "activate" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Activate
            </button>
          )}

          {status === "active" && (
            <button
              onClick={onPause}
              disabled={actionLoading === "pause"}
              className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {actionLoading === "pause" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Pause className="size-3.5" />
              )}
              Pause
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
