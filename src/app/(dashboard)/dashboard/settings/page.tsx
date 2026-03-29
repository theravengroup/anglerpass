"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Loader2,
  Check,
  User,
  MapPin,
  Fish,
  Users,
  X,
} from "lucide-react";
import { FetchError } from "@/components/shared/FetchError";

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

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

const COMMON_SPECIES = [
  "Rainbow Trout",
  "Brown Trout",
  "Brook Trout",
  "Cutthroat Trout",
  "Largemouth Bass",
  "Smallmouth Bass",
  "Steelhead",
  "Salmon",
  "Pike",
  "Musky",
  "Walleye",
  "Carp",
];

const PREF_LABELS: {
  key: keyof Preferences;
  label: string;
  description: string;
}[] = [
  {
    key: "email_booking_requested",
    label: "Booking Requests",
    description: "When an angler requests to book your property",
  },
  {
    key: "email_booking_confirmed",
    label: "Booking Confirmed",
    description: "When a landowner confirms your booking",
  },
  {
    key: "email_booking_declined",
    label: "Booking Declined",
    description: "When a landowner declines your booking",
  },
  {
    key: "email_booking_cancelled",
    label: "Booking Cancelled",
    description: "When an angler cancels a booking at your property",
  },
  {
    key: "email_member_invited",
    label: "Club Invitations",
    description: "When you're invited to join a club",
  },
  {
    key: "email_member_approved",
    label: "Membership Approved",
    description: "When your club membership is approved",
  },
  {
    key: "email_property_access",
    label: "Property Access",
    description: "When your club gains access to a new property",
  },
];

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

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [species, setSpecies] = useState<string[]>([]);
  const [speciesInput, setSpeciesInput] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Notification state
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const loadAll = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const [profileRes, prefsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/notifications/preferences"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        const p = data.profile;
        setProfile(p);
        setMemberships(data.memberships ?? []);
        setDisplayName(p.display_name ?? "");
        setBio(p.bio ?? "");
        setLocation(p.location ?? "");
        setExperience(p.fishing_experience ?? "");
        setSpecies(p.favorite_species ?? []);
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
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Profile save ──
  const saveProfile = async () => {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim() || undefined,
          bio: bio.trim() || null,
          location: location.trim() || null,
          fishing_experience: experience || null,
          favorite_species: species,
        }),
      });
      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      alert("Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Add species ──
  const addSpecies = (s: string) => {
    const trimmed = s.trim();
    if (trimmed && !species.includes(trimmed) && species.length < 20) {
      setSpecies([...species, trimmed]);
      setSpeciesInput("");
    }
  };

  // ── Notification save ──
  const togglePref = (key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setPrefsSaved(false);
  };

  const savePrefs = async () => {
    setPrefsSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setPrefsSaved(true);
        setTimeout(() => setPrefsSaved(false), 3000);
      }
    } catch {
      alert("Failed to save preferences.");
    } finally {
      setPrefsSaving(false);
    }
  };

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (error) {
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

      {/* ── Profile ── */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-forest" />
            Profile
          </CardTitle>
          <CardDescription>
            Tell other members about yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-forest/10 text-xl font-semibold text-forest">
              {displayName
                ? displayName.charAt(0).toUpperCase()
                : profile?.email?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {profile?.email}
              </p>
              <p className="text-xs text-text-light capitalize">
                {profile?.role?.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you want to be known"
              maxLength={100}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself..."
              maxLength={500}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-text-light">{bio.length}/500</p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bozeman, Montana"
              maxLength={200}
            />
          </div>

          {/* Fishing experience */}
          <div className="space-y-2">
            <Label htmlFor="experience" className="flex items-center gap-1.5">
              <Fish className="size-3.5" />
              Fishing Experience
            </Label>
            <select
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select your experience level</option>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Favorite species */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Fish className="size-3.5" />
              Favorite Species
            </Label>
            <div className="flex flex-wrap gap-2">
              {species.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-1 text-xs font-medium text-forest"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      setSpecies(species.filter((sp) => sp !== s))
                    }
                    className="rounded-full p-0.5 hover:bg-forest/20"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={speciesInput}
                onChange={(e) => setSpeciesInput(e.target.value)}
                placeholder="Add a species..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpecies(speciesInput);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addSpecies(speciesInput)}
                disabled={!speciesInput.trim()}
              >
                Add
              </Button>
            </div>
            {/* Quick-add common species */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SPECIES.filter((s) => !species.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSpecies(s)}
                  className="rounded-full border border-stone-light/30 px-2 py-0.5 text-xs text-text-secondary transition-colors hover:border-forest/30 hover:bg-forest/5 hover:text-forest"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-light/15 pt-4">
            {profileSaved && (
              <span className="flex items-center gap-1 text-sm text-forest">
                <Check className="size-4" />
                Saved
              </span>
            )}
            <Button
              onClick={saveProfile}
              disabled={profileSaving}
              className="bg-forest text-white hover:bg-forest/90"
            >
              {profileSaving && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Club Memberships ── */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5 text-river" />
            Club Memberships
          </CardTitle>
          <CardDescription>
            Clubs you belong to or have requested to join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-light">
              You&apos;re not a member of any clubs yet. Browse clubs from the{" "}
              <a
                href="/angler/discover"
                className="font-medium text-river hover:underline"
              >
                Discover
              </a>{" "}
              page.
            </p>
          ) : (
            <div className="space-y-3">
              {memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-stone-light/15 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-river/10 text-sm font-semibold text-river">
                      {m.clubs?.name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {m.clubs?.name ?? "Unknown Club"}
                      </p>
                      {m.clubs?.location && (
                        <p className="flex items-center gap-1 text-xs text-text-light">
                          <MapPin className="size-3" />
                          {m.clubs.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      m.status === "active"
                        ? "bg-forest/10 text-forest"
                        : m.status === "pending"
                          ? "bg-bronze/10 text-bronze"
                          : "bg-stone-light/10 text-text-light"
                    }`}
                  >
                    {m.status === "active"
                      ? "Active"
                      : m.status === "pending"
                        ? "Pending"
                        : m.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Notification Preferences ── */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5 text-bronze" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which events you want to receive email notifications for.
            You&apos;ll always receive in-app notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {PREF_LABELS.map(({ key, label, description }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-stone-light/10"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {label}
                </p>
                <p className="text-xs text-text-light">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[key]}
                onClick={() => togglePref(key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  prefs[key] ? "bg-forest" : "bg-stone-light/40"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
                    prefs[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          ))}

          <div className="flex items-center justify-end gap-3 pt-4">
            {prefsSaved && (
              <span className="flex items-center gap-1 text-sm text-forest">
                <Check className="size-4" />
                Saved
              </span>
            )}
            <Button
              onClick={savePrefs}
              disabled={prefsSaving}
              className="bg-forest text-white hover:bg-forest/90"
            >
              {prefsSaving && (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              )}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
