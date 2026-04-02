"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Star,
  Globe,
  CheckCircle2,
  Fish,
  Waves,
} from "lucide-react";
import GuideProfileSidebar from "@/components/angler/GuideProfileSidebar";

interface GuideDetail {
  id: string;
  display_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  photos: string[] | null;
  techniques: string[];
  species: string[];
  skill_levels: string[];
  max_anglers: number | null;
  gear_included: boolean;
  gear_details: string | null;
  languages: string[] | null;
  base_location: string | null;
  service_region: string | null;
  closest_airports: string[] | null;
  rate_full_day: number | null;
  rate_half_day: number | null;
  rate_description: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  trips_completed: number | null;
  response_time_hours: number | null;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reviewer_role: string;
  profiles: { display_name: string } | null;
}

interface Water {
  id: string;
  property_id: string;
  properties: {
    name: string;
    location_description: string | null;
    water_type: string | null;
  } | null;
}

export default function GuideProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [waters, setWaters] = useState<Water[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/guides/${id}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Guide not found." : "Failed to load guide profile.");
          return;
        }
        const data = await res.json();
        setGuide(data.guide);
        setReviews(data.reviews ?? []);
        setWaters(data.waters ?? []);
      } catch {
        setError("Failed to load guide profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Link href="/angler/guides">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 size-4" />
            Back to Guides
          </Button>
        </Link>
        <div role="alert" aria-live="polite" className="py-12 text-center text-sm text-red-600">
          {error ?? "Guide not found."}
        </div>
      </div>
    );
  }

  const hasRating =
    guide.rating_avg !== null && guide.rating_count !== null && guide.rating_count > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Back link */}
      <Link href="/angler/guides">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-1 size-4" />
          Back to Guides
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Profile header */}
          <Card className="border-stone-light/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {guide.profile_photo_url ? (
                  <Image
                    src={guide.profile_photo_url}
                    alt={guide.display_name}
                    width={96}
                    height={96}
                    className="size-24 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-2xl font-semibold text-charcoal">
                    {guide.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-text-primary">
                      {guide.display_name}
                    </h2>
                    {guide.status === "approved" && (
                      <CheckCircle2 className="size-5 text-forest" />
                    )}
                  </div>
                  {guide.base_location && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                      <MapPin className="size-3.5 shrink-0" />
                      {guide.base_location}
                    </p>
                  )}
                  {guide.service_region && (
                    <p className="mt-0.5 text-xs text-text-light">
                      Service region: {guide.service_region}
                    </p>
                  )}
                  {hasRating && (
                    <p className="mt-2 flex items-center gap-1 text-sm font-medium text-bronze">
                      <Star className="size-4 fill-bronze text-bronze" />
                      {guide.rating_avg!.toFixed(1)} ({guide.rating_count} review
                      {guide.rating_count! !== 1 ? "s" : ""})
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {guide.bio && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {guide.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Techniques */}
          {guide.techniques.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Waves className="size-4 text-charcoal" />
                  Techniques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {guide.techniques.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-charcoal/10 px-3 py-1 text-xs font-medium text-charcoal"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Species */}
          {guide.species.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Fish className="size-4 text-bronze" />
                  Target Species
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {guide.species.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-bronze/10 px-3 py-1 text-xs font-medium text-bronze"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {guide.languages && guide.languages.length > 0 && (
            <Card className="border-stone-light/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="size-4 text-river" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary">
                  {guide.languages.join(", ")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card className="border-stone-light/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Reviews{" "}
                {hasRating && (
                  <span className="text-sm font-normal text-text-light">
                    ({guide.rating_count})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-light">
                  No reviews yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="border-b border-stone-light/10 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-sm font-medium text-bronze">
                            <Star className="size-3 fill-bronze text-bronze" />
                            {r.rating}
                          </span>
                          {r.title && (
                            <span className="text-sm font-medium text-text-primary">
                              {r.title}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-light">
                          {new Date(r.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {r.body && (
                        <p className="mt-1 text-sm text-text-secondary">
                          {r.body}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-text-light">
                        {r.profiles?.display_name ?? "Anonymous"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column (sticky sidebar) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <GuideProfileSidebar guide={guide} watersCount={waters.length} />
        </div>
      </div>
    </div>
  );
}
