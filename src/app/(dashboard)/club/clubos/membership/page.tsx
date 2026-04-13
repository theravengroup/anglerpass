import Link from "next/link";
import { ChevronRight, HeartPulse } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function MembershipHealthPage() {
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
          Membership Health
        </span>
      </nav>

      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Membership Health
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Engagement scores, renewal risk flags, activity trends, and member
          intelligence for your&nbsp;club.
        </p>
      </div>

      <EmptyState
        icon={HeartPulse}
        title="Membership health coming soon"
        description="See who's active, who's at risk of lapsing, and what drives engagement. Real member intelligence, not just login counts."
        iconColor="text-forest"
        iconBackground
      />
    </div>
  );
}
