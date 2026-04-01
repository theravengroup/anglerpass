import { Mail } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-parchment-light p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-river/8">
          <Mail className="size-6 text-river" />
        </div>
        <h2 className="mb-2 text-xl font-semibold font-heading text-forest-deep">
          Messages
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
          Communicate with landowners, club managers, and anglers directly
          through AnglerPass. Messaging will be available once the platform
          launches.
        </p>
      </div>
    </div>
  );
}
