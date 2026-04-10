import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { PreflightCheck } from "@/lib/crm/spam-scorer";

export default function EmailChecklistTab({
  checks,
}: {
  checks: PreflightCheck[];
}) {
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
