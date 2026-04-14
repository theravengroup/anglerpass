import { createAdminClient } from "@/lib/supabase/admin";
import { getCircuitState } from "@/lib/stripe/circuit-breaker";
import Link from "next/link";

/**
 * Public status page.
 *
 * Intentionally simple: one authoritative view of system health + an
 * incident history. No auth required — if the dashboard is down, users
 * must still be able to reach this page. Server-rendered on each request
 * with no caching.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface IncidentRow {
  id: string;
  title: string;
  body: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  affected_systems: string[];
  started_at: string;
  resolved_at: string | null;
}

type SystemStatus = "operational" | "degraded" | "outage";

async function getSystemStatus(): Promise<{
  overall: SystemStatus;
  database: SystemStatus;
  payments: SystemStatus;
}> {
  let database: SystemStatus = "operational";
  let payments: SystemStatus = "operational";

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("feature_flags")
      .select("key")
      .limit(1);
    if (error) database = "outage";
  } catch {
    database = "outage";
  }

  const breaker = getCircuitState();
  if (breaker.openUntil > Date.now()) {
    payments = "outage";
  } else if (breaker.consecutiveFailures > 0) {
    payments = "degraded";
  }

  const overall: SystemStatus =
    database === "outage" || payments === "outage"
      ? "outage"
      : payments === "degraded"
        ? "degraded"
        : "operational";

  return { overall, database, payments };
}

async function getIncidents(): Promise<IncidentRow[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("incidents_public")
      .select(
        "id, title, body, status, severity, affected_systems, started_at, resolved_at"
      )
      .order("started_at", { ascending: false })
      .limit(20);
    return (data ?? []) as IncidentRow[];
  } catch {
    return [];
  }
}

function StatusDot({ status }: { status: SystemStatus }) {
  const color =
    status === "operational"
      ? "bg-emerald-500"
      : status === "degraded"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <span
      aria-hidden
      className={`inline-block size-2.5 rounded-full ${color}`}
    />
  );
}

function StatusLabel({ status }: { status: SystemStatus }) {
  const label =
    status === "operational"
      ? "Operational"
      : status === "degraded"
        ? "Degraded"
        : "Outage";
  return <span className="font-mono text-xs tracking-wide">{label}</span>;
}

function severityBadge(severity: IncidentRow["severity"]) {
  const style =
    severity === "critical"
      ? "bg-red-100 text-red-900"
      : severity === "major"
        ? "bg-amber-100 text-amber-900"
        : "bg-stone-100 text-stone-700";
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}
    >
      {severity}
    </span>
  );
}

export default async function StatusPage() {
  const [status, incidents] = await Promise.all([
    getSystemStatus(),
    getIncidents(),
  ]);

  const active = incidents.filter((i) => i.resolved_at === null);
  const resolved = incidents.filter((i) => i.resolved_at !== null);

  const bannerColor =
    status.overall === "operational"
      ? "bg-emerald-50 text-emerald-900 border-emerald-200"
      : status.overall === "degraded"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-red-50 text-red-900 border-red-200";

  const bannerText =
    status.overall === "operational"
      ? "All systems operational"
      : status.overall === "degraded"
        ? "Some systems experiencing degraded performance"
        : "We are experiencing a major outage";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <div className="mb-10">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-widest text-stone hover:text-forest"
        >
          ← Back to AnglerPass
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-medium tracking-tight text-forest-deep">
          System Status
        </h1>
        <p className="mt-2 text-sm text-stone">
          Real-time health of the AnglerPass platform. Refreshes on every
          page load.
        </p>
      </div>

      <div
        className={`mb-10 rounded-lg border px-5 py-4 ${bannerColor}`}
        role="status"
      >
        <div className="flex items-center gap-3">
          <StatusDot status={status.overall} />
          <p className="font-heading text-lg">{bannerText}</p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 font-heading text-xl text-forest-deep">
          Components
        </h2>
        <ul className="divide-y divide-parchment rounded-lg border border-parchment">
          {[
            { name: "Marketing site", status: "operational" as SystemStatus },
            { name: "Database", status: status.database },
            { name: "Payments (Stripe)", status: status.payments },
            { name: "Bookings", status: status.database },
            { name: "Authentication", status: status.database },
          ].map((row) => (
            <li
              key={row.name}
              className="flex items-center justify-between px-5 py-3"
            >
              <span className="text-sm text-charcoal">{row.name}</span>
              <div className="flex items-center gap-2">
                <StatusDot status={row.status} />
                <StatusLabel status={row.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {active.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-heading text-xl text-forest-deep">
            Active incidents
          </h2>
          <ul className="space-y-4">
            {active.map((incident) => (
              <li
                key={incident.id}
                className="rounded-lg border border-amber-200 bg-amber-50 p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  {severityBadge(incident.severity)}
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-900">
                    {incident.status}
                  </span>
                </div>
                <h3 className="font-heading text-lg text-forest-deep">
                  {incident.title}
                </h3>
                <p className="mt-1 text-sm text-charcoal whitespace-pre-line">
                  {incident.body}
                </p>
                <p className="mt-3 font-mono text-[11px] text-stone">
                  Started {new Date(incident.started_at).toUTCString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-heading text-xl text-forest-deep">
          Recent history
        </h2>
        {resolved.length === 0 ? (
          <p className="text-sm text-stone">
            No incidents in the recent history window.
          </p>
        ) : (
          <ul className="space-y-3">
            {resolved.map((incident) => (
              <li
                key={incident.id}
                className="rounded-md border border-parchment px-4 py-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  {severityBadge(incident.severity)}
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">
                    Resolved
                  </span>
                </div>
                <h3 className="text-sm font-medium text-charcoal">
                  {incident.title}
                </h3>
                <p className="mt-1 font-mono text-[11px] text-stone">
                  {new Date(incident.started_at).toLocaleDateString()} —{" "}
                  {incident.resolved_at
                    ? new Date(incident.resolved_at).toLocaleDateString()
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-16 border-t border-parchment pt-6 font-mono text-[11px] text-stone">
        Machine-readable status available at{" "}
        <Link href="/api/health" className="underline hover:text-forest">
          /api/health
        </Link>
        .
      </footer>
    </main>
  );
}
