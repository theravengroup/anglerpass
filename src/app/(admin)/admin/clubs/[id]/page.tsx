"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Users,
  TreePine,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Power,
} from "lucide-react";

interface ClubMember {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  status: string;
  joined_at: string;
}

interface ClubProperty {
  id: string;
  name: string;
  status: string;
  location: string | null;
}

interface ClubDetail {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  rules: string | null;
  website: string | null;
  subscription_tier: string | null;
  is_active: boolean;
  owner_name: string | null;
  owner_email: string | null;
  created_at: string;
  members: ClubMember[];
  properties: ClubProperty[];
}

const TIER_OPTIONS = ["free", "basic", "premium", "enterprise"];

const TIER_COLORS: Record<string, string> = {
  free: "bg-stone/10 text-text-secondary border-stone/20",
  basic: "bg-river/10 text-river border-river/20",
  premium: "bg-bronze/10 text-bronze border-bronze/20",
  enterprise: "bg-forest/10 text-forest border-forest/20",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-forest/10 text-forest border-forest/20",
  staff: "bg-river/10 text-river border-river/20",
  member: "bg-stone/10 text-text-secondary border-stone/20",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-forest/10 text-forest border-forest/20",
  pending: "bg-river/10 text-river border-river/20",
  suspended: "bg-red-100 text-red-700 border-red-200",
  inactive: "bg-stone/10 text-text-secondary border-stone/20",
};

const PROPERTY_STATUS_COLORS: Record<string, string> = {
  published: "bg-forest/10 text-forest border-forest/20",
  pending_review: "bg-river/10 text-river border-river/20",
  draft: "bg-stone/10 text-text-secondary border-stone/20",
  changes_requested: "bg-bronze/10 text-bronze border-bronze/20",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

function tierLabel(tier: string | null): string {
  if (!tier) return "Free";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function statusLabel(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formRules, setFormRules] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formTier, setFormTier] = useState("free");

  const [formIsActive, setFormIsActive] = useState(false);
  const [activating, setActivating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClub() {
      try {
        const res = await fetch(`/api/admin/clubs/${id}`);
        if (!res.ok) {
          setError(
            res.status === 404 ? "Club not found" : "Failed to load club"
          );
          return;
        }

        const data: ClubDetail = await res.json();
        setClub(data);

        // Populate form
        setFormName(data.name ?? "");
        setFormDescription(data.description ?? "");
        setFormLocation(data.location ?? "");
        setFormRules(data.rules ?? "");
        setFormWebsite(data.website ?? "");
        setFormTier(data.subscription_tier ?? "free");
        setFormIsActive(data.is_active ?? false);
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchClub();
  }, [id]);

  async function handleToggleActive() {
    setActivating(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/admin/clubs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !formIsActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to toggle club status");
        return;
      }

      setFormIsActive(!formIsActive);
      setClub((prev) =>
        prev ? { ...prev, is_active: !formIsActive } : prev
      );
    } catch {
      setSaveError("An unexpected error occurred");
    } finally {
      setActivating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/admin/clubs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          location: formLocation.trim() || null,
          rules: formRules.trim() || null,
          website: formWebsite.trim() || null,
          subscription_tier: formTier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to save changes");
        return;
      }

      const updated = await res.json();
      setClub((prev) => (prev ? { ...prev, ...updated } : prev));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-river" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Club not found"}
        </div>
        <Link href="/admin/clubs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 size-3" />
            Back to Clubs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/clubs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-3" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
                {club.name}
              </h2>
              <Badge
                variant="outline"
                className={
                  TIER_COLORS[club.subscription_tier ?? "free"] ??
                  TIER_COLORS.free
                }
              >
                {tierLabel(club.subscription_tier)}
              </Badge>
              <Badge
                variant="outline"
                className={
                  formIsActive
                    ? "bg-forest/10 text-forest border-forest/20"
                    : "bg-stone/10 text-text-secondary border-stone/20"
                }
              >
                <Power className="mr-1 size-3" />
                {formIsActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-sm text-text-light">
              {club.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {club.location}
                </span>
              )}
              <span>
                Owner: {club.owner_name ?? "Unknown"}
                {club.owner_email && (
                  <span className="ml-1 text-text-light">
                    ({club.owner_email})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          variant={formIsActive ? "outline" : "default"}
          className={
            formIsActive
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "bg-forest text-white hover:bg-forest-deep"
          }
          onClick={handleToggleActive}
          disabled={activating}
        >
          {activating && <Loader2 className="mr-1 size-3 animate-spin" />}
          <Power className="mr-1 size-3" />
          {formIsActive ? "Deactivate" : "Activate"}
        </Button>
      </div>

      {/* Members Card */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-text-light" />
            Members ({club.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {club.members.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-light">
              No members yet.
            </p>
          ) : (
            <div className="space-y-0">
              {/* Header row */}
              <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 border-b border-stone-light/15 pb-2 text-xs font-medium uppercase tracking-wider text-text-light">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Joined</span>
              </div>

              {club.members.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] items-center gap-4 border-b border-stone-light/10 py-2.5 text-sm last:border-b-0"
                >
                  <span className="truncate font-medium text-text-primary">
                    {member.display_name ?? "---"}
                  </span>
                  <span className="truncate text-text-secondary">
                    {member.email ?? "---"}
                  </span>
                  <span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        ROLE_COLORS[member.role] ?? ROLE_COLORS.member
                      }`}
                    >
                      {member.role.charAt(0).toUpperCase() +
                        member.role.slice(1)}
                    </Badge>
                  </span>
                  <span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        STATUS_COLORS[member.status] ?? STATUS_COLORS.active
                      }`}
                    >
                      {statusLabel(member.status)}
                    </Badge>
                  </span>
                  <span className="text-xs text-text-light">
                    {new Date(member.joined_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties Card */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TreePine className="size-4 text-text-light" />
            Properties ({club.properties.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {club.properties.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-light">
              No properties linked to this club.
            </p>
          ) : (
            <div className="space-y-0">
              {/* Header row */}
              <div className="grid grid-cols-[2fr_1fr_2fr] gap-4 border-b border-stone-light/15 pb-2 text-xs font-medium uppercase tracking-wider text-text-light">
                <span>Name</span>
                <span>Status</span>
                <span>Location</span>
              </div>

              {club.properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/admin/moderation/${property.id}`}
                  className="grid grid-cols-[2fr_1fr_2fr] items-center gap-4 border-b border-stone-light/10 py-2.5 text-sm transition-colors last:border-b-0 hover:bg-offwhite/50"
                >
                  <span className="truncate font-medium text-text-primary">
                    {property.name}
                  </span>
                  <span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        PROPERTY_STATUS_COLORS[property.status] ??
                        PROPERTY_STATUS_COLORS.draft
                      }`}
                    >
                      {statusLabel(property.status)}
                    </Badge>
                  </span>
                  <span className="flex items-center gap-1 truncate text-xs text-text-light">
                    {property.location && (
                      <>
                        <MapPin className="size-3 shrink-0" />
                        {property.location}
                      </>
                    )}
                    {!property.location && "---"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Club Details / Edit Card */}
      <Card className="border-stone-light/20">
        <CardHeader>
          <CardTitle className="text-base">Club Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="club-name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="club-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1.5"
                placeholder="Club name"
              />
            </div>
            <div>
              <Label htmlFor="club-location" className="text-sm font-medium">
                Location
              </Label>
              <Input
                id="club-location"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="mt-1.5"
                placeholder="e.g. Bozeman, MT"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="club-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="club-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="mt-1.5"
              rows={3}
              placeholder="Club description..."
            />
          </div>

          <div>
            <Label htmlFor="club-rules" className="text-sm font-medium">
              Rules
            </Label>
            <Textarea
              id="club-rules"
              value={formRules}
              onChange={(e) => setFormRules(e.target.value)}
              className="mt-1.5"
              rows={3}
              placeholder="Club rules and guidelines..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="club-website" className="text-sm font-medium">
                <span className="flex items-center gap-1">
                  <Globe className="size-3" />
                  Website
                </span>
              </Label>
              <Input
                id="club-website"
                value={formWebsite}
                onChange={(e) => setFormWebsite(e.target.value)}
                className="mt-1.5"
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="club-tier" className="text-sm font-medium">
                Subscription Tier
              </Label>
              <select
                id="club-tier"
                value={formTier}
                onChange={(e) => setFormTier(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-md border border-stone-light/25 bg-white px-3 text-sm text-text-primary focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
              >
                {TIER_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {tierLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feedback */}
          {saveError && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="size-3.5 shrink-0" />
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-md border border-forest/20 bg-forest/5 px-3 py-2 text-xs text-forest">
              <CheckCircle2 className="size-3.5 shrink-0" />
              Changes saved successfully.
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="bg-forest hover:bg-forest-deep"
            >
              {saving ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <Save className="mr-1 size-3" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
