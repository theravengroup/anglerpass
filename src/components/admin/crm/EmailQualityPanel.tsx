"use client";

import { useState, useMemo } from "react";
import {
  Monitor,
  Smartphone,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  analyzeSpamScore,
  runPreflightChecklist,
  type SpamCheckResult,
  type PreflightCheck,
} from "@/lib/crm/spam-scorer";

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
          <PreviewTab
            subject={subject}
            htmlBody={htmlBody}
            fromName={fromName}
            viewport={viewport}
            onViewportChange={setViewport}
          />
        )}
        {activeTab === "spam" && <SpamTab result={spamResult} />}
        {activeTab === "checklist" && (
          <ChecklistTab checks={preflightChecks} />
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

// ─── Preview Tab ─────────────────────────────────────────────────

function PreviewTab({
  subject,
  htmlBody,
  fromName,
  viewport,
  onViewportChange,
}: {
  subject: string;
  htmlBody: string;
  fromName: string;
  viewport: "desktop" | "mobile";
  onViewportChange: (v: "desktop" | "mobile") => void;
}) {
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

// ─── Spam Score Tab ──────────────────────────────────────────────

function SpamTab({ result }: { result: SpamCheckResult }) {
  const [expanded, setExpanded] = useState(true);

  const scoreColor =
    result.rating === "excellent"
      ? "text-forest"
      : result.rating === "good"
        ? "text-forest"
        : result.rating === "warning"
          ? "text-amber-600"
          : "text-red-600";

  const scoreBg =
    result.rating === "excellent"
      ? "bg-forest/10"
      : result.rating === "good"
        ? "bg-forest/10"
        : result.rating === "warning"
          ? "bg-amber-50"
          : "bg-red-50";

  return (
    <div className="space-y-4">
      {/* Score display */}
      <div className={`rounded-lg ${scoreBg} p-4 text-center`}>
        <p className={`text-3xl font-bold ${scoreColor}`}>{result.score}</p>
        <p className="text-xs text-text-secondary">out of 10</p>
        <p className={`mt-1 text-sm font-medium capitalize ${scoreColor}`}>
          {result.rating}
        </p>
      </div>

      {/* Score bar */}
      <div className="h-2 rounded-full bg-stone-light/20">
        <div
          className={`h-full rounded-full transition-all ${
            result.score <= 1
              ? "bg-forest"
              : result.score <= 3
                ? "bg-forest"
                : result.score <= 6
                  ? "bg-amber-400"
                  : "bg-red-500"
          }`}
          /* dynamic width based on score */
          aria-label={`Spam score ${result.score} out of 10`}
          role="progressbar"
          aria-valuenow={result.score}
          aria-valuemin={0}
          aria-valuemax={10}
        >
          <div className={`h-full rounded-full ${
            result.score <= 3 ? "bg-forest" : result.score <= 6 ? "bg-amber-400" : "bg-red-500"
          }`} aria-hidden="true"
          />
        </div>
      </div>

      {/* Issues */}
      {result.issues.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between text-xs font-semibold text-text-secondary"
          >
            {result.issues.length} issue{result.issues.length !== 1 ? "s" : ""}{" "}
            found
            {expanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              {result.issues.map((issue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-stone-light/20 p-2"
                >
                  {issue.severity === "high" ? (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  ) : issue.severity === "medium" ? (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-stone" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-primary">{issue.message}</p>
                    <p className="text-[10px] text-text-light">
                      {issue.category} · +{issue.points} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-secondary">
            Suggestions
          </p>
          {result.suggestions.map((s, i) => (
            <p key={i} className="text-xs text-text-light">
              &bull; {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function SpamScoreBadge({
  score,
  rating,
}: {
  score: number;
  rating: string;
}) {
  const color =
    rating === "excellent" || rating === "good"
      ? "bg-forest/10 text-forest"
      : rating === "warning"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${color}`}>
      {score}
    </span>
  );
}

// ─── Checklist Tab ───────────────────────────────────────────────

function ChecklistTab({ checks }: { checks: PreflightCheck[] }) {
  return (
    <div className="space-y-2">
      {checks.map((check, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 rounded-md border p-2.5 ${
            check.passed
              ? "border-forest/20 bg-forest/5"
              : check.severity === "error"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
          }`}
        >
          {check.passed ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" />
          ) : check.severity === "error" ? (
            <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-primary">
              {check.label}
            </p>
            <p className="text-[10px] text-text-light">{check.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
