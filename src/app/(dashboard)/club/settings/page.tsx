"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Settings } from "lucide-react";
import ClubProfileForm from "@/components/clubs/ClubProfileForm";
import PayoutSetup from "@/components/shared/PayoutSetup";

interface ClubData {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  rules: string | null;
  website: string | null;
  logo_url: string | null;
  subscription_tier: string;
  corporate_memberships_enabled: boolean;
  corporate_initiation_fee: number | null;
}

export default function ClubSettingsPage() {
  const router = useRouter();
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Corporate settings local state
  const [corporateEnabled, setCorporateEnabled] = useState(false);
  const [corporateFee, setCorporateFee] = useState("");
  const [corporateSaving, setCorporateSaving] = useState(false);
  const [corporateSaved, setCorporateSaved] = useState(false);
  const [corporateError, setCorporateError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/clubs");
        if (!res.ok) return;

        const data = await res.json();
        if (data.owned?.length) {
          const clubData = data.owned[0] as ClubData;
          setClub(clubData);
          setCorporateEnabled(clubData.corporate_memberships_enabled ?? false);
          setCorporateFee(
            clubData.corporate_initiation_fee != null
              ? String(clubData.corporate_initiation_fee)
              : ""
          );
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCorporateSave() {
    if (!club) return;
    setCorporateSaving(true);
    setCorporateError(null);
    setCorporateSaved(false);

    try {
      const feeValue = corporateFee.trim() === "" ? null : Number(corporateFee);

      if (corporateEnabled && feeValue !== null && (isNaN(feeValue) || feeValue < 0)) {
        setCorporateError("Fee must be a positive number.");
        setCorporateSaving(false);
        return;
      }

      const res = await fetch(`/api/clubs/${club.id}/corporate-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporate_memberships_enabled: corporateEnabled,
          corporate_initiation_fee: corporateEnabled ? feeValue : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCorporateError(data.error ?? "Failed to save corporate settings.");
        return;
      }

      const updated = await res.json();
      setClub((prev) =>
        prev
          ? {
              ...prev,
              corporate_memberships_enabled:
                updated.corporate_memberships_enabled,
              corporate_initiation_fee: updated.corporate_initiation_fee,
            }
          : prev
      );

      if (!corporateEnabled) {
        setCorporateFee("");
      }

      setCorporateSaved(true);
      setTimeout(() => setCorporateSaved(false), 3000);
    } catch {
      setCorporateError("An unexpected error occurred.");
    } finally {
      setCorporateSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (!club) {
    router.push("/club/setup");
    return null;
  }

  const TIER_LABELS: Record<string, string> = {
    starter: "Starter ($79/mo)",
    standard: "Standard ($199/mo)",
    pro: "Pro ($499/mo)",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-river/10">
          <Settings className="size-6 text-river" />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Club Settings
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Update your club profile and settings.
          </p>
        </div>
      </div>

      {/* Subscription tier info */}
      <div className="rounded-lg border border-stone-light/20 bg-offwhite/50 px-4 py-3">
        <p className="text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Plan:</span>{" "}
          {TIER_LABELS[club.subscription_tier] ?? club.subscription_tier}
        </p>
      </div>

      {saved && (
        <div className="rounded-md border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">
          Changes saved successfully.
        </div>
      )}

      <ClubProfileForm
        mode="edit"
        initialData={{
          id: club.id,
          name: club.name,
          description: club.description ?? "",
          location: club.location ?? "",
          rules: club.rules ?? "",
          website: club.website ?? "",
          logo_url: club.logo_url,
        }}
        onSuccess={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      />

      {/* ── Corporate Memberships ── */}
      <div className="rounded-lg border border-stone-light/20 p-6">
        <div className="flex items-center gap-3">
          <Building2 className="size-5 text-river" />
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
            Corporate Memberships
          </h3>
        </div>

        <p className="mt-2 text-sm text-text-secondary">
          Allow companies to purchase memberships and invite their employees as
          members.
        </p>

        {/* Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <label
            htmlFor="corporate-toggle"
            className="text-sm font-medium text-text-primary"
          >
            Enable corporate memberships
          </label>
          <button
            id="corporate-toggle"
            type="button"
            role="switch"
            aria-checked={corporateEnabled}
            aria-label="Toggle corporate memberships"
            onClick={() => setCorporateEnabled((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              corporateEnabled ? "bg-forest" : "bg-stone-light/30"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 translate-y-0.5 rounded-full bg-white shadow ring-0 transition-transform ${
                corporateEnabled ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Fee input — shown when enabled */}
        {corporateEnabled && (
          <div className="mt-4">
            <label
              htmlFor="corporate-fee"
              className="block text-sm font-medium text-text-primary"
            >
              Corporate initiation fee
            </label>
            <p className="mt-1 text-xs text-text-secondary">
              One-time fee charged to the corporate sponsor. Leave blank for no
              additional fee.
            </p>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
                $
              </span>
              <input
                id="corporate-fee"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={corporateFee}
                onChange={(e) => setCorporateFee(e.target.value)}
                className="w-full rounded-md border border-input bg-white px-3 py-2 pl-7 text-sm"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {corporateError && (
          <p className="mt-3 text-sm text-red-600">{corporateError}</p>
        )}

        {/* Success */}
        {corporateSaved && (
          <div className="mt-3 rounded-md border border-forest/20 bg-forest/5 px-4 py-2 text-sm text-forest">
            Corporate settings saved.
          </div>
        )}

        {/* Save button */}
        <div className="mt-4">
          <button
            type="button"
            disabled={corporateSaving}
            onClick={handleCorporateSave}
            className="rounded-md bg-river px-4 py-2 text-sm font-medium text-white hover:bg-river/90 transition-colors disabled:opacity-50"
          >
            {corporateSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </span>
            ) : (
              "Save Corporate Settings"
            )}
          </button>
        </div>
      </div>

      {/* ── Payout Setup ── */}
      <PayoutSetup type="club" />
    </div>
  );
}
