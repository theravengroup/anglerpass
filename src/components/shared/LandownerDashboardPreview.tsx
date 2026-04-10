import { StatCard, SectionLabel } from './DashboardPreviewHelpers';

const STATS = [
  { label: 'Revenue (Mar)', value: '$4,280', sub: '+18% vs Feb', subColor: 'text-forest' },
  { label: 'Active Bookings', value: '7', sub: '3 this week' },
  { label: 'Occupancy', value: '62%', sub: 'Apr: 85%' },
] as const;

const BOOKINGS = [
  { name: 'M. Thompson', club: 'Trout Unlimited #412', property: 'East Fork', date: 'Apr 4\u20135', rods: 2, payout: '$450' },
  { name: 'R. Chen', club: 'Madison River Club', property: 'East Fork', date: 'Apr 12', rods: 1, payout: '$225' },
  { name: 'S. Williams', club: 'Big Sky Anglers', property: 'Elk Meadow', date: 'Apr 18\u201319', rods: 3, payout: '$900' },
] as const;

const PROPERTIES = [
  { name: 'Silver Creek \u2014 East Fork', type: 'River', status: 'Active', next: 'Apr 4' },
  { name: 'Elk Meadow Spring', type: 'Spring Creek', status: 'Active', next: 'Apr 18' },
] as const;

export default function LandownerDashboardPreview() {
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
          <option value="east-fork">Silver Creek &mdash; East Fork</option>
          <option value="elk-meadow">Elk Meadow Spring</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} accentColor="text-forest" bgClass="bg-forest/[0.07]" />
        ))}
      </div>

      <SectionLabel>Upcoming Bookings</SectionLabel>
      <div className="border border-parchment rounded-lg overflow-hidden">
        {BOOKINGS.map((req, i) => (
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
              <span className="px-2.5 py-0.5 rounded bg-forest/[0.07] text-forest text-[10px] font-semibold">Confirmed</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {PROPERTIES.map((p, i) => (
          <div key={i} className="p-3.5 border border-parchment rounded-lg">
            <div className="text-[13px] font-semibold text-text-primary mb-1">{p.name}</div>
            <div className="flex gap-2 text-[11px] text-text-light">
              <span>{p.type}</span>
              <span className="text-forest">{p.status}</span>
              <span>Next: {p.next}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
