"use client";

import { useState, useMemo } from "react";
import { Monitor, Shield, CheckCircle2 } from "lucide-react";
import {
  analyzeSpamScore,
  runPreflightChecklist,
} from "@/lib/crm/spam-scorer";
import EmailPreviewTab from "./EmailPreviewTab";
import EmailSpamTab, { SpamScoreBadge } from "./EmailSpamTab";
import EmailChecklistTab from "./EmailChecklistTab";

interface EmailQualityPanelProps {
  subject: string;
  htmlBody: string;
  fromName: string;
  fromEmail: string;
}

/**
 * Email quality panel shown in the campaign editor.
 * Contains: rendering preview (desktop/mobile), spam score, preflight checklist.
 */
export default function EmailQualityPanel({
  subject,
  htmlBody,
  fromName,
  fromEmail,
}: EmailQualityPanelProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "spam" | "checklist">(
    "preview"
  );
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  const spamResult = useMemo(
    () => analyzeSpamScore({ subject, htmlBody, fromName, fromEmail }),
    [subject, htmlBody, fromName, fromEmail]
  );

  const preflightChecks = useMemo(
    () =>
      runPreflightChecklist({ subject, htmlBody, fromName, fromEmail }),
    [subject, htmlBody, fromName, fromEmail]
  );

  const passedCount = preflightChecks.filter((c) => c.passed).length;
  const errorCount = preflightChecks.filter(
    (c) => !c.passed && c.severity === "error"
  ).length;

  return (
    <div className="rounded-lg border border-stone-light/20 bg-white">
      {/* Tab bar */}
      <div className="flex border-b border-stone-light/20">
        <TabButton
          active={activeTab === "preview"}
          onClick={() => setActiveTab("preview")}
          icon={<Monitor className="size-3.5" />}
          label="Preview"
        />
        <TabButton
          active={activeTab === "spam"}
          onClick={() => setActiveTab("spam")}
          icon={<Shield className="size-3.5" />}
          label="Spam Score"
          badge={
            <SpamScoreBadge score={spamResult.score} rating={spamResult.rating} />
          }
        />
        <TabButton
          active={activeTab === "checklist"}
          onClick={() => setActiveTab("checklist")}
          icon={<CheckCircle2 className="size-3.5" />}
          label="Checklist"
          badge={
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                errorCount > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-forest/10 text-forest"
              }`}
            >
              {passedCount}/{preflightChecks.length}
            </span>
          }
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "preview" && (
          <EmailPreviewTab
            subject={subject}
            htmlBody={htmlBody}
            fromName={fromName}
            viewport={viewport}
            onViewportChange={setViewport}
          />
        )}
        {activeTab === "spam" && <EmailSpamTab result={spamResult} />}
        {activeTab === "checklist" && (
          <EmailChecklistTab checks={preflightChecks} />
        )}
      </div>
    </div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
        active
          ? "border-b-2 border-forest text-forest"
          : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {icon}
      {label}
      {badge}
    </button>
  );
}
