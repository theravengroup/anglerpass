"use client";

import { Monitor, Smartphone } from "lucide-react";

interface EmailPreviewTabProps {
  subject: string;
  htmlBody: string;
  fromName: string;
  viewport: "desktop" | "mobile";
  onViewportChange: (v: "desktop" | "mobile") => void;
}

export default function EmailPreviewTab({
  subject,
  htmlBody,
  fromName,
  viewport,
  onViewportChange,
}: EmailPreviewTabProps) {
  return (
    <div className="space-y-3">
      {/* Viewport toggle */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-md border border-stone-light/30">
          <button
            onClick={() => onViewportChange("desktop")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs ${
              viewport === "desktop"
                ? "bg-forest text-white"
                : "text-text-secondary hover:bg-offwhite"
            }`}
          >
            <Monitor className="size-3" />
            Desktop
          </button>
          <button
            onClick={() => onViewportChange("mobile")}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs ${
              viewport === "mobile"
                ? "bg-forest text-white"
                : "text-text-secondary hover:bg-offwhite"
            }`}
          >
            <Smartphone className="size-3" />
            Mobile
          </button>
        </div>
      </div>

      {/* Email header preview */}
      <div className="rounded-md border border-stone-light/20 bg-offwhite/50 p-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex size-8 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">
            {fromName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-primary">{fromName}</p>
            <p className="truncate font-medium text-text-primary">
              {subject || "(No subject)"}
            </p>
          </div>
        </div>
      </div>

      {/* Email body preview */}
      <div
        className={`mx-auto overflow-hidden rounded-md border border-stone-light/20 ${
          viewport === "mobile" ? "max-w-[375px]" : "max-w-full"
        }`}
      >
        <div className="max-h-[400px] overflow-y-auto bg-white p-4">
          {htmlBody ? (
            <div
              className="text-sm text-text-primary"
              dangerouslySetInnerHTML={{ __html: htmlBody }}
            />
          ) : (
            <p className="py-8 text-center text-sm text-text-light">
              No email content yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
