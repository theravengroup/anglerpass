import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CommunicationsPage() {
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
        <span className="text-text-primary font-medium">Communications</span>
      </nav>

      <div>
        <h2 className="font-heading text-2xl font-semibold text-text-primary">
          Communications
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Broadcast announcements, send targeted messages, manage templates, and
          track engagement across your&nbsp;membership.
        </p>
      </div>

      <EmptyState
        icon={Megaphone}
        title="Communications coming soon"
        description="Club broadcasts, targeted messaging, newsletter digests, scheduled sends, and analytics — all built into your ClubOS dashboard."
        iconColor="text-river"
        iconBackground
      />
    </div>
  );
}
