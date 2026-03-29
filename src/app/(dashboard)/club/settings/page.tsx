"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Settings } from "lucide-react";
import ClubProfileForm from "@/components/clubs/ClubProfileForm";

interface ClubData {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  rules: string | null;
  website: string | null;
  subscription_tier: string;
}

export default function ClubSettingsPage() {
  const router = useRouter();
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/clubs");
        if (!res.ok) return;

        const data = await res.json();
        if (data.owned?.length) {
          setClub(data.owned[0]);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
    starter: "Starter ($149/mo)",
    standard: "Standard ($349/mo)",
    pro: "Pro ($699/mo)",
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
        }}
        onSuccess={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }}
      />
    </div>
  );
}
