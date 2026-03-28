import { Settings, User, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: User,
            title: "Profile",
            description: "Manage your name, bio, and contact information.",
            color: "var(--color-forest)",
          },
          {
            icon: Bell,
            title: "Notifications",
            description:
              "Configure email alerts for bookings, messages, and updates.",
            color: "var(--color-river)",
          },
          {
            icon: Shield,
            title: "Security",
            description: "Update your password and manage login sessions.",
            color: "var(--color-bronze)",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border p-6"
            style={{
              background: "var(--color-parchment-light)",
              borderColor: "var(--color-border)",
            }}
          >
            <div
              className="mb-3 flex size-10 items-center justify-center rounded-lg"
              style={{ background: `${item.color}10` }}
            >
              <item.icon className="size-5" style={{ color: item.color }} />
            </div>
            <h3
              className="mb-1 text-sm font-semibold"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-forest-deep)",
              }}
            >
              {item.title}
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl border p-6"
        style={{
          background: "var(--color-parchment-light)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-start gap-3">
          <Settings
            className="mt-0.5 size-5 shrink-0"
            style={{ color: "var(--color-text-secondary)" }}
          />
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-forest-deep)" }}
            >
              Settings will be fully available at launch
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Account management, notification preferences, and security
              settings are coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
