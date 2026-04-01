"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reviewer_role: string;
  profiles: { display_name: string | null } | null;
}

export default function GuideReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ avg: 0, count: 0, distribution: [0, 0, 0, 0, 0] });

  const load = useCallback(async () => {
    try {
      // Get guide profile for user_id
      const profileRes = await fetch("/api/guides/profile");
      if (!profileRes.ok) return;
      const { profile } = await profileRes.json();

      const res = await fetch(`/api/reviews?subject_id=${profile.user_id}`);
      if (res.ok) {
        const data = await res.json();
        const revs = data.reviews ?? [];
        setReviews(revs);

        // Calculate stats
        if (revs.length > 0) {
          const sum = revs.reduce((acc: number, r: Review) => acc + r.rating, 0);
          const dist = [0, 0, 0, 0, 0];
          revs.forEach((r: Review) => {
            dist[r.rating - 1]++;
          });
          setStats({
            avg: Math.round((sum / revs.length) * 10) / 10,
            count: revs.length,
            distribution: dist,
          });
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-charcoal" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Reviews
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Reviews from anglers you&apos;ve guided.
        </p>
      </div>

      {/* Stats */}
      <Card className="border-stone-light/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-semibold text-text-primary">
                {stats.count > 0 ? stats.avg.toFixed(1) : "--"}
              </p>
              <div className="mt-1 flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`size-4 ${s <= Math.round(stats.avg) ? "fill-bronze text-bronze" : "text-stone-light/40"}`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-text-light">
                {stats.count} review{stats.count !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.distribution[rating - 1];
                const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-text-light">{rating}</span>
                    <div className="h-2 flex-1 rounded-full bg-offwhite">
                      <div
                        className="h-full rounded-full bg-bronze"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-text-light">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review list */}
      {reviews.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Star className="size-8 text-text-light" />
            <p className="mt-3 text-sm text-text-secondary">No reviews yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="border-stone-light/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3.5 ${s <= review.rating ? "fill-bronze text-bronze" : "text-stone-light/30"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-light">
                    {new Date(review.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {review.title && (
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {review.title}
                  </p>
                )}
                {review.body && (
                  <p className="mt-1 text-sm text-text-secondary">{review.body}</p>
                )}
                <p className="mt-2 text-xs text-text-light">
                  — {review.profiles?.display_name ?? "Anonymous"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
