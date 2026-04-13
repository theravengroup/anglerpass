import Link from "next/link";
import { ChevronRight, Wrench } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function OperationsPage() {
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
        <span className="text-text-primary font-medium">Operations</span>
      </nav>

      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Operations
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage events, RSVPs, waitlists, waivers, and incident reports for
          your&nbsp;club.
        </p>
      </div>

      <EmptyState
        icon={Wrench}
        title="Operations coming soon"
        description="Event management with RSVPs and waitlists, waiver tracking, incident reporting, and data exports — all in one place."
        iconColor="text-bronze"
        iconBackground
      />
    </div>
  );
}
