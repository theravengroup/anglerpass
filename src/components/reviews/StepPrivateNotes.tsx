"use client";

import { Lock } from "lucide-react";

interface StepPrivateNotesProps {
  value: string;
  onChange: (value: string) => void;
}

export default function StepPrivateNotes({
  value,
  onChange,
}: StepPrivateNotesProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Lock className="size-4 text-text-light" />
          <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
            Private Notes
          </h2>
        </div>
        <p className="mt-1 text-sm font-medium text-text-secondary">
          Never shown publicly
        </p>
        <p className="mt-0.5 text-xs text-text-light">
          This goes only to AnglerPass and the property manager.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={5000}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        placeholder={[
          "Access instructions were unclear or incorrect",
          "Gate code issues",
          "Safety concerns",
          "Water conditions didn\u2019t match the listing",
          "Livestock or property conflicts",
          "Other issues you prefer not to post publicly",
        ].join("\n")}
      />

      <p className="text-xs text-text-light italic">
        This field is optional. Skip it if you have nothing to add.
      </p>
    </div>
  );
}
