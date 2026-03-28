import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Properties",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-stone/10 text-stone border-stone/20",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-river/10 text-river border-river/20",
  },
  published: {
    label: "Published",
    className: "bg-forest/10 text-forest border-forest/20",
  },
  archived: {
    label: "Archived",
    className: "bg-charcoal/10 text-charcoal border-charcoal/20",
  },
};

export default async function PropertiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let properties: {
    id: string;
    name: string;
    status: string;
    location_description: string | null;
    water_type: string | null;
    species: string[];
    capacity: number | null;
    updated_at: string;
  }[] = [];

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("properties")
      .select("id, name, status, location_description, water_type, species, capacity, updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    properties = data ?? [];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Properties
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your listed private water properties.
          </p>
        </div>
        <Link href="/landowner/properties/new">
          <Button className="bg-forest text-white hover:bg-forest/90">
            <Plus className="size-4" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <MapPin className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No properties yet
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              Add your first property to start managing access and bookings
              through AnglerPass.
            </p>
            <Link href="/landowner/properties/new">
              <Button className="mt-6 bg-forest text-white hover:bg-forest/90">
                <Plus className="size-4" />
                Add Property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => {
            const statusConfig = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.draft;
            return (
              <Link
                key={property.id}
                href={`/landowner/properties/${property.id}`}
              >
                <Card className="border-stone-light/20 transition-colors hover:border-forest/30">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-text-primary">
                          {property.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={statusConfig.className}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-text-light">
                        {property.location_description && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {property.location_description.length > 60
                              ? property.location_description.slice(0, 60) + "..."
                              : property.location_description}
                          </span>
                        )}
                        {property.water_type && (
                          <span className="capitalize">
                            {property.water_type.replace("_", " ")}
                          </span>
                        )}
                        {property.capacity && (
                          <span>
                            {property.capacity} angler{property.capacity !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-text-light">
                      Updated{" "}
                      {new Date(property.updated_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
