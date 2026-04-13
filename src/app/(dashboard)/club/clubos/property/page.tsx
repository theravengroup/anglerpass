import Link from "next/link";
import { ChevronRight, Activity } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function PropertyActivityPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-text-light">
        <Link
          href="/club/clubos"
          className="transition-colors hover:text-text-secondary"
        >
          ClubOS
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">
          Property Activity
        </span>
      </nav>

      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Property Activity
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Booking patterns, utilization rates, and seasonal trends across your
          club&rsquo;s&nbsp;properties.
        </p>
      </div>

      <EmptyState
        icon={Activity}
        title="Property activity coming soon"
        description="Booking volume, rod utilization, seasonal patterns, and property-level analytics will appear here as your club generates data."
        iconColor="text-charcoal"
        iconBackground
      />
    </div>
  );
}
