"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { FetchError } from "@/components/shared/FetchError";
import PayoutSetup from "@/components/shared/PayoutSetup";
import SettingsProfileCard from "@/components/shared/SettingsProfileCard";
import SettingsHomeClubCard from "@/components/shared/SettingsHomeClubCard";
import SettingsCrossClubCard from "@/components/shared/SettingsCrossClubCard";
import SettingsNotificationsCard from "@/components/shared/SettingsNotificationsCard";

// ─── Types ──────────────────────────────────────────────────────────

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  fishing_experience: string | null;
  favorite_species: string[];
}

interface ClubMembership {
  id: string;
  role: string;
  status: string;
  joined_at: string | null;
  clubs: {
    id: string;
    name: string;
    logo_url: string | null;
    location: string | null;
  } | null;
}

interface Preferences {
  email_booking_requested: boolean;
  email_booking_confirmed: boolean;
  email_booking_declined: boolean;
  email_booking_cancelled: boolean;
  email_member_invited: boolean;
  email_member_approved: boolean;
  email_property_access: boolean;
}

const PREF_DEFAULTS: Preferences = {
  email_booking_requested: true,
  email_booking_confirmed: true,
  email_booking_declined: true,
  email_booking_cancelled: true,
  email_member_invited: true,
  email_member_approved: true,
  email_property_access: true,
};

// ─── Page ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [prefs, setPrefs] = useState<Preferences>(PREF_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadAll() {
    setError(false);
    setLoading(true);
    try {
      const [profileRes, prefsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/notifications/preferences"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setMemberships(data.memberships ?? []);
      } else {
        setError(true);
      }

      if (prefsRes.ok) {
        const data = await prefsRes.json();
        setPrefs({ ...PREF_DEFAULTS, ...data.preferences });
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl">
        <FetchError message="Failed to load settings." onRetry={loadAll} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Settings
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your profile, preferences, and account.
        </p>
      </div>

      <SettingsProfileCard
        profile={profile}
        onProfileUpdate={setProfile}
      />

      {profile.role === "landowner" && <PayoutSetup type="landowner" />}

      <SettingsHomeClubCard memberships={memberships} />

      <SettingsCrossClubCard />

      <SettingsNotificationsCard initialPrefs={prefs} />
    </div>
  );
}
