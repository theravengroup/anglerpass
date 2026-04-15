import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";

interface GuideCardProps {
  guide: {
    id: string;
    display_name: string;
    bio: string | null;
    profile_photo_url: string | null;
    techniques: string[];
    species: string[];
    base_location: string | null;
    rate_full_day: number | null;
    rate_half_day: number | null;
    rating_avg: number | null;
    rating_count: number | null;
  };
}

export default function GuideCard({ guide }: GuideCardProps) {
  const hasRating =
    guide.rating_avg !== null && guide.rating_count !== null && guide.rating_count > 0;

  return (
    <Link href={`/angler/guides/${guide.id}`}>
      <Card className="border-stone-light/20 transition-all hover:border-charcoal/30 hover:shadow-md">
        <CardContent className="p-4">
          {/* Header: photo + name + location */}
          <div className="flex items-start gap-3">
            {guide.profile_photo_url ? (
              <Image
                src={guide.profile_photo_url}
                alt={guide.display_name}
                width={56}
                height={56}
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-lg font-semibold text-charcoal">
                {guide.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {guide.display_name}
              </h3>
              {guide.base_location && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
                  <MapPin className="size-3 shrink-0" />
                  {guide.base_location}
                </p>
              )}
              {/* Rating */}
              <div className="mt-1">
                {hasRating ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-bronze">
                    <Star className="size-3 fill-bronze text-bronze" />
                    {guide.rating_avg!.toFixed(1)} ({guide.rating_count})
                  </span>
                ) : (
                  <span className="text-xs text-text-light">New Independent Guide</span>
                )}
              </div>
            </div>
          </div>

          {/* Rates */}
          {(guide.rate_half_day || guide.rate_full_day) && (
            <p className="mt-3 text-xs font-medium text-text-primary">
              {guide.rate_half_day && `$${guide.rate_half_day}/half day`}
              {guide.rate_half_day && guide.rate_full_day && " · "}
              {guide.rate_full_day && `$${guide.rate_full_day}/full day`}
            </p>
          )}

          {/* Species tags */}
          {guide.species.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {guide.species.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-bronze/10 px-2 py-0.5 text-[10px] font-medium text-bronze"
                >
                  {s}
                </span>
              ))}
              {guide.species.length > 3 && (
                <span className="text-[10px] text-text-light">
                  +{guide.species.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Techniques tags */}
          {guide.techniques.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {guide.techniques.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-charcoal/10 px-2 py-0.5 text-[10px] font-medium text-charcoal"
                >
                  {t}
                </span>
              ))}
              {guide.techniques.length > 3 && (
                <span className="text-[10px] text-text-light">
                  +{guide.techniques.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
