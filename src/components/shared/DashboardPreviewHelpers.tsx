/**
 * Shared primitive components for dashboard preview sections.
 * Used by the role-specific dashboard previews (Landowner, Club, Angler, Guide).
 */

/* ──────────────────── Browser Chrome Wrapper ──────────────────── */

export function BrowserChrome({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-parchment overflow-hidden bg-white shadow-lg">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-parchment-light/60 border-b border-parchment">
        <div className="flex gap-[6px]">
          <span className="size-[10px] rounded-full bg-red-400" />
          <span className="size-[10px] rounded-full bg-yellow-400" />
          <span className="size-[10px] rounded-full bg-green-400" />
        </div>
        <div className="flex-1 ml-2 px-3 py-1 bg-white rounded-md text-[11px] font-mono text-text-light">
          {url}
        </div>
      </div>
      {/* Dashboard content */}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/* ──────────────────── Stat Card ──────────────────── */

export function StatCard({
  label,
  value,
  sub,
  subColor,
  accentColor,
  bgClass,
}: {
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  accentColor: string;
  bgClass: string;
}) {
  return (
    <div className={`p-3 ${bgClass} rounded-lg`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-light mb-1.5">
        {label}
      </div>
      <div className={`text-2xl font-bold font-heading ${accentColor}`}>
        {value}
      </div>
      <div className={`text-[11px] mt-0.5 ${subColor ?? 'text-text-light'}`}>
        {sub}
      </div>
    </div>
  );
}

/* ──────────────────── Section Label ──────────────────── */

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-text-light mb-2.5">
      {children}
    </div>
  );
}
