import { Mail } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border p-8 text-center"
        style={{
          background: "var(--color-parchment-light)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
          style={{ background: "rgba(20,100,126,0.08)" }}
        >
          <Mail className="size-6" style={{ color: "var(--color-river)" }} />
        </div>
        <h2
          className="mb-2 text-xl font-semibold"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--color-forest-deep)",
          }}
        >
          Messages
        </h2>
        <p
          className="mx-auto max-w-md text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Communicate with landowners, club managers, and anglers directly
          through AnglerPass. Messaging will be available once the platform
          launches.
        </p>
      </div>
    </div>
  );
}
