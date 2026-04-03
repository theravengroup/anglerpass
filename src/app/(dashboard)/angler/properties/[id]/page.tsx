"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapPin,
  Droplets,
  Fish,
  Users,
  ArrowLeft,
  ScrollText,
  Home,
  ExternalLink,
} from "lucide-react";
import BookingForm from "@/components/angler/BookingForm";
import PropertyReviewSection from "@/components/reviews/PropertyReviewSection";
import PropertyWeather from "@/components/properties/PropertyWeather";
import { WATER_TYPE_LABELS } from "@/lib/constants/water-types";

interface PropertyDetail {
  id: string;
  name: string;
  description: string | null;
  location_description: string | null;
  water_type: string | null;
  species: string[];
  photos: string[];
  capacity: number | null;
  max_rods: number | null;
  max_guests: number | null;
  rate_adult_full_day: number | null;
  rate_adult_half_day: number | null;
  half_day_allowed: boolean;
  water_miles: number | null;
  regulations: string | null;
  latitude: number | null;
  longitude: number | null;
  lodging_available: boolean;
  lodging_url: string | null;
  is_cross_club?: boolean;
  accessible_through: {
    membership_id: string;
    club_id: string;
    club_name: string;
  }[];
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/properties/discover");
        if (res.ok) {
          const data = await res.json();
          const found = (data.properties ?? []).find(
            (p: PropertyDetail) => p.id === id
          );
          if (found) {
            setProperty(found);
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-bronze" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-text-secondary">Property not found or not accessible.</p>
        <Link href="/angler/discover">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-4" />
            Back to Discover
          </Button>
        </Link>
      </div>
    );
  }

  const initialMembership =
    property.accessible_through?.length === 1
      ? property.accessible_through[0].membership_id
      : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Link
        href="/angler/discover"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Back to Discover
      </Link>

      {/* Photo gallery */}
      {property.photos?.length > 0 && (
        <div className="space-y-2">
          <div className="aspect-[16/9] overflow-hidden rounded-xl bg-offwhite">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={property.photos[selectedPhoto] ?? property.photos[0]}
              alt={property.name}
              className="size-full object-cover"
            />
          </div>
          {property.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {property.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPhoto(i)}
                  className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                    i === selectedPhoto
                      ? "border-bronze"
                      : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt=""
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Property details */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
              {property.name}
            </h1>
            {property.location_description && (
              <p className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                <MapPin className="size-4" />
                {property.location_description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1 text-xs text-river">
              <Users className="size-3.5" />
              Available through{" "}
              {property.accessible_through
                .map((a) => a.club_name)
                .join(", ")}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4">
            {property.water_type && (
              <div className="flex items-center gap-1.5 rounded-full bg-river/10 px-3 py-1.5 text-xs font-medium text-river">
                <Droplets className="size-3.5" />
                {WATER_TYPE_LABELS[property.water_type] ?? property.water_type}
              </div>
            )}
            {property.water_miles && (
              <div className="flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1.5 text-xs font-medium text-forest">
                {property.water_miles} miles of water
              </div>
            )}
            {(property.max_rods ?? property.capacity) && (
              <div className="flex items-center gap-1.5 rounded-full bg-bronze/10 px-3 py-1.5 text-xs font-medium text-bronze">
                <Users className="size-3.5" />
                Max {property.max_rods ?? property.capacity} rods/day
              </div>
            )}
            {property.max_guests && (
              <div className="flex items-center gap-1.5 rounded-full bg-stone/10 px-3 py-1.5 text-xs font-medium text-text-secondary">
                Max {property.max_guests} people/day
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <h3 className="text-sm font-medium text-text-primary">
                About This Property
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {property.description}
              </p>
            </div>
          )}

          {/* Species */}
          {property.species?.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <Fish className="size-4" />
                Species
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {property.species.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-offwhite px-3 py-1 text-xs text-text-secondary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regulations */}
          {property.regulations && (
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                <ScrollText className="size-4" />
                Regulations
              </h3>
              <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                {property.regulations}
              </p>
            </div>
          )}

          {/* Lodging callout */}
          {property.lodging_available && property.lodging_url && (
            <div className="rounded-xl border border-bronze/20 bg-bronze/5 p-5">
              <div className="flex items-center gap-2.5">
                <Home className="size-5 text-bronze" />
                <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
                  Lodging Available
                </h3>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                This property offers on-site lodging through a third-party
                platform.
              </p>
              <a
                href={property.lodging_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-bronze px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-bronze/90"
              >
                <ExternalLink className="size-4" />
                View Lodging on Airbnb / VRBO
              </a>
              <p className="mt-3 text-xs leading-relaxed text-text-light">
                Lodging is managed independently through a third-party platform.
                Confirm your lodging availability for your specific dates before
                completing your fishing access booking. AnglerPass does not
                manage or guarantee lodging availability.
              </p>
            </div>
          )}

          {/* Weather forecast */}
          {property.latitude != null && property.longitude != null && (
            <PropertyWeather propertyId={property.id} />
          )}

          {/* Verified trip reviews */}
          <PropertyReviewSection propertyId={property.id} />
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-1">
          <BookingForm
            property={property}
            initialMembership={initialMembership}
          />
        </div>
      </div>
    </div>
  );
}
