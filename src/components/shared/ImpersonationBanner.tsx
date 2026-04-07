"use client";

import { useState } from "react";
import { Eye, LogOut, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImpersonationContext } from "@/hooks/use-is-impersonating";
import { endImpersonation } from "@/lib/admin/actions/impersonation";

interface ImpersonationBannerProps {
  targetEmail: string;
  targetName: string | null;
  targetRole: string;
  children: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  angler: "Angler",
  landowner: "Landowner",
  club_admin: "Club Admin",
  guide: "Guide",
};

/**
 * Wraps the entire app when an impersonation session is active.
 *
 * Shows a fixed amber banner at the top of the screen and provides
 * the ImpersonationContext so all child components know they're in
 * read-only mode.
 */
export default function ImpersonationBanner({
  targetEmail,
  targetName,
  targetRole,
  children,
}: ImpersonationBannerProps) {
  const [ending, setEnding] = useState(false);

  async function handleEndImpersonation() {
    setEnding(true);
    try {
      await endImpersonation();
    } catch {
      // If redirect fails, reload to clear state
      window.location.href = "/admin/users";
    }
  }

  const displayName = targetName ? `${targetName} (${targetEmail})` : targetEmail;
  const roleLabel = ROLE_LABELS[targetRole] ?? targetRole;

  return (
    <ImpersonationContext value={true}>
      {/* Fixed banner — cannot be dismissed */}
      <div
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-md"
        role="alert"
        aria-live="polite"
      >
        <Eye className="size-4 shrink-0" />
        <span className="truncate">
          <Shield className="mr-1 inline size-3" />
          Viewing as{" "}
          <strong className="font-semibold">{displayName}</strong>{" "}
          <span className="rounded bg-amber-600/20 px-1.5 py-0.5 text-xs font-semibold uppercase">
            {roleLabel}
          </span>{" "}
          <span className="hidden sm:inline text-amber-800">
            — Read-only mode
          </span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEndImpersonation}
          disabled={ending}
          className="ml-2 shrink-0 border-amber-700/30 bg-amber-600/20 text-amber-950 hover:bg-amber-600/40 hover:text-amber-950"
        >
          {ending ? (
            <>
              <Loader2 className="mr-1 size-3 animate-spin" />
              Exiting...
            </>
          ) : (
            <>
              <LogOut className="mr-1 size-3" />
              Exit Impersonation
            </>
          )}
        </Button>
      </div>

      {/* Push all page content down to accommodate the banner */}
      <div className="pt-10">{children}</div>
    </ImpersonationContext>
  );
}
