"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save, Send } from "lucide-react";

interface PropertyFormActionsProps {
  saving: boolean;
  submitting: boolean;
  disabled: boolean;
  canSubmitForReview: boolean;
  statusLabel: string;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSubmitForReview: () => void;
}

export default function PropertyFormActions({
  saving,
  submitting,
  disabled,
  canSubmitForReview,
  statusLabel,
  onCancel,
  onSaveDraft,
  onSubmitForReview,
}: PropertyFormActionsProps) {
  return (
    <div className="flex items-center justify-between border-t border-stone-light/20 pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={disabled}
      >
        Cancel
      </Button>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSaveDraft}
          disabled={disabled}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Draft
        </Button>

        {canSubmitForReview && (
          <Button
            type="button"
            className="bg-forest text-white hover:bg-forest/90"
            onClick={onSubmitForReview}
            disabled={disabled}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {statusLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
