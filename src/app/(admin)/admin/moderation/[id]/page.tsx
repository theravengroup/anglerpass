"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Check,
  MessageSquare,
  X,
  Loader2,
  MapPin,
  Users,
  Fish,
  DollarSign,
  Lock,
  Clock,
} from "lucide-react";
import PhotoLightbox from "@/components/properties/PhotoLightbox";
import { WATER_TYPES } from "@/lib/validations/properties";
import type { MODERATION_ACTIONS } from "@/lib/validations/moderation";

type ModerationAction = (typeof MODERATION_ACTIONS)[number];

interface Property {
  id: string;
  name: string;
  description: string | null;
  location_description: string | null;
  coordinates: string | null;
  water_type: string | null;
  species: string[];
  water_miles: number | null;
  max_rods: number | null;
  max_guests: number | null;
  regulations: string | null;
  photos: string[];
  rate_adult_full_day: number | null;
  rate_youth_full_day: number | null;
  rate_child_full_day: number | null;
  half_day_allowed: boolean;
  rate_adult_half_day: number | null;
  rate_youth_half_day: number | null;
  rate_child_half_day: number | null;
  access_notes: string | null;
  gate_code_required: boolean;
  gate_code: string | null;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface ModerationNote {
  id: number;
  action: string;
  notes: string;
  created_at: string;
  admin_id: string;
}

const ACTION_LABELS: Record<string, string> = {
  approved: "Approved",
  changes_requested: "Changes Requested",
  rejected: "Rejected",
};

const ACTION_COLORS: Record<string, string> = {
  approved: "bg-forest/10 text-forest border-forest/20",
  changes_requested: "bg-river/10 text-river border-river/20",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return `$${value.toFixed(2)}`;
}

function formatWaterType(type: string | null): string {
  if (!type) return "—";
  const found = WATER_TYPES.find((w) => w === type);
  if (!found) return type;
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ModerationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [ownerName, setOwnerName] = useState<string>("Unknown");
  const [history, setHistory] = useState<ModerationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [propRes, historyRes] = await Promise.all([
          fetch(`/api/properties/${id}`),
          fetch(`/api/moderation/${id}`),
        ]);

        if (!propRes.ok) {
          setError(propRes.status === 404 ? "Property not found" : "Failed to load property");
          return;
        }

        const { property: propData } = await propRes.json();
        setProperty(propData);

        if (historyRes.ok) {
          const { notes: historyData } = await historyRes.json();
          setHistory(historyData ?? []);
        }

        // Fetch owner name
        const ownerRes = await fetch(`/api/properties?owner=${propData.owner_id}`);
        if (ownerRes.ok) {
          // We don't have a dedicated endpoint for user profiles, so we'll use what we have
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  async function handleAction(action: ModerationAction) {
    if (!notes.trim()) {
      setActionError("Notes are required for all moderation actions.");
      return;
    }

    setSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/moderation/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: notes.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error ?? "Failed to perform action");
        return;
      }

      router.push("/admin/moderation");
      router.refresh();
    } catch {
      setActionError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Property not found"}
        </div>
        <Link href="/admin/moderation">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-1 size-3" />
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = property.status === "pending_review";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/moderation">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 size-3" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
              {property.name}
            </h2>
            <p className="mt-0.5 text-sm text-text-light">
              Submitted {new Date(property.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            isPending
              ? "bg-river/10 text-river border-river/20"
              : "bg-stone/10 text-text-secondary border-stone/20"
          }
        >
          {property.status.replace("_", " ")}
        </Badge>
      </div>

      {/* Photos */}
      {property.photos?.length > 0 && (
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="text-base">
              Photos ({property.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {property.photos.map((url, i) => (
                <button
                  key={url}
                  onClick={() => {
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                  className="group relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-forest/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Cover
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - left 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">
                {property.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-text-light" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {property.location_description && (
                <div>
                  <p className="text-xs font-medium text-text-light">Directions</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                    {property.location_description}
                  </p>
                </div>
              )}
              {property.coordinates && (
                <div>
                  <p className="text-xs font-medium text-text-light">GPS Coordinates</p>
                  <p className="mt-1 font-mono text-sm text-text-secondary">
                    {property.coordinates}
                  </p>
                </div>
              )}
              {!property.location_description && !property.coordinates && (
                <p className="text-sm text-text-light">No location details provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Water & Species */}
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Fish className="size-4 text-text-light" />
                Water & Species
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-text-light">Water Type</p>
                  <p className="mt-1 text-text-secondary">
                    {formatWaterType(property.water_type)}
                  </p>
                </div>
                {property.water_miles != null && (
                  <div>
                    <p className="text-xs font-medium text-text-light">Water Miles</p>
                    <p className="mt-1 text-text-secondary">{property.water_miles}</p>
                  </div>
                )}
              </div>
              {property.species?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-light">Species</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {property.species.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {property.regulations && (
                <div>
                  <p className="text-xs font-medium text-text-light">Regulations</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                    {property.regulations}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Access Info (private) */}
          <Card className="border-stone-light/20 border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="size-4 text-text-light" />
                Access Information
                <Badge variant="outline" className="ml-1 text-[10px]">Private</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {property.access_notes && (
                <div>
                  <p className="text-xs font-medium text-text-light">Access Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                    {property.access_notes}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-text-light">Gate Code</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {property.gate_code_required
                    ? property.gate_code
                      ? `Required: ${property.gate_code}`
                      : "Required (not set)"
                    : "Not required"}
                </p>
              </div>
              {!property.access_notes && !property.gate_code_required && (
                <p className="text-sm text-text-light">No access notes provided.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - right col */}
        <div className="space-y-6">
          {/* Quick stats */}
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-text-light" />
                <span className="text-text-light">Max Rods:</span>
                <span className="text-text-secondary">
                  {property.max_rods ? `${property.max_rods} per day` : "Not set"}
                </span>
              </div>
              {property.max_guests && (
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-text-light" />
                  <span className="text-text-light">Max Guests:</span>
                  <span className="text-text-secondary">
                    {property.max_guests} per day
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-text-light" />
                <span className="text-text-light">Created:</span>
                <span className="text-text-secondary">
                  {new Date(property.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-stone-light/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="size-4 text-text-light" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-light/10 text-left text-xs text-text-light">
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Full Day</th>
                    {property.half_day_allowed && <th className="pb-2">Half Day</th>}
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-stone-light/5">
                    <td className="py-2">Adult</td>
                    <td>{formatCurrency(property.rate_adult_full_day)}</td>
                    {property.half_day_allowed && (
                      <td>{formatCurrency(property.rate_adult_half_day)}</td>
                    )}
                  </tr>
                  <tr className="border-b border-stone-light/5">
                    <td className="py-2">Youth</td>
                    <td>{formatCurrency(property.rate_youth_full_day)}</td>
                    {property.half_day_allowed && (
                      <td>{formatCurrency(property.rate_youth_half_day)}</td>
                    )}
                  </tr>
                  <tr>
                    <td className="py-2">Child</td>
                    <td>{formatCurrency(property.rate_child_full_day)}</td>
                    {property.half_day_allowed && (
                      <td>{formatCurrency(property.rate_child_half_day)}</td>
                    )}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Moderation Actions */}
          {isPending && (
            <Card className="border-river/20 bg-river/5">
              <CardHeader>
                <CardTitle className="text-base">Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mod-notes" className="text-sm font-medium">
                    Notes <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="mod-notes"
                    placeholder="Add your review notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="mt-1.5"
                    maxLength={2000}
                  />
                  <p className="mt-1 text-xs text-text-light">
                    {notes.length}/2000 characters
                  </p>
                </div>

                {actionError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {actionError}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleAction("approved")}
                    disabled={submitting}
                    className="w-full bg-forest hover:bg-forest-deep"
                  >
                    {submitting ? (
                      <Loader2 className="mr-1 size-3 animate-spin" />
                    ) : (
                      <Check className="mr-1 size-3" />
                    )}
                    Approve & Publish
                  </Button>
                  <Button
                    onClick={() => handleAction("changes_requested")}
                    disabled={submitting}
                    variant="outline"
                    className="w-full border-river/30 text-river hover:bg-river/10"
                  >
                    <MessageSquare className="mr-1 size-3" />
                    Request Changes
                  </Button>
                  <Button
                    onClick={() => handleAction("rejected")}
                    disabled={submitting}
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <X className="mr-1 size-3" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Moderation History */}
          {history.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader>
                <CardTitle className="text-base">Moderation History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.map((note) => (
                  <div
                    key={note.id}
                    className="border-b border-stone-light/10 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${ACTION_COLORS[note.action] ?? ""}`}
                      >
                        {ACTION_LABELS[note.action] ?? note.action}
                      </Badge>
                      <span className="text-[10px] text-text-light">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-text-secondary">{note.notes}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          photos={property.photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
