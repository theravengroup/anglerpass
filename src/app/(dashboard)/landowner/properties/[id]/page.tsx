"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PropertyForm from "@/components/properties/PropertyForm";
import type { PropertyFormData } from "@/lib/validations/properties";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CalendarSubscription from "@/components/properties/CalendarSubscription";

interface PropertyData extends PropertyFormData {
  id: string;
  status: string;
}

interface ModerationNote {
  id: number;
  action: string;
  notes: string;
  created_at: string;
}

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [moderationNotes, setModerationNotes] = useState<ModerationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Property not found");
          } else if (res.status === 401) {
            router.push("/login");
            return;
          } else {
            setError("Failed to load property");
          }
          return;
        }

        const { property: data } = await res.json();
        setProperty({
          id: data.id,
          status: data.status,
          name: data.name ?? "",
          description: data.description ?? "",
          location_description: data.location_description ?? "",
          coordinates: data.coordinates ?? "",
          water_type: data.water_type ?? "",
          species: data.species ?? [],
          water_miles: data.water_miles ?? null,
          capacity: data.capacity ?? null,
          regulations: data.regulations ?? "",
          photos: data.photos ?? [],
          rate_adult_full_day: data.rate_adult_full_day ?? null,
          rate_youth_full_day: data.rate_youth_full_day ?? null,
          rate_child_full_day: data.rate_child_full_day ?? null,
          half_day_allowed: data.half_day_allowed ?? false,
          rate_adult_half_day: data.rate_adult_half_day ?? null,
          rate_youth_half_day: data.rate_youth_half_day ?? null,
          rate_child_half_day: data.rate_child_half_day ?? null,
          lodging_available: data.lodging_available ?? false,
          lodging_url: data.lodging_url ?? "",
          access_notes: data.access_notes ?? "",
          gate_code_required: data.gate_code_required ?? false,
          gate_code: data.gate_code ?? "",
        });

        // Fetch moderation notes if changes were requested
        if (data.status === "changes_requested") {
          try {
            const notesRes = await fetch(`/api/moderation/${data.id}`);
            if (notesRes.ok) {
              const { notes } = await notesRes.json();
              setModerationNotes(notes ?? []);
            }
          } catch {
            // Non-critical — don't block the page
          }
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id, router]);

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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Edit Property
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Update your property details.{" "}
          {property.status === "pending_review" && (
            <span className="text-river">
              This property is pending review — edits will reset it to draft.
            </span>
          )}
          {property.status === "published" && (
            <span className="text-forest">
              This property is published and visible to anglers.
            </span>
          )}
        </p>
      </div>

      {/* Changes Requested Banner */}
      {property.status === "changes_requested" && (
        <Card className="border-river/30 bg-river/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-river" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">
                  Changes have been requested by an admin
                </p>
                <p className="text-sm text-text-secondary">
                  Please review the notes below, make the necessary updates, and resubmit for review.
                </p>
                {moderationNotes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {moderationNotes
                      .filter((n) => n.action === "changes_requested")
                      .slice(0, 3)
                      .map((note) => (
                        <div
                          key={note.id}
                          className="rounded-md border border-river/20 bg-white px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className="bg-river/10 text-river border-river/20 text-[10px]"
                            >
                              Changes Requested
                            </Badge>
                            <span className="text-[10px] text-text-light">
                              {new Date(note.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-text-secondary">
                            {note.notes}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Subscription — only for published properties */}
      {property.status === "published" && (
        <CalendarSubscription propertyId={property.id} />
      )}

      <PropertyForm mode="edit" initialData={property} />
    </div>
  );
}
