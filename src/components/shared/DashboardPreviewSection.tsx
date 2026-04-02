'use client';

/**
 * Inline dashboard preview sections for audience marketing pages.
 * Each role gets a contextual preview showing what their dashboard looks like.
 *
 * Uses inline styles inside the browser-chrome mockup to match the existing
 * DashboardPreviewModal pattern (homepage components use bespoke CSS).
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

/* ──────────────────── Landowner Preview ──────────────────── */

function LandownerDashboard() {
  const accent = '#1a3a2a';
  const accentLight = 'rgba(26,58,42,.07)';
  return (
    <div style={{ padding: 24, minWidth: 580 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>Welcome back, James</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Silver Creek Ranch</div>
        </div>
        <div style={{ position: 'relative' }}>
          <select
            disabled
            defaultValue="all"
            style={{
              appearance: 'none',
              padding: '6px 28px 6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: '#fff',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--body)',
              color: accent,
              cursor: 'default',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b6b60' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
            }}
          >
            <option value="all">All Properties</option>
            <option value="east-fork">Silver Creek — East Fork</option>
            <option value="elk-meadow">Elk Meadow Spring</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Revenue (Mar)', value: '$4,280', sub: '+18% vs Feb', subColor: '#4a8c5c' },
          { label: 'Active Bookings', value: '7', sub: '3 this week', subColor: 'var(--text-light)' },
          { label: 'Occupancy', value: '62%', sub: 'Apr: 85%', subColor: 'var(--text-light)' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.subColor, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>Pending Booking Requests</div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        {[
          { name: 'M. Thompson', club: 'Trout Unlimited #412', property: 'East Fork', date: 'Apr 4–5', rods: 2 },
          { name: 'R. Chen', club: 'Madison River Club', property: 'East Fork', date: 'Apr 12', rods: 1 },
          { name: 'S. Williams', club: 'Big Sky Anglers', property: 'Elk Meadow', date: 'Apr 18–19', rods: 3 },
        ].map((req, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', fontSize: 12, borderBottom: i < 2 ? '1px solid var(--border)' : 'none', background: i === 0 ? 'rgba(26,58,42,.03)' : 'transparent' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.name}</span>
              <span style={{ color: 'var(--text-light)', marginLeft: 6 }}>{req.club}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{req.property}</span>
              <span style={{ color: 'var(--text-light)' }}>{req.date}</span>
              <span style={{ color: 'var(--text-light)' }}>{req.rods} rod{req.rods > 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ padding: '3px 10px', borderRadius: 4, background: accent, color: '#fff', fontSize: 10, fontWeight: 600 }}>Approve</span>
                <span style={{ padding: '3px 10px', borderRadius: 4, background: 'var(--offwhite)', color: 'var(--text-light)', fontSize: 10, fontWeight: 600 }}>Decline</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { name: 'Silver Creek — East Fork', type: 'River', status: 'Active', next: 'Apr 4' },
          { name: 'Elk Meadow Spring', type: 'Spring Creek', status: 'Active', next: 'Apr 18' },
        ].map((p, i) => (
          <div key={i} style={{ padding: '14px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{p.name}</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-light)' }}>
              <span>{p.type}</span>
              <span style={{ color: '#4a8c5c' }}>{p.status}</span>
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
  const accent = '#3a6b7c';
  const accentLight = 'rgba(58,107,124,.07)';
  return (
    <div style={{ padding: 24, minWidth: 580 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>Madison River Club</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Standard Plan · Cross-club access enabled</div>
        </div>
        <div style={{ padding: '5px 12px', borderRadius: 6, background: accentLight, fontSize: 11, fontWeight: 600, color: accent }}>48 members</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Active Members', value: '48', sub: '3 pending', subColor: accent },
          { label: 'Waters Access', value: '5', sub: '+2 cross-club', subColor: 'var(--text-light)' },
          { label: 'This Month', value: '23', sub: 'fishing days booked', subColor: 'var(--text-light)' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.subColor, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>Member Applications</div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { name: 'David Park', ref: 'Referred by J. Adams', exp: '8 yrs fly fishing', applied: 'Mar 25' },
          { name: 'Lisa Moreno', ref: 'Referred by T. Wells', exp: '12 yrs fly fishing', applied: 'Mar 22' },
          { name: 'Kevin O\u2019Brien', ref: 'Direct application', exp: '3 yrs fly fishing', applied: 'Mar 20' },
        ].map((app, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', fontSize: 12, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.name}</span>
              <span style={{ color: 'var(--text-light)', marginLeft: 6 }}>{app.ref}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ color: 'var(--text-light)' }}>{app.exp}</span>
              <span style={{ padding: '3px 10px', borderRadius: 4, background: accent, color: '#fff', fontSize: 10, fontWeight: 600 }}>Review</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>This Week&rsquo;s Schedule</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-light)', marginBottom: 4 }}>{day}</div>
        ))}
        {[2, 0, 4, 1, 3, 6, 5].map((count, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '8px 0', borderRadius: 6, background: count > 0 ? `rgba(58,107,124,${0.05 + count * 0.025})` : 'var(--offwhite)', border: `1px solid ${count > 0 ? 'rgba(58,107,124,.15)' : 'var(--border)'}` }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: count > 0 ? accent : 'var(--text-light)', fontFamily: 'var(--heading)' }}>{count || '\u2014'}</div>
            <div style={{ fontSize: 9, color: 'var(--text-light)' }}>{count > 0 ? 'anglers' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Angler Preview ──────────────────── */

function AnglerDashboard() {
  const accent = '#9a7340';
  return (
    <div style={{ padding: 24, minWidth: 580 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>Welcome back, Sarah</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Madison River Club · Member since 2024</div>
        </div>
        <div style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(154,115,64,.07)', fontSize: 11, fontWeight: 600, color: accent }}>3 upcoming trips</div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>Upcoming Trips</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {[
          { property: 'Silver Creek — East Fork', date: 'Apr 4–5', rods: 2, status: 'Confirmed', statusColor: '#4a8c5c' },
          { property: 'Yellowstone Spring', date: 'Apr 18', rods: 1, status: 'Confirmed', statusColor: '#4a8c5c' },
          { property: 'Gallatin Bend (cross-club)', date: 'May 2–3', rods: 2, status: 'Pending', statusColor: accent },
        ].map((trip, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: i === 0 ? 'rgba(154,115,64,.03)' : 'transparent' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{trip.property}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{trip.date} · {trip.rods} rod{trip.rods > 1 ? 's' : ''}</div>
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 4, background: trip.statusColor + '12', color: trip.statusColor, fontSize: 10, fontWeight: 600 }}>{trip.status}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>Available Waters</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { name: 'Elk Meadow Spring', type: 'Spring Creek', rate: '$225/day', species: 'Brown, Brook', avail: '12 dates in Apr' },
          { name: 'Ruby River — North', type: 'River', rate: '$300/day', species: 'Rainbow, Brown', avail: '8 dates in Apr' },
          { name: 'Columbine Reservoir', type: 'Stillwater', rate: '$175/day', species: 'Rainbow, Cutthroat', avail: '18 dates in Apr' },
          { name: 'Gallatin Bend', type: 'River · Cross-club', rate: '$350/day', species: 'Brown, Rainbow', avail: '5 dates in Apr' },
        ].map((w, i) => (
          <div key={i} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{w.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: 6 }}>{w.type}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>{w.rate}</span>
              <span style={{ fontSize: 10, color: 'var(--text-light)' }}>{w.species}</span>
            </div>
            <div style={{ fontSize: 10, color: accent, marginTop: 4 }}>{w.avail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────── Guide Preview ──────────────────── */

function GuideDashboard() {
  const accent = '#4a4a42';
  const accentLight = 'rgba(74,74,66,.07)';
  return (
    <div style={{ padding: 24, minWidth: 580 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--heading)' }}>Welcome back, Tom</div>
          <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Licensed Guide · Montana #4821</div>
        </div>
        <div style={{ padding: '5px 12px', borderRadius: 6, background: accentLight, fontSize: 11, fontWeight: 600, color: accent }}>Approved</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Earnings (Mar)', value: '$3,150', sub: '9 trips completed', subColor: '#4a8c5c' },
          { label: 'Upcoming Trips', value: '4', sub: 'Next: Apr 4', subColor: 'var(--text-light)' },
          { label: 'Rating', value: '4.9', sub: '37 reviews', subColor: 'var(--text-light)' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '14px 12px', background: accentLight, borderRadius: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'var(--heading)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.subColor, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 10 }}>Upcoming Schedule</div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        {[
          { angler: 'M. Thompson', property: 'Silver Creek — East Fork', date: 'Apr 4–5', party: 2, rate: '$350/day' },
          { angler: 'J. Adams', property: 'Elk Meadow Spring', date: 'Apr 12', party: 1, rate: '$400/day' },
          { angler: 'K. Rivera', property: 'Ruby River — North', date: 'Apr 18', party: 3, rate: '$350/day' },
          { angler: 'S. Williams', property: 'Gallatin Bend', date: 'Apr 22–23', party: 2, rate: '$375/day' },
        ].map((trip, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', fontSize: 12, borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trip.angler}</span>
              <span style={{ color: 'var(--text-light)', marginLeft: 6 }}>{trip.property}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <span style={{ color: 'var(--text-light)' }}>{trip.date}</span>
              <span style={{ color: 'var(--text-light)' }}>{trip.party} angler{trip.party > 1 ? 's' : ''}</span>
              <span style={{ fontWeight: 600, color: accent }}>{trip.rate}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 8 }}>Approved Waters</div>
          {['Silver Creek — East Fork', 'Elk Meadow Spring', 'Ruby River — North', 'Gallatin Bend'].map((w) => (
            <div key={w} style={{ fontSize: 12, color: 'var(--text-primary)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>{w}</div>
          ))}
        </div>
        <div style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-light)', marginBottom: 8 }}>Your Rates</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Full day</span>
            <span style={{ fontWeight: 600, color: accent }}>$350–400</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Half day</span>
            <span style={{ fontWeight: 600, color: accent }}>$225</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Service fee</span>
            <span style={{ color: 'var(--text-light)' }}>10% (paid by angler)</span>
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
    description: 'Manage your properties, track bookings, and control access to your private waters — all from one dashboard.',
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
