import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Moderation Queue",
};

export default async function ModerationPage() {
  const supabase = await createClient();

  // Fetch all pending_review properties with owner info
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, status, location_description, photos, max_rods, created_at, updated_at, owner_id")
    .eq("status", "pending_review")
    .order("updated_at", { ascending: true });

  // Fetch owner display names
  const ownerIds = [...new Set((properties ?? []).map((p) => p.owner_id).filter((id): id is string => id != null))];
  let owners: Record<string, string> = {};

  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", ownerIds);

    owners = (profiles ?? []).reduce(
      (acc: Record<string, string>, p: { id: string; display_name: string | null }) => {
        acc[p.id] = p.display_name ?? "Unknown";
        return acc;
      },
      {} as Record<string, string>
    );
  }

  const queue = properties ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Moderation Queue
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Review and approve property listings before they go live.
          </p>
        </div>
        {queue.length > 0 && (
          <Badge variant="outline" className="bg-river/10 text-river border-river/20">
            {queue.length} pending
          </Badge>
        )}
      </div>

      {queue.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <ShieldCheck className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No items pending review
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              New property submissions will appear here for your review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {queue.map((property) => (
            <Link
              key={property.id}
              href={`/admin/moderation/${property.id}`}
            >
              <Card className="border-stone-light/20 transition-colors hover:border-river/30">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    {(property.photos?.length ?? 0) > 0 ? (
                      <img
                        src={property.photos![0]}
                        alt=""
                        className="size-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-lg bg-stone/10 text-xs text-text-light">
                        No photo
                      </div>
                    )}

                    <div className="space-y-1">
                      <h3 className="font-medium text-text-primary">
                        {property.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-text-light">
                        <span>by {property.owner_id ? (owners[property.owner_id] ?? "Unknown") : "Unclaimed"}</span>
                        {property.location_description && (
                          <span>
                            {property.location_description.length > 40
                              ? property.location_description.slice(0, 40) + "..."
                              : property.location_description}
                          </span>
                        )}
                        {property.max_rods && (
                          <span>{property.max_rods} rods</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-light">
                      Submitted {property.updated_at ? new Date(property.updated_at).toLocaleDateString() : 'N/A'}
                    </span>
                    <Button variant="outline" size="sm">
                      Review
                      <ArrowRight className="ml-1 size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
