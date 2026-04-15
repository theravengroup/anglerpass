"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ProposalGuideCardProps {
  displayName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
}

export default function ProposalGuideCard({
  displayName,
  bio,
  profilePhotoUrl,
  ratingAvg,
  ratingCount,
}: ProposalGuideCardProps) {
  const hasRating =
    ratingAvg !== null && ratingCount !== null && ratingCount > 0;

  return (
    <Card className="border-stone-light/20">
      <CardContent className="py-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-text-light">
          Your Independent Guide
        </h3>
        <div className="mt-3 flex items-start gap-3">
          {profilePhotoUrl ? (
            <Image
              src={profilePhotoUrl}
              alt={displayName}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-charcoal/10 text-base font-semibold text-charcoal">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {displayName}
            </p>
            {hasRating && (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-bronze">
                <Star className="size-3 fill-bronze text-bronze" />
                {ratingAvg!.toFixed(1)} ({ratingCount})
              </p>
            )}
            {bio && (
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                {bio.length > 200 ? `${bio.slice(0, 200)}...` : bio}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
