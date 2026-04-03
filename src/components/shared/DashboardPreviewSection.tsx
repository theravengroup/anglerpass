'use client';

/**
 * Inline dashboard preview sections for audience marketing pages.
 * Each role gets a contextual preview showing what their dashboard looks like.
 */

/* ──────────────────── Browser Chrome Wrapper ──────────────────── */

function BrowserChrome({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-parchment overflow-hidden bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-parchment-light/60 border-b border-parchment">
        <div className="flex gap-[6px]">
          <span className="size-[10px] rounded-full bg-[#ee6a5f]" />
          <span className="size-[10px] rounded-full bg-[#f5bd4f]" />
          <span className="size-[10px] rounded-full bg-[#61c454]" />
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

function StatCard({
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-text-light mb-2.5">
      {children}
    </div>
  );
}

/* ──────────────────── Landowner Preview ──────────────────── */

function LandownerDashboard() {
  return (
    <div className="p-6 min-w-[580px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-base font-semibold text-text-primary font-heading">Welcome back, James</div>
          <div className="text-xs text-text-light">Silver Creek Ranch</div>
        </div>
        <select
          disabled
          defaultValue="all"
          className="appearance-none py-1.5 pl-2.5 pr-7 rounded-md border border-parchment bg-white text-xs font-semibold font-body text-forest cursor-default bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2710%27%20height%3D%2710%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%236b6b60%27%20stroke-width%3D%272.5%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M6%209l6%206%206-6%27%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center]"
        >
          <option value="all">All Properties</option>
          <option value="east-fork">Silver Creek — East Fork</option>
          <option value="elk-meadow">Elk Meadow Spring</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Revenue (Mar)', value: '$4,280', sub: '+18% vs Feb', subColor: 'text-[#4a8c5c]' },
          { label: 'Active Bookings', value: '7', sub: '3 this week' },
          { label: 'Occupancy', value: '62%', sub: 'Apr: 85%' },
        ].map((s) => (
          <StatCard key={s.label} {...s} accentColor="text-forest" bgClass="bg-forest/[0.07]" />
        ))}
      </div>

      <SectionLabel>Upcoming Bookings</SectionLabel>
      <div className="border border-parchment rounded-lg overflow-hidden">
        {[
          { name: 'M. Thompson', club: 'Trout Unlimited #412', property: 'East Fork', date: 'Apr 4–5', rods: 2, payout: '$450' },
          { name: 'R. Chen', club: 'Madison River Club', property: 'East Fork', date: 'Apr 12', rods: 1, payout: '$225' },
          { name: 'S. Williams', club: 'Big Sky Anglers', property: 'Elk Meadow', date: 'Apr 18–19', rods: 3, payout: '$900' },
        ].map((req, i) => (
          <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${i < 2 ? 'border-b border-parchment' : ''} ${i === 0 ? 'bg-forest/[0.03]' : ''}`}>
            <div className="flex-1">
              <span className="font-semibold text-text-primary">{req.name}</span>
              <span className="text-text-light ml-1.5">{req.club}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-text-secondary">{req.property}</span>
              <span className="text-text-light">{req.date}</span>
              <span className="text-text-light">{req.rods} rod{req.rods > 1 ? 's' : ''}</span>
              <span className="font-semibold text-forest">{req.payout}</span>
              <span className="px-2.5 py-0.5 rounded bg-[#4a8c5c]/[0.07] text-[#4a8c5c] text-[10px] font-semibold">Confirmed</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {[
          { name: 'Silver Creek — East Fork', type: 'River', status: 'Active', next: 'Apr 4' },
          { name: 'Elk Meadow Spring', type: 'Spring Creek', status: 'Active', next: 'Apr 18' },
        ].map((p, i) => (
          <div key={i} className="p-3.5 border border-parchment rounded-lg">
            <div className="text-[13px] font-semibold text-text-primary mb-1">{p.name}</div>
            <div className="flex gap-2 text-[11px] text-text-light">
              <span>{p.type}</span>
              <span className="text-[#4a8c5c]">{p.status}</span>
              <span>Next: {p.next}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Club Preview ──────────────────── */

function ClubDashboard() {
  return (
    <div className="p-6 min-w-[580px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-base font-semibold text-text-primary font-heading">Madison River Club</div>
          <div className="text-xs text-text-light">Standard Plan · Cross-club access enabled</div>
        </div>
        <div className="py-1 px-3 rounded-md bg-river/[0.07] text-[11px] font-semibold text-river">48 members</div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Active Members', value: '48', sub: '3 pending', subColor: 'text-river' },
          { label: 'Waters Access', value: '5', sub: '+2 cross-club' },
          { label: 'This Month', value: '23', sub: 'fishing days booked' },
        ].map((s) => (
          <StatCard key={s.label} {...s} accentColor="text-river" bgClass="bg-river/[0.07]" />
        ))}
      </div>

      <SectionLabel>Member Applications</SectionLabel>
      <div className="border border-parchment rounded-lg overflow-hidden mb-4">
        {[
          { name: 'David Park', ref: 'Referred by J. Adams', exp: '8 yrs fly fishing', applied: 'Mar 25' },
          { name: 'Lisa Moreno', ref: 'Referred by T. Wells', exp: '12 yrs fly fishing', applied: 'Mar 22' },
          { name: 'Kevin O\u2019Brien', ref: 'Direct application', exp: '3 yrs fly fishing', applied: 'Mar 20' },
        ].map((app, i) => (
          <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${i < 2 ? 'border-b border-parchment' : ''}`}>
            <div className="flex-1">
              <span className="font-semibold text-text-primary">{app.name}</span>
              <span className="text-text-light ml-1.5">{app.ref}</span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-text-light">{app.exp}</span>
              <span className="px-2.5 py-0.5 rounded bg-river text-white text-[10px] font-semibold">Review</span>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>This Week&rsquo;s Schedule</SectionLabel>
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-text-light mb-1">{day}</div>
        ))}
        {[2, 0, 4, 1, 3, 6, 5].map((count, i) => (
          <div
            key={i}
            className={`text-center py-2 rounded-md border ${
              count > 0
                ? 'bg-river/[0.07] border-river/15'
                : 'bg-offwhite border-parchment'
            }`}
          >
            <div className={`text-base font-semibold font-heading ${count > 0 ? 'text-river' : 'text-text-light'}`}>
              {count || '\u2014'}
            </div>
            <div className="text-[9px] text-text-light">{count > 0 ? 'anglers' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Angler Preview ──────────────────── */

function AnglerDashboard() {
  return (
    <div className="p-6 min-w-[580px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-base font-semibold text-text-primary font-heading">Welcome back, Sarah</div>
          <div className="text-xs text-text-light">Madison River Club · Member since 2024</div>
        </div>
        <div className="py-1 px-3 rounded-md bg-bronze/[0.07] text-[11px] font-semibold text-bronze">3 upcoming trips</div>
      </div>

      <SectionLabel>Upcoming Trips</SectionLabel>
      <div className="flex flex-col gap-2 mb-5">
        {[
          { property: 'Silver Creek — East Fork', date: 'Apr 4–5', rods: 2, status: 'Confirmed', confirmed: true },
          { property: 'Yellowstone Spring', date: 'Apr 18', rods: 1, status: 'Confirmed', confirmed: true },
          { property: 'Gallatin Bend (cross-club)', date: 'May 2–3', rods: 2, status: 'Pending', confirmed: false },
        ].map((trip, i) => (
          <div key={i} className={`flex items-center justify-between p-3.5 border border-parchment rounded-lg ${i === 0 ? 'bg-bronze/[0.03]' : ''}`}>
            <div>
              <div className="text-[13px] font-semibold text-text-primary">{trip.property}</div>
              <div className="text-[11px] text-text-light mt-0.5">{trip.date} · {trip.rods} rod{trip.rods > 1 ? 's' : ''}</div>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold ${
              trip.confirmed
                ? 'bg-[#4a8c5c]/[0.07] text-[#4a8c5c]'
                : 'bg-bronze/[0.07] text-bronze'
            }`}>
              {trip.status}
            </span>
          </div>
        ))}
      </div>

      <SectionLabel>Available Waters</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: 'Elk Meadow Spring', type: 'Spring Creek', rate: '$225/day', species: 'Brown, Brook', avail: '12 dates in Apr' },
          { name: 'Ruby River — North', type: 'River', rate: '$300/day', species: 'Rainbow, Brown', avail: '8 dates in Apr' },
          { name: 'Columbine Reservoir', type: 'Stillwater', rate: '$175/day', species: 'Rainbow, Cutthroat', avail: '18 dates in Apr' },
          { name: 'Gallatin Bend', type: 'River · Cross-club', rate: '$350/day', species: 'Brown, Rainbow', avail: '5 dates in Apr' },
        ].map((w, i) => (
          <div key={i} className="p-3.5 border border-parchment rounded-lg">
            <div className="text-[13px] font-semibold text-text-primary mb-0.5">{w.name}</div>
            <div className="text-[11px] text-text-light mb-1.5">{w.type}</div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-bronze">{w.rate}</span>
              <span className="text-[10px] text-text-light">{w.species}</span>
            </div>
            <div className="text-[10px] text-bronze mt-1">{w.avail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Guide Preview ──────────────────── */

function GuideDashboard() {
  return (
    <div className="p-6 min-w-[580px]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-base font-semibold text-text-primary font-heading">Welcome back, Tom</div>
          <div className="text-xs text-text-light">Licensed Guide · Montana #4821</div>
        </div>
        <div className="py-1 px-3 rounded-md bg-charcoal/[0.07] text-[11px] font-semibold text-charcoal">Approved</div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { label: 'Earnings (Mar)', value: '$3,150', sub: '9 trips completed', subColor: 'text-[#4a8c5c]' },
          { label: 'Upcoming Trips', value: '4', sub: 'Next: Apr 4' },
          { label: 'Rating', value: '4.9', sub: '37 reviews' },
        ].map((s) => (
          <StatCard key={s.label} {...s} accentColor="text-charcoal" bgClass="bg-charcoal/[0.07]" />
        ))}
      </div>

      <SectionLabel>Upcoming Schedule</SectionLabel>
      <div className="border border-parchment rounded-lg overflow-hidden mb-4">
        {[
          { angler: 'M. Thompson', property: 'Silver Creek — East Fork', date: 'Apr 4–5', party: 2, rate: '$350/day' },
          { angler: 'J. Adams', property: 'Elk Meadow Spring', date: 'Apr 12', party: 1, rate: '$400/day' },
          { angler: 'K. Rivera', property: 'Ruby River — North', date: 'Apr 18', party: 3, rate: '$350/day' },
          { angler: 'S. Williams', property: 'Gallatin Bend', date: 'Apr 22–23', party: 2, rate: '$375/day' },
        ].map((trip, i) => (
          <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 text-xs ${i < 3 ? 'border-b border-parchment' : ''}`}>
            <div className="flex-1">
              <span className="font-semibold text-text-primary">{trip.angler}</span>
              <span className="text-text-light ml-1.5">{trip.property}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-text-light">{trip.date}</span>
              <span className="text-text-light">{trip.party} angler{trip.party > 1 ? 's' : ''}</span>
              <span className="font-semibold text-charcoal">{trip.rate}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3.5 border border-parchment rounded-lg">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-text-light mb-2">Approved Waters</div>
          {['Silver Creek — East Fork', 'Elk Meadow Spring', 'Ruby River — North', 'Gallatin Bend'].map((w) => (
            <div key={w} className="text-xs text-text-primary py-1 border-b border-parchment last:border-b-0">{w}</div>
          ))}
        </div>
        <div className="p-3.5 border border-parchment rounded-lg">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-text-light mb-2">Your Rates</div>
          <div className="flex justify-between py-1.5 border-b border-parchment text-xs">
            <span className="text-text-secondary">Full day</span>
            <span className="font-semibold text-charcoal">$350–400</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-parchment text-xs">
            <span className="text-text-secondary">Half day</span>
            <span className="font-semibold text-charcoal">$225</span>
          </div>
          <div className="flex justify-between py-1.5 text-xs">
            <span className="text-text-secondary">Service fee</span>
            <span className="text-text-light">10% (paid by angler)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Exported Sections ──────────────────── */

type Role = 'landowner' | 'club' | 'angler' | 'guide';

const CONFIG: Record<Role, { url: string; accentColor: string; description: string; Component: () => React.JSX.Element }> = {
  landowner: {
    url: 'app.anglerpass.com/landowner',
    accentColor: 'forest',
    description: 'Manage your properties, track bookings and revenue, and see who\u2019s on your water — all from one dashboard.',
    Component: LandownerDashboard,
  },
  club: {
    url: 'app.anglerpass.com/club',
    accentColor: 'river',
    description: 'Vet members, coordinate schedules, manage water access, and track your club\u2019s activity in one place.',
    Component: ClubDashboard,
  },
  angler: {
    url: 'app.anglerpass.com/angler',
    accentColor: 'bronze',
    description: 'Browse waters your club has access to, book fishing days, and manage your upcoming trips.',
    Component: AnglerDashboard,
  },
  guide: {
    url: 'app.anglerpass.com/guide',
    accentColor: 'charcoal',
    description: 'View your upcoming schedule, track earnings, manage your rates, and see which waters you\u2019re approved to guide.',
    Component: GuideDashboard,
  },
};

export default function DashboardPreviewSection({ role }: { role: Role }) {
  const { url, accentColor, description, Component } = CONFIG[role];

  return (
    <section className="py-[100px] bg-offwhite">
      <div className="max-w-[900px] mx-auto px-8">
        <div className="reveal text-center mb-12">
          <span className={`inline-block mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-${accentColor}`}>
            Dashboard Preview
          </span>
          <h2 className="font-heading text-[clamp(28px,3.5vw,40px)] font-medium leading-[1.15] text-forest mb-4 tracking-[-0.3px] text-balance">
            See what your dashboard looks like
          </h2>
          <p className="text-[16px] text-text-secondary max-w-[520px] mx-auto leading-[1.65]">
            {description}
          </p>
        </div>

        <div className="reveal d2">
          <BrowserChrome url={url}>
            <Component />
          </BrowserChrome>
        </div>

        <p className="text-center text-[12px] text-text-light mt-5 italic">
          Dashboards are under active development. Join the waitlist to get early access.
        </p>
      </div>
    </section>
  );
}
