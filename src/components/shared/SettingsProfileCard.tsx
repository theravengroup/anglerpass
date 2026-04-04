"use client";

import { useState } from "react";
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
import { Loader2, Check, User, MapPin, Fish, X } from "lucide-react";
import ProfilePhotoUpload from "@/components/shared/ProfilePhotoUpload";

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

interface SettingsProfileCardProps {
  profile: Profile;
  onProfileUpdate: (updated: Profile) => void;
}

// ─── Constants ──────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────

export default function SettingsProfileCard({
  profile,
  onProfileUpdate,
}: SettingsProfileCardProps) {
  const [displayName, setDisplayName] = useState(
    profile.display_name ?? ""
  );
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [experience, setExperience] = useState(
    profile.fishing_experience ?? ""
  );
  const [species, setSpecies] = useState<string[]>(
    profile.favorite_species ?? []
  );
  const [speciesInput, setSpeciesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addSpecies = (s: string) => {
    const trimmed = s.trim();
    if (trimmed && !species.includes(trimmed) && species.length < 20) {
      setSpecies([...species, trimmed]);
      setSpeciesInput("");
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
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
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
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
        {/* Profile photo */}
        <div className="flex items-center gap-6">
          <ProfilePhotoUpload
            currentUrl={profile.avatar_url ?? null}
            fallback={
              displayName
                ? displayName.charAt(0).toUpperCase()
                : profile.email?.charAt(0).toUpperCase() ?? "?"
            }
            onUploaded={(url) => {
              onProfileUpdate({ ...profile, avatar_url: url || null });
            }}
            accentColor={profile.role === "landowner" ? "forest" : "bronze"}
          />
          <div>
            <p className="text-sm font-medium text-text-primary">
              {profile.email}
            </p>
            <p className="text-xs text-text-light capitalize">
              {profile.role?.replace("_", " ")}
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
                  aria-label={`Remove ${s}`}
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
          {saved && (
            <span className="flex items-center gap-1 text-sm text-forest">
              <Check className="size-4" />
              Saved
            </span>
          )}
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="bg-forest text-white hover:bg-forest/90"
          >
            {saving && (
              <Loader2 className="mr-1.5 size-4 animate-spin" />
            )}
            Save Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
