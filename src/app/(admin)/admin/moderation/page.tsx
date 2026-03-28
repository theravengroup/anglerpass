import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Moderation Queue",
};

export default function ModerationPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Moderation Queue
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Review property changes, new listings, and flagged content.
        </p>
      </div>

      <Card className="border-stone-light/20">
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 border-b border-stone-light/15 px-6 py-3 text-xs font-medium uppercase tracking-wider text-text-light">
            <span>Property</span>
            <span>Submitted By</span>
            <span>Change Type</span>
            <span>Submitted</span>
            <span>Action</span>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <ShieldCheck className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 text-base font-medium text-text-primary">
              No items pending review
            </h3>
            <p className="mt-1 max-w-sm text-center text-sm text-text-secondary">
              New property submissions and flagged content will appear here for
              your review.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
